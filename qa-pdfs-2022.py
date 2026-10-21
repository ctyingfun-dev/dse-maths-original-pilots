"""Validate the 2022 practice PDFs and render every page for visual review."""

from collections import Counter
import argparse
import hashlib
import json
import logging
from pathlib import Path
import re
import subprocess
import unicodedata

import pdfplumber
import pypdfium2
from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parent
QA = ROOT / "tmp" / "qa-pdfs-2022"
QA.mkdir(parents=True, exist_ok=True)
logging.getLogger("pdfminer").setLevel(logging.ERROR)
MM = 72 / 25.4


def normal(text):
    return unicodedata.normalize("NFKC", text)


def source_questions(paper):
    result = subprocess.run(
        [
            "node", "-e",
            "global.window={};require(process.argv[1]);"
            "process.stdout.write(JSON.stringify(window.PILOT_2022.questions));",
            str(ROOT / f"paper{paper}" / "data-2022.js"),
        ],
        check=True, capture_output=True, text=True,
    )
    return json.loads(result.stdout)


def intact_prompt_groups(questions, printed):
    issues = []
    for question in questions:
        number = question["n"]
        prompt = normal(question["prompt"])
        groups = re.findall(r"\u2220[A-Z]{3}=\d+(?:\.\d+)?\u00b0", prompt)
        groups += re.findall(r"[A-Za-z]=\{[^}]+\}", prompt)
        groups += re.findall(
            r"\b[A-Z]{2}\s*=\s*\d+(?:\.\d+)?\s*(?:cm|mm|m|kg|g)\b", prompt
        )
        groups += re.findall(r"\b[a-z]\s*=\s*[a-z]{1,3}\^[A-Za-z0-9]+\b", prompt)
        lines = [re.sub(r"\s+", "", line).replace("\u2212", "-")
                 for line in printed[number].splitlines()]
        for group in groups:
            compact = re.sub(r"\s+", "", group).replace("\u2212", "-").replace("^", "")
            if not any(compact in line for line in lines):
                issues.append({"question": number, "group": group,
                               "issue": "Mathematical condition or data set split across printed lines"})
    return issues


def render_pages(source, paper):
    paths = []
    document = pypdfium2.PdfDocument(source)
    for index in range(len(document)):
        image = document[index].render(scale=1.75).to_pil().convert("RGB")
        target = QA / f"2022-p{paper}-{index + 1:02d}.png"
        image.save(target)
        paths.append(target)
    document.close()
    for start in range(0, len(paths), 2):
        sheet = Image.new("RGB", (2120, 1530), "#dddddd")
        for offset, path in enumerate(paths[start:start + 2]):
            with Image.open(path) as source_image:
                thumbnail = ImageOps.contain(source_image, (1045, 1490))
            x = 1060 * offset + 7
            sheet.paste(thumbnail, (x, 30))
            ImageDraw.Draw(sheet).text((x + 5, 8), path.stem, fill="black")
        sheet.save(QA / f"spread-p{paper}-{start + 1:02d}.jpg", quality=92)
    overview = Image.new("RGB", (1500, ((len(paths) + 4) // 5) * 450), "#dddddd")
    for index, path in enumerate(paths):
        with Image.open(path) as source_image:
            thumbnail = ImageOps.contain(source_image, (290, 420))
        x, y = (index % 5) * 300, (index // 5) * 450
        overview.paste(thumbnail, (x, y + 22))
        ImageDraw.Draw(overview).text((x + 8, y + 4), str(index + 1), fill="black")
    overview.save(QA / f"overview-p{paper}.jpg", quality=95)
    return [str(path.relative_to(ROOT)) for path in paths]


def validate(paper, *, allow_stale=False):
    source = ROOT / "output" / "pdf" / f"dse-original-2022-paper{paper}-practice.pdf"
    inputs = [ROOT / name for name in (
        "build-paper1-pdf.cjs", "year.js", "assets/workspace.css", "assets/workspace.js",
        f"paper{paper}/index.html", f"paper{paper}/app.js", f"paper{paper}/style.css",
        f"paper{paper}/math.js", f"paper{paper}/data-2022.js", f"paper{paper}/diagrams-2022.js",
    )]
    changed_after_build = [str(path.relative_to(ROOT)) for path in inputs
                           if path.stat().st_mtime_ns > source.stat().st_mtime_ns]
    assert not changed_after_build or allow_stale, (
        f"P{paper}: inputs changed after PDF build; rebuild before final QA", changed_after_build
    )
    questions = source_questions(paper)
    expected = 19 if paper == 1 else 45
    assert len(questions) == expected
    question_pages = {}
    page_reports = []
    body_text = []
    condition_text = []
    fonts = Counter()
    current_question = None
    with pdfplumber.open(source) as document:
        for index, page in enumerate(document.pages, 1):
            assert abs(page.width - 210 * MM) < 1
            assert abs(page.height - 297 * MM) < 1
            body = page.crop((0, 0, page.width, page.height - 35))
            text = normal(body.extract_text() or "")
            assert text.strip(), f"P{paper} page {index}: blank page"
            body_text.append(text)
            assert not re.search("參考解答|逐步提示|批改這題|建議評分|例如：", text), (
                f"P{paper} page {index}: solution or UI content printed"
            )
            assert not re.search(r"[\ufffd\u00bd\u00f7]", text), (
                f"P{paper} page {index}: broken glyph or inline division"
            )
            assert not re.search(r"(?<!/)/(?!/)", text), (
                f"P{paper} page {index}: division slash printed"
            )
            # Check glyph geometry, not merged words that may span a diagram.
            chars = [char for char in body.chars if char["text"].strip()]
            assert chars
            # Raised superscripts remain on their base line; normal body lines are much farther apart.
            body_size = Counter(round(char["size"], 2) for char in chars).most_common(1)[0][0]
            condition_text.append(normal(body.extract_text(y_tolerance=body_size * 0.4) or ""))
            assert min(char["x0"] for char in chars) >= 14 * MM
            assert max(char["x1"] for char in chars) <= page.width - 14 * MM
            assert min(char["top"] for char in chars) >= 16 * MM - 1
            assert max(char["bottom"] for char in chars) <= page.height - 16 * MM + 1
            footer = page.crop((0, page.height - 35, page.width, page.height))
            footer_text = normal(footer.extract_text() or "").strip()
            assert footer_text == str(index), (paper, index, footer_text)
            footer_chars = [char for char in footer.chars if char["text"].strip()]
            center = (min(char["x0"] for char in footer_chars)
                      + max(char["x1"] for char in footer_chars)) / 2
            assert abs(center - page.width / 2) < 2
            latin = [char for char in page.chars if re.fullmatch(r"[A-Za-z0-9]", char["text"])]
            bad_fonts = sorted({char["fontname"] for char in latin
                                if "TimesNewRoman" not in char["fontname"]})
            assert not bad_fonts, (paper, index, bad_fonts)
            fonts.update(char["fontname"] for char in latin)
            numbers = [int(number) for number in re.findall(r"(?m)^(\d+)\.(?=\s|$)", text)]
            for number in numbers:
                assert number not in question_pages, (paper, number, "duplicate question")
                question_pages[number] = index
            if numbers:
                current_question = numbers[-1]
            page_reports.append({
                "page": index,
                "starts": numbers,
                "last_question": current_question,
                "body_bounds_pt": [
                    round(min(char["x0"] for char in chars), 2),
                    round(min(char["top"] for char in chars), 2),
                    round(max(char["x1"] for char in chars), 2),
                    round(max(char["bottom"] for char in chars), 2),
                ],
            })
        count = len(document.pages)
    assert list(question_pages) == list(range(1, expected + 1)), question_pages
    combined = "\n".join(body_text)
    assert "2022" in combined
    chunks = re.split(r"(?m)^(\d+)\.(?=\s|$)", combined)
    printed = {int(chunks[index]): chunks[index + 1] for index in range(1, len(chunks), 2)}
    mark_report = {}
    if paper == 1:
        for question in questions:
            number = question["n"]
            marks = [int(value) for value in re.findall(
                r"(?m)^\s*\((\d+)\s*分\)\s*$", printed[number]
            )]
            groups = question.get("markGroups")
            expected_marks = list(groups.values()) if groups else [question["marks"]]
            assert marks == expected_marks, (number, marks, expected_marks)
            assert sum(marks) == question["marks"]
            mark_report[number] = marks
        assert sum(sum(marks) for marks in mark_report.values()) == 105
        assert "已取消" not in combined
        condition = re.search(r"\u2220KJL=\d+\u00b0", questions[17]["prompt"]).group()
        assert any(condition in re.sub(r"\s+", "", line)
                   for line in printed[18].splitlines()), (
            "P1 Q18: keep the given angle condition on one printed line", condition
        )
    else:
        assert "≡" in combined
        assert combined.count("已取消") == 1
        assert "已取消" in printed[25], "Polar cancellation label must accompany question 25"
        for number, text in printed.items():
            choices = re.findall(r"(?m)^([ABCD])\.(?=\s|$)", text)
            assert choices == list("ABCD"), (number, choices)
    condition_chunks = re.split(r"(?m)^(\d+)\.(?=\s|$)", "\n".join(condition_text))
    condition_printed = {int(condition_chunks[index]): condition_chunks[index + 1]
                         for index in range(1, len(condition_chunks), 2)}
    assert set(condition_printed) == set(printed)
    layout_issues = intact_prompt_groups(questions, condition_printed)
    images = render_pages(source, paper)
    return {
        "paper": paper,
        "file": str(source.relative_to(ROOT)),
        "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "inputs_newer_than_pdf": changed_after_build,
        "input_sha256": {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest()
                         for path in inputs},
        "pages": count,
        "questions": expected,
        "marks": mark_report,
        "latin_fonts": dict(fonts),
        "page_details": page_reports,
        "layout_issues": layout_issues,
        "screenshots": images,
        "visual_review_required": True,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--paper", type=int, choices=(1, 2),
                        help="Check only this paper and preserve the other paper's QA artifacts")
    parser.add_argument("--allow-stale", action="store_true",
                        help="Allow outdated PDFs for preliminary inspection only")
    args = parser.parse_args()
    papers = (args.paper,) if args.paper else (1, 2)
    report = [validate(paper, allow_stale=args.allow_stale) for paper in papers]
    report_path = QA / (f"report-p{args.paper}.json" if args.paper else "report.json")
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    for item in report:
        print(f"2022 P{item['paper']}: {item['pages']} pages, {item['questions']} questions; "
              "marks, Times New Roman, page numbers, glyph bounds and no solutions verified.")
        print(f"SHA-256: {item['sha256']}")
        if item["inputs_newer_than_pdf"]:
            print(f"PRELIMINARY ONLY: newer inputs {item['inputs_newer_than_pdf']}")
        for issue in item["layout_issues"]:
            print(f"LAYOUT FAILURE P{item['paper']} Q{issue['question']}: {issue['group']}")
    print(f"All-page renders: {QA}")
    print(f"Report: {report_path}")
    print("Automated checks do not replace visual inspection of every rendered page.")
    if any(item["layout_issues"] for item in report):
        raise SystemExit(1)
