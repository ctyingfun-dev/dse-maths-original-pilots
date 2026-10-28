"""Check saved marking guides against rendered source rows; render every PDF page."""
import argparse
from collections import Counter
import hashlib
import json
import logging
from pathlib import Path
import re
import unicodedata
import pdfplumber
import pypdfium2 as pdfium
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
QA = ROOT / 'tmp' / 'solutions-pdf'
logging.getLogger('pdfminer').setLevel(logging.ERROR)

def norm(s):
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', s)).replace('\u200b', '')

def check(year, paper):
    src = json.loads((QA / f'{year}-p{paper}.json').read_text(encoding='utf-8'))
    for name, digest in src['inputs'].items():
        assert hashlib.sha256((ROOT / name).read_text(encoding='utf-8').encode()).hexdigest() == digest, f'Stale render input: {name}'
    path = ROOT / 'output' / 'pdf' / f'dse-original-{year}-paper{paper}-solutions.pdf'
    images = QA / f'{year}-p{paper}'
    images.mkdir(exist_ok=True)
    previous_images={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in images.glob('page-*.png')}
    issues = []
    with pdfplumber.open(path) as doc:
        assert len(doc.pages) == src['pages'], 'Unexpected blank or overflow pages'
        texts = [norm(p.extract_text(x_tolerance=1, y_tolerance=3) or '') for p in doc.pages]
        for i, page in enumerate(doc.pages):
            assert abs(page.width - 595.28) < 1 and abs(page.height - 841.89) < 1
            assert f'{year}OriginalP{paper}-{i+1}/{len(doc.pages)}' in texts[i], f'Footer p{i+1}'
            assert '參考解答及評分參考(非官方)' in texts[i], f'Header p{i+1}'
            bad = [c for c in page.chars if c['text'].strip() and (c['x0'] < 38 or c['x1'] > 557 or c['top'] < 38 or c['bottom'] > 830)]
            if bad: issues.append({'page':i+1,'type':'bounds','text':''.join(c['text'] for c in bad)})
            latin = [c for c in page.chars if re.fullmatch('[A-Za-z0-9]', c['text'])]
            if any('TimesNewRoman' not in c['fontname'].replace('-', '') for c in latin):
                issues.append({'page':i+1,'type':'font','fonts':sorted(set(c['fontname'] for c in latin))})
        # Verify each answer row on its assigned page, separately from labels and awards.
        for row in src['rowEvidence']:
            expected=norm(row['text'])
            actual=norm(doc.pages[row['page']-1].crop(tuple(row['bounds'])).extract_text(x_tolerance=1,y_tolerance=3) or '')
            if expected not in actual:
                # Fractions/MathML can reorder the PDF reading stream; retain a character audit.
                missing=Counter(expected)-Counter(actual)
                if missing: issues.append({'page':row['page'],'question':row['question'],'type':'missing-text','missing':dict(missing),'text':expected})
        for number in src['questions']:
            assert any(row['question']==number for row in src['rowEvidence'])
        if paper==2:
            assert len(src['keyEvidence'])==45
            for key in src['keyEvidence']:
                assert norm(doc.pages[0].crop(tuple(key['bounds'])).extract_text() or '')==key['answer'], f"Key Q{key['question']}"
                number=norm(doc.pages[0].crop(tuple(key['numberBounds'])).extract_text() or '').replace('已取消','')
                assert number==str(key['question']), f"Key number Q{key['question']}"
                rows=[r for r in src['rowEvidence'] if r['question']==key['question'] and r['marks']]
                assert len(rows)==1 and rows[0]['marks']==key['answer']
                row=rows[0]
                assert norm(doc.pages[row['page']-1].crop(tuple(row['marksBounds'])).extract_text() or '')==key['answer'], f"Answer Q{key['question']}"
        if paper==1:
            for page_index in range(len(doc.pages)):
                expected=Counter(row['marks'] for row in src['rowEvidence'] if row['page']==page_index+1)
                actual=Counter(re.findall(r'\b\d+(?:[MA])?\b', doc.pages[page_index].crop((511,100,557,800)).extract_text() or ''))
                assert all(actual[m]>=n for m,n in expected.items() if m), f'Marks p{page_index+1}'
    doc=pdfium.PdfDocument(path)
    # Remove only this document's generated renders, so old final pages cannot be reviewed by mistake.
    for old in images.iterdir():
        if re.fullmatch(r'(?:page-\d+\.png|contact-\d+\.jpg)',old.name): old.unlink()
    thumbs=[]
    changed_pages=[]
    for i in range(len(doc)):
        image=doc[i].render(scale=1.4).to_pil().convert('RGB')
        image.save(images / f'page-{i+1:02d}.png')
        if previous_images.get(f'page-{i+1:02d}.png')!=hashlib.sha256((images / f'page-{i+1:02d}.png').read_bytes()).hexdigest(): changed_pages.append(i+1)
        image.thumbnail((600,850))
        labelled=Image.new('RGB',(620,880),'#dddddd')
        labelled.paste(image,((620-image.width)//2,25))
        ImageDraw.Draw(labelled).text((12,6),f'{year} P{paper} - page {i+1}',fill='black')
        thumbs.append(labelled)
    for start in range(0,len(thumbs),4):
        sheet=Image.new('RGB',(1240,1760),'#ddd')
        for offset,thumb in enumerate(thumbs[start:start+4]): sheet.paste(thumb,((offset%2)*620,(offset//2)*880))
        sheet.save(images / f'contact-{start//4+1:02d}.jpg',quality=90)
    report={'year':year,'paper':paper,'pages':len(doc),'questions':len(src['questions']),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'issues':issues,'changed_pages':changed_pages}
    (QA / f'{year}-p{paper}-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'{year} P{paper}: {len(doc)} pages; {len(issues)} issues',flush=True)
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--year',type=int);parser.add_argument('--paper',type=int)
    args=parser.parse_args()
    reports=[check(y,p) for y in ([args.year] if args.year else range(2016,2027)) for p in ([args.paper] if args.paper else (1,2))]
    if any(r['issues'] for r in reports): raise SystemExit(1)
