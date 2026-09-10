# -*- coding: utf-8 -*-
"""Generate comparison charts for the double-T panel report (palette-locked)."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['Hiragino Sans GB', 'Heiti SC', 'Arial Unicode MS', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False

# Cascade palette (from pdf.py palette.cascade)
C_DARK   = '#334650'   # HEADER_FILL
C_MID    = '#5a7886'   # COVER_BLOCK
C_LIGHT  = '#b8c8cf'   # BORDER
C_ACCENT = '#a63648'   # ACCENT
C_TEXT   = '#1a1b1c'
C_MUTED  = '#6f7578'


def style_ax(ax):
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color('#c9ced1')
    ax.spines['bottom'].set_linewidth(0.8)
    ax.tick_params(colors=C_MUTED, labelsize=11, length=0)


# ============================================================
# Chart 1: 双T板 vs 现浇 —— 相对指标对比（现浇 = 100）
# ============================================================
fig, ax = plt.subplots(figsize=(7.4, 3.9), dpi=200)

cats = ['现场模板与支撑用量', '屋面工程综合工期', '屋面综合造价', '现场人工用量']
dt_vals = [8, 65, 82, 55]          # 双T板（相对值）
xj_vals = [100, 100, 100, 100]     # 现浇基准

y_pos = list(range(len(cats)))[::-1]
bar_h = 0.32

b1 = ax.barh([y + bar_h/2 + 0.03 for y in y_pos], dt_vals, height=bar_h,
             color=C_DARK, edgecolor='none', label='双T板装配式屋面')
b2 = ax.barh([y - bar_h/2 - 0.03 for y in y_pos], xj_vals, height=bar_h,
             color=C_LIGHT, edgecolor='none', label='现浇混凝土屋面（基准 = 100）')

# 基准线
ax.axvline(x=100, color=C_MUTED, linewidth=0.9, linestyle='--', alpha=0.55)
ax.text(100, len(cats) - 0.28, '现浇基准 100', fontsize=10.5, color=C_MUTED,
        ha='center', va='bottom')

# 数值标签（双T板条端）
for y, v in zip(y_pos, dt_vals):
    pct = 100 - v
    ax.text(v + 2.5, y + bar_h/2 + 0.03, f'{v}', fontsize=11, color=C_DARK,
            va='center', fontweight='bold')
    ax.text(v + 11.5, y + bar_h/2 + 0.03, f'(降约{pct}%)', fontsize=10,
            color=C_ACCENT, va='center')

ax.set_yticks(y_pos)
ax.set_yticklabels(cats, fontsize=11.5, color=C_TEXT)
ax.set_xlim(0, 138)
ax.set_xticks([0, 25, 50, 75, 100])
ax.set_xlabel('相对指标值（现浇方案 = 100，越小越优）', fontsize=10.5, color=C_MUTED)
style_ax(ax)
ax.grid(False)

fig.text(0.015, 0.965, '双T板装配式屋面 vs 现浇混凝土屋面：主要经济指标对比',
         fontsize=14.5, fontweight='bold', color=C_TEXT, va='top')
fig.text(0.015, 0.885, '基于行业公开资料的典型工程相对值示意 · 数据来源见文末参考资料',
         fontsize=10.5, color=C_MUTED, va='top')

leg = ax.legend(loc='lower left', bbox_to_anchor=(0.0, 1.01), ncol=2,
                frameon=False, fontsize=10.5,
                handlelength=1.1, handleheight=0.9, columnspacing=1.8)
fig.tight_layout(rect=[0, 0, 1, 0.84])
fig.savefig('fig4_compare.png', facecolor='white', bbox_inches='tight', pad_inches=0.12)
plt.close(fig)
print('fig4_compare.png done')

# ============================================================
# Chart 2: 常见屋盖结构体系经济跨度范围
# ============================================================
fig, ax = plt.subplots(figsize=(7.4, 3.4), dpi=200)

systems = ['现浇混凝土框架梁板', '预应力混凝土双T板', '门式刚架（钢结构）']
spans = [(6, 12), (12, 24), (18, 36)]
colors = [C_LIGHT, C_DARK, C_MID]
labels = ['6~12 m', '12~24 m', '18~36 m']

y_pos = [2, 1, 0]
for (lo, hi), y, c, lab in zip(spans, y_pos, colors, labels):
    ax.barh(y, hi - lo, left=lo, height=0.45, color=c, edgecolor='none')
    ax.text(lo - 0.5, y, f'{lo}', fontsize=10.5, color=C_MUTED, va='center', ha='right')
    if y == 1:
        # 双T板行：范围标签置于条形上方居中，避让红色延伸段
        ax.text((lo + hi) / 2, y + 0.36, lab + '（常规）', fontsize=11, color=C_TEXT,
                va='bottom', ha='center', fontweight='bold')
    else:
        ax.text(hi + 0.5, y, lab, fontsize=11.5, color=C_TEXT, va='center', fontweight='bold')

# 双T板扩展至30m（浅色延伸段）
ax.barh(1, 30 - 24, left=24, height=0.45, color=C_ACCENT, alpha=0.75, edgecolor='none')
ax.text(30 + 0.5, 1, '最大可达 30 m', fontsize=10.5, color=C_ACCENT, va='center')

ax.set_yticks(y_pos)
ax.set_yticklabels(systems, fontsize=11.5, color=C_TEXT)
ax.set_xlim(0, 42)
ax.set_xticks([0, 6, 12, 18, 24, 30, 36])
ax.set_xlabel('经济适用跨度（m）', fontsize=10.5, color=C_MUTED)
style_ax(ax)
ax.grid(False)

fig.text(0.015, 0.97, '仓储厂房常用屋盖结构体系的经济跨度范围',
         fontsize=14.5, fontweight='bold', color=C_TEXT, va='top')
fig.text(0.015, 0.875, '双T板以 12~24 m 为主体区间，覆盖绝大多数物流仓库柱网需求',
         fontsize=10.5, color=C_MUTED, va='top')

fig.tight_layout(rect=[0, 0, 1, 0.80])
fig.savefig('fig5_span.png', facecolor='white', bbox_inches='tight', pad_inches=0.12)
plt.close(fig)
print('fig5_span.png done')
