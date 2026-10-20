from pathlib import Path
import hashlib
import logging
import re
import subprocess

import pdfplumber
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
QA = ROOT / "tmp" / "qa-2025"
QA.mkdir(parents=True, exist_ok=True)
logging.getLogger("pdfminer").setLevel(logging.ERROR)
for paper, expected in [(1, 19), (2, 45)]:
    source = ROOT / "output" / "pdf" / f"dse-original-2025-paper{paper}-practice.pdf"
    previous = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in QA.glob(f"pdf-p{paper}-*.png")}
    subprocess.run(["pdftoppm", "-scale-to", "1000", "-png", str(source), str(QA / f"pdf-p{paper}")], check=True)
    numbers = []
    with pdfplumber.open(source) as pdf:
        print(f"Paper {paper}: {len(pdf.pages)} A4 pages")
        all_text = ""
        for index, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ""
            all_text += text
            assert not any(word in text for word in ["參考解答", "逐步提示", "批改這題", "建議評分"])
            assert not re.search(r"[橫縱横纵½]", text), f"Old notation on page {index}"
            assert "\ufffd" not in text
            found = re.findall(r"(?m)^(\d+)\.\s", text)
            numbers.extend(map(int, found))
            words = page.extract_words()
            body = [w for w in words if w["top"] < page.height - 35]
            assert body, f"Blank page {index}"
            assert min(w["x0"] for w in body) >= 40
            assert max(w["x1"] for w in body) <= page.width - 38
            print(f"  page {index}: questions {','.join(found) or 'continued'}; last text y={max(w['bottom'] for w in body):.1f}")
        assert numbers == list(range(1, expected + 1)), numbers
        if paper == 2:
            assert "≡" in all_text, "Identity symbol missing from Paper 2"
        page_count = len(pdf.pages)
    digits = len(str(page_count))
    images = [QA / f"pdf-p{paper}-{n:0{digits}d}.png" for n in range(1, page_count + 1)]
    changed = [p.name for p in images if hashlib.sha256(p.read_bytes()).hexdigest() != previous.get(p.name)]
    print("  Rendered pages changed since last visual review:", ", ".join(changed) or "none")
    for start in range(0, len(images), 4):
        sheet = Image.new("RGB", (1414, 2040), "white")
        draw = ImageDraw.Draw(sheet)
        for offset, path in enumerate(images[start:start+4]):
            with Image.open(path) as image:
                x, y = (offset % 2) * 707, (offset // 2) * 1020
                sheet.paste(image, (x, y + 20))
                draw.text((x + 12, y + 2), path.stem, fill="black")
        sheet.save(QA / f"contact-p{paper}-{start//4+1}.jpg")
