// 检查是否需要重新渲染MathJax
const checkMathJaxRenderStatus = (element: HTMLElement): boolean => {
  // 检查是否已经有ContentRenderer处理过的SVG
  // ContentRenderer使用MathJax.tex2svg生成的SVG会有data-mml-node="math"属性
  const contentRendererSvgs = element.querySelectorAll(
    'svg[data-mml-node="math"]',
  );

  // 检查是否有TextContentDisplay组件渲染的内容
  const hasTextContentDisplay =
    element.querySelector('.text-content-display') !== null;

  console.warn('MathJax render status:', {
    contentRendererSvgCount: contentRendererSvgs.length,
    hasTextContentDisplay,
    shouldSkipRendering:
      contentRendererSvgs.length > 0 || hasTextContentDisplay,
  });

  // 如果已经有ContentRenderer生成的SVG或TextContentDisplay组件，则跳过MathJax.typesetPromise
  // 因为ContentRenderer已经处理了所有数学公式
  if (contentRendererSvgs.length > 0 || hasTextContentDisplay) {
    return false; // 不需要重新渲染
  }

  // 如果没有找到已处理的内容，可能需要MathJax处理
  return true;
};

export { checkMathJaxRenderStatus };
