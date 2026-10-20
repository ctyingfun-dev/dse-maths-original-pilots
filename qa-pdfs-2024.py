from pathlib import Path
import logging
import re
import subprocess
import pdfplumber
from PIL import Image, ImageDraw, ImageOps

root = Path(__file__).resolve().parent
qa = root / "tmp" / "qa-2024" / "pdf"
qa.mkdir(parents=True, exist_ok=True)
logging.getLogger("pdfminer").setLevel(logging.ERROR)
for paper, expected in [(1, 19), (2, 45)]:
    source = root / "output" / "pdf" / f"dse-original-2024-paper{paper}-practice.pdf"
    numbers, all_text = [], ""
    with pdfplumber.open(source) as pdf:
        count = len(pdf.pages)
        for index, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ""
            all_text += text
            assert not any(word in text for word in ["參考解答", "逐步提示", "批改這題", "建議評分", "例如："])
            assert not re.search(r"[橫縱横纵½]", text)
            assert "\ufffd" not in text
            found = re.findall(r"(?m)^(\d+)\.\s", text)
            numbers.extend(map(int, found))
            words = page.extract_words()
            body = [w for w in words if w["top"] < page.height - 35]
            assert body, f"Blank page {index}"
            assert min(w["x0"] for w in body) >= 39
            assert max(w["x1"] for w in body) <= page.width - 37
            print(f"P{paper} page {index}: questions {','.join(found) or 'continued'}")
        assert numbers == list(range(1, expected + 1)), numbers
        assert "2024" in all_text
        if paper == 2:
            assert "≡" in all_text
    subprocess.run(["pdftoppm", "-scale-to", "1200", "-png", str(source), str(qa / f"p{paper}")], check=True)
    images = sorted(qa.glob(f"p{paper}-*.png"))
    assert len(images) == count
    for start in range(0, count, 6):
        sheet = Image.new("RGB", (1350, 1300), "#dddddd")
        for i, image_path in enumerate(images[start:start+6]):
            image = ImageOps.contain(Image.open(image_path), (435, 620))
            x, y = (i % 3)*450, (i // 3)*650
            sheet.paste(image, (x, y+22))
            ImageDraw.Draw(sheet).text((x+10, y+4), image_path.stem, fill="black")
        sheet.save(qa / f"contact-p{paper}-{start//6+1}.jpg")
    print(f"2024 P{paper}: {count} pages, {expected} questions; page bounds and answer-free PDF verified.")
