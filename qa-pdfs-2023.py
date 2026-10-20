from pathlib import Path
import logging
import re
import sys
import pdfplumber
import pypdfium2
from PIL import Image, ImageDraw, ImageOps

root = Path(__file__).resolve().parent
qa = root / "tmp" / "qa-pdfs-times"
qa.mkdir(parents=True, exist_ok=True)
logging.getLogger("pdfminer").setLevel(logging.ERROR)
years = [2023, 2024, 2025, 2026] if "--all" in sys.argv else [2023]
for year in years:
    for paper, expected in [(1, 19), (2, 45)]:
        if year == 2026 and paper == 2:
            continue
        edition = f"{year}-" if year != 2026 else ""
        source = root / "output" / "pdf" / f"dse-original-{edition}paper{paper}-practice.pdf"
        numbers, all_text = [], ""
        with pdfplumber.open(source) as pdf:
            count = len(pdf.pages)
            for index, page in enumerate(pdf.pages, 1):
                text = page.extract_text() or ""
                all_text += text
                assert not any(word in text for word in ["參考解答", "逐步提示", "批改這題", "建議評分", "例如："])
                assert not re.search(r"[橫縱横纵½\ufffd]", text)
                numbers.extend(map(int, re.findall(r"(?m)^(\d+)\.\s", text)))
                body = [w for w in page.extract_words() if w["top"] < page.height - 35]
                assert body, f"Blank page {year}/{paper}/{index}"
                assert min(w["x0"] for w in body) >= 39
                assert max(w["x1"] for w in body) <= page.width - 37
                latin = [c for c in page.chars if re.fullmatch(r"[A-Za-z0-9]", c["text"])]
                assert all("TimesNewRoman" in c["fontname"] for c in latin), {
                    c["fontname"] for c in latin if "TimesNewRoman" not in c["fontname"]
                }
            assert numbers == list(range(1, expected + 1)), (year, paper, numbers)
            assert str(year) in all_text
            if year == 2023 and paper == 2:
                assert "≡" in all_text
                assert all_text.count("已取消") == 1
        document = pypdfium2.PdfDocument(source)
        images = []
        for index in range(len(document)):
            image = document[index].render(scale=1.5).to_pil().convert("RGB")
            output = qa / f"{year}-p{paper}-{index+1:02d}.png"
            image.save(output)
            images.append(output)
        for start in range(0, count, 6):
            sheet = Image.new("RGB", (1350, 1300), "#dddddd")
            for i, image_path in enumerate(images[start:start+6]):
                image = ImageOps.contain(Image.open(image_path), (435, 620))
                x, y = (i % 3)*450, (i // 3)*650
                sheet.paste(image, (x, y+22))
                ImageDraw.Draw(sheet).text((x+10, y+4), image_path.stem, fill="black")
            sheet.save(qa / f"contact-{year}-p{paper}-{start//6+1}.jpg")
        overview = Image.new("RGB", (1500, ((count+4)//5)*450), "#dddddd")
        for index, image_path in enumerate(images):
            image = ImageOps.contain(Image.open(image_path), (290, 420))
            x, y = (index % 5)*300, (index // 5)*450
            overview.paste(image, (x, y+20))
            ImageDraw.Draw(overview).text((x+8, y+3), str(index+1), fill="black")
        overview.save(qa / f"overview-{year}-p{paper}.jpg")
        document.close()
        print(f"{year} P{paper}: {count} pages, {expected} questions; Times New Roman glyphs, bounds and answer-free PDF verified.")
