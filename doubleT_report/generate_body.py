# -*- coding: utf-8 -*-
"""
双T板在仓储物流厂房中的优势 —— 图文分析报告（正文 PDF）
Pipeline: ReportLab body -> (cover merged later via pypdf)
"""
import os
import sys
import hashlib

PDF_SKILL_DIR = "/Users/fengyuan/.zcode/cli/plugins/cache/zcode-plugins-official/document-skills/0.1.0/skills/pdf"
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, "scripts"))

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image,
    PageBreak, CondPageBreak, KeepTogether, HRFlowable,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from PIL import Image as PILImage

from pdf import install_font_fallback

# ============ 字体注册（macOS 系统字体） ============
pdfmetrics.registerFont(TTFont('HeiTi', '/System/Library/Fonts/STHeiti Medium.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('SongTi', '/System/Library/Fonts/Supplemental/Songti.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('TNR', '/System/Library/Fonts/Supplemental/Times New Roman.ttf'))
pdfmetrics.registerFont(TTFont('TNR-Bold', '/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf'))

registerFontFamily('HeiTi', normal='HeiTi', bold='HeiTi')
registerFontFamily('SongTi', normal='SongTi', bold='HeiTi')   # 中文加粗用黑体表现
registerFontFamily('TNR', normal='TNR', bold='TNR-Bold')

install_font_fallback()

# ============ 级联调色板（pdf.py palette.cascade 输出） ============
PAGE_BG      = colors.HexColor('#eff0f1')
CARD_BG      = colors.HexColor('#e4e7e8')
TABLE_STRIPE = colors.HexColor('#ebedee')
HEADER_FILL  = colors.HexColor('#334650')
COVER_BLOCK  = colors.HexColor('#5a7886')
BORDER       = colors.HexColor('#b8c8cf')
ICON         = colors.HexColor('#52798c')
ACCENT       = colors.HexColor('#a63648')
TEXT_PRIMARY = colors.HexColor('#1a1b1c')
TEXT_MUTED   = colors.HexColor('#6f7578')

# ============ 版面参数 ============
PAGE_W, PAGE_H = A4
LM = RM = 2.0 * cm
TM, BM = 2.3 * cm, 2.1 * cm
AVAIL_W = PAGE_W - LM - RM          # ~482 pt
MAX_KEEP_HEIGHT = PAGE_H * 0.4

ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')
OUT_PDF = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'body.pdf')

DOC_TITLE = '双T板在仓储物流厂房中的优势'
DOC_SERIES = '装配式建筑应用系列研究'

# ============ 样式 ============
S = {}
S['h1'] = ParagraphStyle('H1', fontName='HeiTi', fontSize=19, leading=27,
                         textColor=HEADER_FILL, spaceBefore=18, spaceAfter=4,
                         wordWrap='CJK')
S['h2'] = ParagraphStyle('H2', fontName='HeiTi', fontSize=14, leading=21,
                         textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=6,
                         wordWrap='CJK')
S['body'] = ParagraphStyle('Body', fontName='SongTi', fontSize=10.5, leading=17.5,
                           textColor=TEXT_PRIMARY, alignment=TA_LEFT,
                           firstLineIndent=21, spaceAfter=8, wordWrap='CJK')
S['body0'] = ParagraphStyle('Body0', parent=S['body'], firstLineIndent=0)
S['bullet'] = ParagraphStyle('Bullet', fontName='SongTi', fontSize=10.5, leading=17,
                             textColor=TEXT_PRIMARY, leftIndent=18, firstLineIndent=0,
                             spaceAfter=5, wordWrap='CJK')
S['caption'] = ParagraphStyle('Caption', fontName='HeiTi', fontSize=8.5, leading=12,
                              textColor=TEXT_MUTED, alignment=TA_CENTER, wordWrap='CJK')
S['th'] = ParagraphStyle('TH', fontName='HeiTi', fontSize=9.5, leading=13,
                         textColor=colors.white, alignment=TA_CENTER, wordWrap='CJK')
S['td'] = ParagraphStyle('TD', fontName='SongTi', fontSize=9.5, leading=13.5,
                         textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
S['tdc'] = ParagraphStyle('TDC', parent=S['td'], alignment=TA_CENTER)
S['stat_num'] = ParagraphStyle('StatNum', fontName='HeiTi', fontSize=17, leading=21,
                               textColor=ACCENT, alignment=TA_CENTER, wordWrap='CJK')
S['stat_lab'] = ParagraphStyle('StatLab', fontName='HeiTi', fontSize=8.5, leading=12,
                               textColor=TEXT_MUTED, alignment=TA_CENTER, wordWrap='CJK')
S['quote'] = ParagraphStyle('Quote', fontName='SongTi', fontSize=10, leading=16.5,
                            textColor=TEXT_PRIMARY, leftIndent=24, rightIndent=12,
                            firstLineIndent=0, spaceBefore=4, spaceAfter=4,
                            wordWrap='CJK')
S['ref'] = ParagraphStyle('Ref', fontName='SongTi', fontSize=9, leading=14.5,
                          textColor=TEXT_PRIMARY, firstLineIndent=-24, leftIndent=24,
                          spaceAfter=4, wordWrap='CJK')
S['toc_title'] = ParagraphStyle('TocTitle', fontName='HeiTi', fontSize=17, leading=24,
                                textColor=HEADER_FILL, spaceAfter=12, wordWrap='CJK')

# ============ 文档模板（自动目录 + 封面页码偏移） ============
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            # +1：正文并入封面后，物理页码整体偏移一页
            self.notify('TOCEntry', (level, text, self.page + 1, key))

def on_page(canvas, doc):
    canvas.saveState()
    # 页眉
    canvas.setFont('HeiTi', 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LM, PAGE_H - TM + 22, DOC_TITLE)
    canvas.drawRightString(PAGE_W - RM, PAGE_H - TM + 22, DOC_SERIES)
    canvas.setStrokeColor(ICON)
    canvas.setLineWidth(1.2)
    canvas.line(LM, PAGE_H - TM + 16, PAGE_W - RM, PAGE_H - TM + 16)
    # 页脚
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.6)
    canvas.line(LM, BM - 18, PAGE_W - RM, BM - 18)
    canvas.setFont('HeiTi', 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LM, BM - 30, '基于行业公开资料整理 · 2026 年 9 月')
    canvas.drawRightString(PAGE_W - RM, BM - 30, '第 %d 页' % (canvas.getPageNumber() + 1))
    canvas.restoreState()

# ============ 辅助函数 ============
def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def safe_keep_together(elements):
    total_h = 0
    for el in elements:
        try:
            w, h = el.wrap(AVAIL_W, PAGE_H)
            total_h += h
        except Exception:
            total_h += 60
    if total_h <= MAX_KEEP_HEIGHT:
        return [KeepTogether(elements)]
    elif len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    return list(elements)

def H1(story, text):
    story.append(CondPageBreak(110))
    h = add_heading(text, S['h1'], level=0)
    rule = HRFlowable(width='100%', thickness=1.2, color=ICON,
                      spaceBefore=0, spaceAfter=10)
    story.extend(safe_keep_together([h, rule]))

def H2(story, text):
    story.append(CondPageBreak(70))
    story.append(add_heading(text, S['h2'], level=1))

def P(story, text, style='body'):
    story.append(Paragraph(text, S[style]))

def fig(story, filename, caption, max_w=None, max_h=None):
    path = os.path.join(ASSETS, filename)
    pil = PILImage.open(path)
    ow, oh = pil.size
    mw = max_w or (AVAIL_W * 0.96)
    mh = max_h or (PAGE_H * 0.32)
    ratio = min(mw / ow, mh / oh)
    img = Image(path, width=ow * ratio, height=oh * ratio)
    img.hAlign = 'CENTER'
    cap = Paragraph(caption, S['caption'])
    story.append(Spacer(1, 14))
    story.extend(safe_keep_together([img, Spacer(1, 6), cap]))
    story.append(Spacer(1, 14))

def make_table(story, header, rows, ratios, caption, align_map=None):
    """header: list[str]; rows: list[list[str]]; ratios sum to 1.0"""
    col_w = [r * AVAIL_W * 0.98 for r in ratios]
    data = [[Paragraph('<b>%s</b>' % h, S['th']) for h in header]]
    for row in rows:
        cells = []
        for j, cell in enumerate(row):
            st = S['tdc'] if (align_map and align_map[j] == 'c') else S['td']
            cells.append(Paragraph(cell, st))
        data.append(cells)
    t = Table(data, colWidths=col_w, hAlign='CENTER', repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = TABLE_STRIPE if i % 2 == 0 else colors.white
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    cap = Paragraph(caption, S['caption'])
    story.append(Spacer(1, 16))
    if len(rows) <= 15:
        story.extend(safe_keep_together([t, Spacer(1, 6), cap]))
    else:
        story.append(t)
        story.append(Spacer(1, 6))
        story.append(cap)
    story.append(Spacer(1, 16))

def stat_row(story, stats):
    """stats: list[(num, label)] x4"""
    cells = []
    for num, lab in stats:
        inner = Table(
            [[Paragraph('<b>%s</b>' % num, S['stat_num'])],
             [Paragraph(lab, S['stat_lab'])]],
            colWidths=[AVAIL_W * 0.225])
        inner.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), PAGE_BG),
            ('BOX', (0, 0), (-1, -1), 0.8, BORDER),
            ('LINEABOVE', (0, 0), (-1, 0), 2.2, ICON),
            ('TOPPADDING', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 8),
            ('TOPPADDING', (0, -1), (-1, -1), 1),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        cells.append(inner)
    outer = Table([cells], colWidths=[AVAIL_W * 0.25] * 4, hAlign='CENTER')
    outer.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(Spacer(1, 8))
    story.append(KeepTogether(outer))
    story.append(Spacer(1, 14))

# ================================================================
# story 组装
# ================================================================
story = []

# ---------- 目录页 ----------
story.append(Paragraph('目 录', S['toc_title']))
story.append(HRFlowable(width='100%', thickness=1.2, color=ICON, spaceAfter=14))
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle('TOC1', fontName='HeiTi', fontSize=11.5, leading=22,
                   leftIndent=6, textColor=TEXT_PRIMARY, wordWrap='CJK'),
    ParagraphStyle('TOC2', fontName='SongTi', fontSize=10.5, leading=19,
                   leftIndent=26, textColor=TEXT_MUTED, wordWrap='CJK'),
]
toc.dotsMinLevel = 0
story.append(toc)
story.append(PageBreak())

# ---------- 一、双T板概述 ----------
H1(story, '一、双T板概述')

H2(story, '1.1 什么是双T板')
P(story, '双T板（Double-T Panel）是一种预应力混凝土预制构件，因其横截面由一块宽大的面板与两根平行的肋梁构成、'
         '形似两个并列的字母"T"而得名。它将"板"与"梁"两种结构功能合二为一：面板直接承担屋面（或楼面）荷载并'
         '兼作建筑面层，肋梁则作为受力梁跨越柱距，将荷载传递至屋面梁或柱头。这种"板梁合一、横向与纵向共同承重"'
         '的截面形式，使双T板成为大跨度建筑中力学性能与经济性兼备的水平结构构件。')
P(story, '标准双T板的面板宽度通常为 2.4 米（部分产品为 3.0 米），肋梁高度随跨度在 400~700 毫米之间调整。'
         '板内沿肋梁方向布置先张法预应力钢绞线，混凝土强度等级一般为 C40~C50。构件在工厂长线台座上一次整体成型，'
         '出厂时已完成预应力张拉与蒸汽养护。')
fig(story, 'fig1_section.png', '图 1  双T板截面构造与屋面布置示意', max_w=AVAIL_W * 0.98, max_h=310)

H2(story, '1.2 生产工艺与质量特征')
P(story, '双T板采用先张法预应力工艺生产：在工厂长线台座上先张拉预应力钢绞线，再浇筑混凝土并进行蒸汽养护，'
         '待混凝土达到规定强度后放张，预应力通过粘结力自锚于混凝土中。整个生产过程在工厂标准化完成，具有三方面'
         '质量特征：')
for b in [
    '<b>质量稳定：</b>模具化、流水化生产，配合蒸汽养护，混凝土强度与预应力建立质量波动小，可有效规避现浇结构常见的蜂窝、漏振、养护不足等现场质量通病；',
    '<b>构件精度高：</b>截面尺寸与预埋件定位由钢模保证，误差以毫米计，为现场快速安装创造条件；',
    '<b>出厂即成品：</b>构件运抵现场即可吊装，无需现场支模、绑扎与浇筑，从根本上改变了屋面工程的作业方式。',
]:
    story.append(Paragraph('● ' + b, S['bullet']))
story.append(Spacer(1, 4))

H2(story, '1.3 在装配式建筑体系中的定位')
P(story, '在我国大力发展装配式建筑与智能建造的政策背景下，双T板是装配式混凝土结构中应用最成熟的大跨度'
         '水平构件之一。它与预制柱、预制屋面梁（或钢梁）组成"柱—梁—双T板"的装配式排架体系，屋面板即为承重'
         '结构层，无需另设次梁与现浇叠合层。凭借跨度大、安装快、造价省的特点，双T板已在工业厂房、物流仓储、'
         '体育场馆、会展中心等大空间建筑中获得广泛应用，其中仓储物流厂房正是其最具代表性的应用场景。')

# ---------- 二、仓储物流厂房的屋盖需求 ----------
H1(story, '二、仓储物流厂房的屋盖需求特点')
P(story, '近年来，电子商务、连锁零售与准时制供应链的快速发展，推动我国仓储物流设施进入高速度、规模化建设'
         '阶段，高标准仓库（"高标仓"）、自动化立体库、冷链物流中心等新型业态不断涌现。仓储物流厂房在结构上'
         '呈现出与一般工业厂房不同的需求组合，对屋盖体系提出了六方面核心要求。')
make_table(story,
    ['仓储物流厂房核心诉求', '双T板屋盖体系的响应'],
    [
        ['大跨度无柱空间：货架排布与叉车通道要求尽量少的内柱，柱距越大越好',
         '常规跨度 12~24 米，最大可达 30 米，屋盖下无次梁、无内柱，空间通净'],
        ['足够的附加荷载：消防喷淋、桥架、输送线、吊顶及屋面光伏等悬挂荷载',
         '预应力肋梁承载富余，可按工程要求预留吊挂点位与附加均布荷载'],
        ['建设工期短：物流项目投资回收压力大，普遍要求"当年开工、当年投产"',
         '工厂预制、现场吊装，免除支模与 28 天养护，主体工期缩短约 30% 以上'],
        ['净高与消防：货架不断升高，屋面板底需平整并满足消防排烟与喷淋空间',
         '板梁合一不设次梁，板底平整，净高利用率高，便于管线与消防设施布置'],
        ['防火与耐久：仓库属重要火灾荷载场所，构件需满足相应耐火等级',
         '混凝土本身为不燃材料，耐火极限一般可达 1.0~1.5 小时并可按需加强'],
        ['运维经济：屋面全寿命周期内应少维护、抗渗漏、适应物流设备更新',
         '预应力构件抗裂性好、刚度大，正常使用条件下设计使用年限可达 50 年'],
    ],
    [0.46, 0.54],
    '表 1  仓储物流厂房屋盖需求与双T板响应匹配表')

P(story, '从表 1 可以看出，仓储物流厂房的六大核心诉求与双T板的性能特点高度契合。这并非偶然——双T板体系'
         '最初正是在工业与物流大空间建筑的需求牵引下发展起来的，其截面形式、跨度区间与安装方式，均是围绕'
         '"大空间、快建造、重悬挂"这类场景优化的结果。')

# ---------- 三、核心优势 ----------
H1(story, '三、双T板在仓储物流厂房中的核心优势')
stat_row(story, [
    ('12~24 m', '常规跨度范围<br/>（最大约 30 m）'),
    ('缩短 30%+', '主体结构工期<br/>（对比现浇方案）'),
    ('节省 15~20%', '屋面综合造价<br/>（对比现浇方案）'),
    ('约 24 小时', '吊装完成后即可<br/>承受施工荷载'),
])

H2(story, '3.1 大跨度无柱空间，提升仓储效率')
P(story, '跨度是衡量仓储建筑效率的第一结构指标。双T板以 12~24 米的常规跨度覆盖了绝大多数物流仓库的柱网'
         '需求：一座平面进深 24 米的单层仓库，采用双T板屋盖后进深方向可以一跨过、不设内柱；而采用常规小柱网'
         '（6~9 米）现浇方案时，同样进深需要设置 2~3 根内柱。')
P(story, '内柱对仓储效率的影响是多重而直接的：其一，柱位阻断货架连续排布，迫使货架"断行"，每根内柱周边'
         '都会形成无法利用的存储死角；其二，柱位压缩叉车通道与消防通道的布置自由度，降低动线效率；其三，'
         '自动化立体库中柱位还会限制货架与堆垛机的标准模块化布置。图 2 直观对比了两种方案的剖面效果——'
         '在相同 24 米进深下，双T板方案的货架可以连续通长布置，库容利用率与作业效率明显更优。此外，双T板'
         '板梁合一、板底无次梁外露，屋面底部平整，同样的结构高度下可获得更高的有效净高，为高位货架与'
         '升降设备留出空间。')
fig(story, 'fig3_space.png', '图 2  常规柱网与双T板大跨度屋盖的仓储空间效率对比', max_w=AVAIL_W * 0.97, max_h=230)

H2(story, '3.2 承载能力强，适应重载与悬挂需求')
P(story, '双T板的肋梁相当于两根内置的预应力混凝土梁，其抗弯刚度与承载能力远高于普通屋面板。通过调整肋高、'
         '混凝土强度与预应力配筋，双T板可以覆盖从轻钢屋面到重载屋面的不同荷载等级。对仓储物流厂房而言，'
         '这一承载能力直接转化为三方面的适应性：')
for b in [
    '<b>悬挂设备：</b>消防喷淋管网、电缆桥架、照明与广播系统、轻型输送线等均可吊挂于双T板肋梁或面板预埋件上，避免另设吊挂钢结构；',
    '<b>屋面光伏：</b>当前分布式光伏在物流园区大规模铺开，双T板屋面可在设计阶段预留光伏系统荷载（一般按 0.3~0.8 kN/m<super>2</super> 附加荷载考虑），光伏支架直接锚固于面板，实现"仓库+电站"一体化；',
    '<b>局部集中荷载：</b>排烟口、检修吊点、檐口设备等局部荷载可通过肋梁局部加强予以满足。',
]:
    story.append(Paragraph('● ' + b, S['bullet']))
story.append(Spacer(1, 4))
P(story, '同时，先张法预应力使构件在正常使用状态下处于受压状态，抗裂性能好、挠度小，长期荷载作用下能够保持'
         '良好的平整度，这对依赖板底平整性的消防喷淋与管线安装尤为重要。')

H2(story, '3.3 施工速度快，显著缩短建设工期')
P(story, '工期是物流仓储项目的生命线——早投产一个月，就意味着早一个月产生租金与运营收入。双T板屋面将'
         '传统现浇屋面的"支模—绑筋—浇筑—养护"长链条工序，压缩为"运输—吊装—嵌缝"三步，其施工流程如图 3 所示。')
fig(story, 'fig2_flow.png', '图 3  双T板屋面装配式施工流程', max_w=AVAIL_W * 0.98, max_h=200)
P(story, '与现浇屋面相比，双T板方案的速度优势体现在三个环节。其一为<b>免支模</b>：省去满堂支撑架的搭设与拆除。'
         '其二为<b>免养护</b>：构件出厂前已达到设计强度，吊装就位、连接锚固后约 24 小时即可上人作业并承受施工荷载，'
         '而现浇屋面浇筑后需 28 天标准养护方可承载。其三为<b>平行施工</b>：构件在工厂预制的同时，现场可平行推进基础与'
         '柱梁施工，屋面工程几乎不占用关键线路。行业工程实践表明，采用双T板屋面可使厂房主体结构工期缩短'
         '约 30% 以上，单栋万平方米级仓库从开工到交付普遍可控制在数月之内。')

H2(story, '3.4 综合经济性好')
P(story, '双T板的经济性并非来自单方材料价格的下降，而是"板梁合一+工厂预制+快速安装"带来的全链条成本节约。'
         '图 4 汇总了双T板装配式屋面与现浇混凝土屋面在主要经济指标上的典型对比关系。')
fig(story, 'fig4_compare.png', '图 4  双T板装配式屋面与现浇混凝土屋面主要经济指标对比（现浇 = 100）',
    max_w=AVAIL_W * 0.95, max_h=250)
P(story, '具体而言：省去次梁与叠合层后，混凝土与钢筋用量下降，屋面结构自重减轻，下部柱基亦可相应优化；'
         '免支模直接消除了模板与支撑架的材料与人工费用；工期缩短带来管理费、财务成本与提前投产收益的双重'
         '改善。综合测算，双T板屋面较现浇屋面方案的综合造价一般可低 15%~20%。表 2 从施工维度给出了两种'
         '方案的系统性对照。')
make_table(story,
    ['对比维度', '双T板装配式屋面', '现浇混凝土屋面'],
    [
        ['支模工序', '免支模，无需满堂支撑架', '需满堂支模架，搭拆耗时耗工'],
        ['承载时间', '吊装后约 24 小时即可承载', '浇筑后需 28 天标准养护'],
        ['主体工期', '缩短约 30% 以上', '工序串联，工期较长'],
        ['质量稳定性', '工厂预制，蒸汽养护，质量稳定', '受现场工艺与天气影响较大'],
        ['现场湿作业', '仅板缝灌缝等少量湿作业', '大量现场浇筑湿作业'],
        ['综合造价', '较现浇方案低约 15%~20%', '模板人工与工期成本高'],
    ],
    [0.20, 0.40, 0.40],
    '表 2  双T板装配式屋面与现浇混凝土屋面施工对照表',
    align_map=['c', 'l', 'l'])

H2(story, '3.5 防火耐火与耐久性')
P(story, '仓储建筑内存放大量可燃物资，火灾荷载密度高，对结构耐火性能的要求显著高于一般民用建筑。双T板为'
         '钢筋混凝土构件，本身属于不燃材料，不似轻型钢屋面需依赖防火涂料维持耐火极限，也避免了涂料老化'
         '带来的后期维护负担。普通双T板屋面的耐火极限一般可达 1.0~1.5 小时，通过增大钢筋保护层厚度或'
         '辅以板底防火措施，可满足更高耐火等级的要求。')
P(story, '耐久性方面，预应力混凝土构件抗裂性能优异，正常使用条件下不出现受力裂缝，钢筋与钢绞线得到混凝土'
         '保护，设计使用年限可达 50 年，全寿命周期内基本免维护。相比之下，轻钢屋面需定期防腐维护、彩钢瓦'
         '面层存在一定年限后的更换需求，钢结构的全寿命维护成本明显更高。')

H2(story, '3.6 绿色低碳，契合装配式政策')
P(story, '双T板体系与国家"双碳"目标及装配式建筑政策高度契合：工厂化生产使模板、钢筋、混凝土的利用率'
         '大幅提高，建筑垃圾与施工废弃物显著减少；现场以机械化吊装取代大量湿作业，扬尘、噪声与废水排放'
         '降低；混凝土构件本身可回收利用。在各地装配式建筑评价标准中，预制双T板屋盖的采用率是装配率'
         '评分的重要得分项。对投资方而言，选择双T板既是技术经济决策，还可为项目争取装配式建筑的'
         '相关政策支持。')

# ---------- 四、典型应用场景 ----------
H1(story, '四、典型应用场景剖析')
P(story, '结合当前仓储物流行业的建设实践，双T板屋盖体系已在以下五类场景中得到成熟应用。表 3 汇总了各场景'
         '的典型跨度与双T板的价值要点。')
make_table(story,
    ['应用场景', '典型跨度', '核心诉求', '双T板价值要点'],
    [
        ['高标准物流仓库<br/>（高标仓）', '12~24 m', '净高、大柱距、消防与工期',
         '无柱大空间+板底平整，货架与喷淋布置自由且交付快'],
        ['自动化立体库<br/>（AS/RS）', '21~24 m', '大跨无柱、屋面悬挂、净高',
         '货架模块化连续布置，屋面吊挂消防与检修设施'],
        ['冷链物流仓库', '12~18 m', '保温气密、温度变形控制',
         '板缝嵌缝处理后气密性好，混凝土结构热惰性有利控温'],
        ['电商分拨中心 / 快递转运场', '18~24 m', '极短工期、分期快速扩建',
         '预制吊装+约24小时承载，支持"当年建成、当年使用"'],
        ['屋顶分布式光伏仓库', '12~24 m', '屋面附加荷载与锚固',
         '预留光伏荷载，面板可直接锚固光伏支架，仓顶变电站'],
    ],
    [0.20, 0.11, 0.26, 0.43],
    '表 3  双T板在仓储物流典型场景中的应用要点',
    align_map=['l', 'c', 'l', 'l'])

H2(story, '4.1 高标准物流仓库（高标仓）')
P(story, '高标仓是我国物流设施供给侧结构性升级的主力产品，其特征是净高 9 米以上、柱距不小于 12 米×12 米、'
         '消防等级高、交付周期短。双T板屋盖恰好同时满足"大柱距+高净高+快工期"三项硬指标：24 米跨度屋盖下'
         '货架区通视无柱，板底平整的屋面便于自动喷淋管网与桥架沿板缝方向通长敷设，装配化施工保障园区多栋'
         '仓库的滚动快速交付。')

H2(story, '4.2 自动化立体仓库（AS/RS）')
P(story, '自动化立体库的货架系统通常自立承载，但对屋盖提出了更严苛的空间要求：堆垛机轨道与货架顶部需要'
         '与屋面结构保持安全距离，屋盖结构越高越平整，可利用的立体空间就越大。双T板大跨屋盖省去了次梁'
         '与水平支撑，避免设备顶部与结构构件的碰撞干涉；喷淋、检修桥、照明等吊挂设施可预埋于肋梁，'
         '为自动化系统预留整齐的安装界面。')

H2(story, '4.3 冷链物流仓库')
P(story, '冷链仓库屋面常年经受低温与温差循环作用，对屋面结构的气密性与温度变形控制要求高。双T板屋面经'
         '板缝嵌缝与整体防水保温构造处理后，形成连续的屋面封闭层；混凝土结构较大的热惰性有助于减小库内'
         '温度波动、降低制冷能耗；预应力构件的抗裂性能也减少了低温环境下裂缝渗漏的风险。')

H2(story, '4.4 电商分拨中心与快递转运场')
P(story, '电商大促周期决定了分拨中心的建设节奏——项目往往要求在数月内完成从开工到投运。双T板"工厂预制'
         '与现场施工平行推进"的模式，配合约 24 小时即可承载的特性，使屋面工程不再构成关键线路；对于分期'
         '建设的转运园区，标准化双T板构件可跨期复用模具与供应链，扩建批次的建设速度进一步加快。')

H2(story, '4.5 屋顶分布式光伏一体化（当前热点场景）')
P(story, '在"整县推进"与绿电交易政策推动下，物流园区屋顶已成为分布式光伏的主要载体之一。相比轻钢彩钢屋面'
         '常常需要结构加固才能加装光伏，双T板屋面只需在设计阶段预留光伏荷载（约 0.3~0.8 kN/m<super>2</super>），'
         '即可实现光伏支架在混凝土面板上的直接锚固，连接可靠、不损伤防水层的使用寿命，"上存货物、上发电"'
         '的仓光一体化模式正在成为新建高标仓的常见配置。')

# ---------- 五、选型与实施要点 ----------
H1(story, '五、选型与实施要点')

H2(story, '5.1 选型参数参考')
P(story, '双T板选型应以跨度、附加荷载、防火等级三项指标为主导，结合柱网模数确定板宽与板缝分块。表 4 给出'
         '了常用跨度档位的参考参数，具体应以厂家标准图集与施工图设计为准。')
make_table(story,
    ['标准跨度', '标准板宽', '参考肋高', '屋面附加均布荷载参考', '单块吊装重量参考'],
    [
        ['12 m', '2.4 m', '约 400 mm', '0.5~1.0 kN/m<super>2</super>', '约 8~10 t'],
        ['15 m', '2.4 m', '约 450 mm', '0.5~1.0 kN/m<super>2</super>', '约 10~13 t'],
        ['18 m', '2.4 m', '约 550 mm', '0.5~1.0 kN/m<super>2</super>', '约 13~16 t'],
        ['21 m', '2.4 m', '约 600 mm', '0.5~1.0 kN/m<super>2</super>', '约 16~19 t'],
        ['24 m', '2.4 m', '约 650~700 mm', '0.5~1.0 kN/m<super>2</super>', '约 18~22 t'],
    ],
    [0.16, 0.14, 0.20, 0.28, 0.22],
    '表 4  双T板常用跨度选型参考表（以厂家标准图集与工程设计为准）',
    align_map=['c', 'c', 'c', 'c', 'c'])

H2(story, '5.2 运输与吊装组织')
P(story, '大跨度双T板属于大型预制构件，运输与吊装是实施环节的关键：18 米以上构件公路运输需核查沿线桥涵'
         '限界并办理超限运输手续，合理规划构件运输半径（经济运输半径一般宜控制在 300 公里以内）；吊装宜选用'
         '与构件重量匹配的履带吊或汽车吊，24 米构件通常需百吨级以上吊车；现场按"随吊随运"组织车辆进出场，'
         '减少堆场占用。吊装顺序应与屋面梁就位、临时稳定措施统筹编排，确保当日闭合作业面。')

H2(story, '5.3 节点连接与防水构造')
P(story, '双T板搁置于屋面梁（或钢梁）上，每端搁置长度一般不小于 80~100 毫米，并通过预埋件焊接或螺栓'
         '连接实现与下部结构的可靠锚固，保证屋盖的整体性与抗震性能。板缝处理是防水成败的关键：板缝采用'
         '高等级细石混凝土或灌浆料二次灌缝，缝面上部辅以密封膏嵌缝，屋面防水层在板缝两侧按规范附加增强层；'
         '屋脊、檐口、采光带与变形缝等部位应采用与双T板匹配的标准节点构造。只要构造到位，双T板屋面的'
         '防渗漏性能可优于彩钢屋面，并长期保持稳定。')

H2(story, '5.4 常见问题与对策')
for b in [
    '<b>板缝渗漏：</b>严控灌缝混凝土密实度与密封施工质量，运维阶段定期检查密封膏老化情况，及时局部更换；',
    '<b>温度变形：</b>超长仓库纵向按规范设置伸缩缝或后浇带，屋面采用保温层隔离温度作用，减小板缝变形；',
    '<b>与钢结构配合：</b>双T板亦可搁置于钢梁形成"钢梁+混凝土双T板"混合体系，兼具钢构施工速度与混凝土屋面的耐火耐久优势，节点按专用图集设计；',
    '<b>适用边界：</b>跨度超过 30 米或有强腐蚀环境的仓库，应进行专项技术经济比较，必要时选用钢结构网架等其他屋盖体系。',
]:
    story.append(Paragraph('● ' + b, S['bullet']))
story.append(Spacer(1, 4))

# ---------- 六、结论 ----------
H1(story, '六、结论')
P(story, '仓储物流厂房对屋盖结构的核心诉求可概括为"空间要大、承载要强、建造要快、全寿命要省"。'
         '双T板凭借板梁合一的截面效率与工厂预制的建造方式，对这四项诉求给出了均衡而出色的回答：')
for b in [
    '<b>空间维度</b>——12~24 米常规跨度实现无柱大空间，货架连续布置、净高利用率高，直接提升库容与作业效率；',
    '<b>承载维度</b>——预应力肋梁承载能力强、抗裂性好，从容应对消防、悬挂设备与屋面光伏等附加荷载；',
    '<b>建造维度</b>——免支模、免养护、约 24 小时承载，主体工期缩短 30% 以上，契合物流项目快速投产的刚性需求；',
    '<b>经济维度</b>——综合造价较现浇方案低 15%~20%，混凝土构件防火耐久、基本免维护，全寿命周期成本优势显著。',
]:
    story.append(Paragraph('● ' + b, S['bullet']))
story.append(Spacer(1, 4))
P(story, '在装配式建筑与"双碳"政策持续推进、高标仓与屋顶光伏加速落地的当前背景下，双T板屋盖体系'
         '正从工业厂房的传统选择成长为仓储物流基础设施的主流结构方案之一。建议投资与设计单位在 12~24 米'
         '跨度的单层仓储项目中优先论证双T板方案，从而在工期、成本与运营效率上获得可观的'
         '综合收益。')

# ---------- 参考资料 ----------
H1(story, '参考资料')
refs = [
    '[1] 中建装配式建筑发展研究院. 大跨度预应力双T板的发展与应用[EB/OL]. 装配式建筑网, 2020-04. https://ind-building.cscec.com/hyzx/202004/3056115.html.',
    '[2] 百度百科. 双T板[EB/OL]. https://baike.baidu.com/item/双T板/959458.',
    '[3] 自动化网. 2026年热门的混凝土双T板/大跨度双T板厂家对比推荐[EB/OL]. https://www.zidonghua.com.cn/news/manufactcn86/84839.html.',
    '[4] 网经社. 仓库双T板应用场景与选型关注点[EB/OL]. https://www.100ec.cn/shangxun/2096287592797601794.html.',
    '[5] 江苏某预制构件厂商. 江苏混凝土双T板源头厂家：大跨度建筑构件应用与选型关注点[EB/OL]. 搜狐网.',
    '[6] 大跨度预应力承重钢筋混凝土双T板: 中国, CN104405079A[P].',
]
for r in refs:
    story.append(Paragraph(r, S['ref']))
story.append(Spacer(1, 10))
story.append(Paragraph('说明：本报告基于行业公开资料整理撰写，文中工期、造价等对比数据为行业典型相对值，'
                       '具体工程项目应以设计文件与厂家技术资料为准。', S['caption']))

# ============ 构建 ============
doc = TocDocTemplate(
    OUT_PDF, pagesize=A4,
    leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM,
    title=DOC_TITLE, author='Z.ai', creator='Z.ai',
    subject='双T板（预应力混凝土双T板）在仓储物流厂房中的应用优势分析',
)
doc.multiBuild(story, onFirstPage=on_page, onLaterPages=on_page)
print('body.pdf built:', OUT_PDF)

from pypdf import PdfReader
print('pages:', len(PdfReader(OUT_PDF).pages))
