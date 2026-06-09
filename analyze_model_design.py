
from docx import Document
doc = Document(r'c:\Users\ASUS\Documents\Codex\Losarijaya2\TA2_14694_REVISI_v2.docx')
NS_WP_I = '{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}inline'
NS_A_EXT = '{http://schemas.openxmlformats.org/drawingml/2006/main}ext'

def get_img_size(p):
    for inline in p._element.findall(f'.//{NS_WP_I}'):
        ext = inline.find(f'.//{NS_A_EXT}')
        if ext is not None:
            w = int(ext.get('cx', 0)) / 914400
            h = int(ext.get('cy', 0)) / 914400
            return w, h
    return None, None

print('=== STRUKTUR MODEL DESIGN SECTION (P366-P415) ===')
for i in range(366, 416):
    p = doc.paragraphs[i]
    w, h = get_img_size(p)
    if w:
        img_mark = f' [IMG {w:.2f}x{h:.2f}in]'
    else:
        img_mark = ''
    print(f'[P{i}][{p.style.name}]{img_mark} | {p.text[:70]}')
