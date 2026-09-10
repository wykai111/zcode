// components/Spinner.tsx - 统一菊花加载(iOS UIActivityIndicator 风格)
// 所有网络加载场景复用,替代各页面自定义的圆环/文字样式。
// 尺寸通过 CSS 变量 --spin-size 传递,花瓣按比例自适应,避免不同尺寸下错位抖动。
/** 菊花加载圈。size 可选,单位 px(默认 28,约原尺寸 70%) */
export function Spinner({ size = 28 }: { size?: number }) {
  return (
    <div
      className="loader-spinner"
      style={{ ['--spin-size' as string]: `${size}px` }}
      aria-label="loading"
    >
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  );
}
