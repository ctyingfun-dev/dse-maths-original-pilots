from pathlib import Path
import logging
import re
import subprocess

import pdfplumber
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
QA = ROOT / "tmp" / "qa-2026"
QA.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / "output" / "pdf" / "dse-original-paper1-practice.pdf"
logging.getLogger("pdfminer").setLevel(logging.ERROR)
subprocess.run(["pdftoppm", "-scale-to", "1000", "-png", str(SOURCE), str(QA / "page")], check=True)
numbers = []
with pdfplumber.open(SOURCE) as pdf:
    print(f"2026 Paper 1: {len(pdf.pages)} A4 pages")
    all_text = ""
    for index, page in enumerate(pdf.pages, 1):
        text = page.extract_text() or ""
        all_text += text
        assert not any(term in text for term in ["參考解答", "逐步提示", "批改這題", "建議評分", "例如："])
        assert not re.search(r"[橫縱横纵½]", text), f"Old notation on page {index}"
        assert "\ufffd" not in text
        assert abs(page.width - 595.28) < 1 and abs(page.height - 841.89) < 1
        found = re.findall(r"(?m)^(\d+)\.\s", text)
        numbers.extend(map(int, found))
        body = [w for w in page.extract_words() if w["top"] < page.height - 35]
        assert body, f"Blank page {index}"
        assert min(w["x0"] for w in body) >= 40
        assert max(w["x1"] for w in body) <= page.width - 38
        print(f"  page {index}: questions {','.join(found) or 'continued'}")
    assert numbers == list(range(1, 20)), numbers
    assert all(term in all_text for term in ["備份", "劇院", "樹脂", "陶藝", "信封", "918", "75000"])
    count = len(pdf.pages)
digits = len(str(count))
for start in range(0, count, 4):
    sheet = Image.new("RGB", (1414, 2040), "white")
    draw = ImageDraw.Draw(sheet)
    for offset, index in enumerate(range(start + 1, min(start + 5, count + 1))):
        x, y = (offset % 2) * 707, (offset // 2) * 1020
        with Image.open(QA / f"page-{index:0{digits}d}.png") as image:
            sheet.paste(image, (x, y + 20))
        draw.text((x + 12, y + 2), f"Page {index}", fill="black")
    sheet.save(QA / f"contact-{start // 4 + 1}.jpg")
