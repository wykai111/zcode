# -*- coding: utf-8 -*-
"""Merge cover.pdf + body.pdf -> final PDF (A4-normalized, with metadata)."""
from pypdf import PdfReader, PdfWriter, Transformation

A4_W, A4_H = 595.28, 841.89

def normalize_page_to_a4(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 0.1 or abs(h - A4_H) > 0.1:
        sx, sy = A4_W / w, A4_H / h
        page.add_transformation(Transformation().scale(sx=sx, sy=sy))
        page.mediabox.lower_left = (0, 0)
        page.mediabox.upper_right = (A4_W, A4_H)
    return page

writer = PdfWriter()
cover_page = PdfReader('cover.pdf').pages[0]
writer.add_page(normalize_page_to_a4(cover_page))
for page in PdfReader('body.pdf').pages:
    writer.add_page(normalize_page_to_a4(page))

writer.add_metadata({
    '/Title': '双T板在仓储物流厂房中的优势',
    '/Author': 'Z.ai',
    '/Creator': 'Z.ai',
    '/Subject': '预应力混凝土双T板在仓储物流厂房中的应用优势分析（图文报告）',
})
with open('双T板在仓储物流厂房中的优势.pdf', 'wb') as f:
    writer.write(f)

r = PdfReader('双T板在仓储物流厂房中的优势.pdf')
print('final pages:', len(r.pages))
for i, p in enumerate(r.pages):
    print(i + 1, float(p.mediabox.width), float(p.mediabox.height))
