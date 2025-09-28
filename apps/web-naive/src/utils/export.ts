import type { PaperType } from '#/config/options';

import { nextTick } from 'vue';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { checkMathJaxRenderStatus } from './render';

const toPDF = async (
  element: HTMLElement,
  paperType: PaperType,
  filename: string,
) => {
  const state = {
    exporting: false,
    result: '',
    error: null,
  };

  if (state.exporting) {
    return state;
  }

  state.exporting = true;
  state.result = '正在生成PDF...';

  try {
    // 等待所有内容渲染完成
    await nextTick();

    // 智能检查是否需要MathJax渲染
    const needsMathjaxRender = checkMathJaxRenderStatus(element);
    if (needsMathjaxRender && window.MathJax && window.MathJax.typesetPromise) {
      console.warn('Applying MathJax rendering as needed');
      try {
        await window.MathJax.typesetPromise([element]);
      } catch (error) {
        console.warn('MathJax typeset failed:', error);
      }
    } else {
      console.warn(
        'Skipping MathJax re-rendering - already processed by ContentRenderer',
      );
    }

    // 等待DOM稳定
    await new Promise((resolve) => setTimeout(resolve, 1000));

    state.result = '正在转换为图片...';

    const canvas = await toCanvas(element);

    state.result = '正在生成PDF文件...';

    const pdf = canvasToPDF(canvas, paperType);

    state.result = 'PDF生成完成...';

    pdf.save(filename);
    state.result = 'PDF导出完成';
  } catch (error) {
    console.error('PDF生成失败:', error);
    state.result = `PDF生成失败: ${error}`;
  } finally {
    state.exporting = false;
  }
  return state;
};

const toCanvas = async (element: HTMLElement) => {
  // 使用简化的配置确保兼容性
  const canvas = await html2canvas(element, {
    logging: true,
    scale: 2, // 提高分辨率
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: false,
  });

  return canvas;
};

// 左右边距，单位mm
const leftMargin = 10;
const rightMargin = 10;
// 上下边距，单位mm
const topMargin = 10;
const bottomMargin = 10;

// 计算位置尺寸
const canvasToPDF = (canvas: HTMLCanvasElement, paperType: PaperType) => {
  const pdf = new jsPDF({
    orientation: paperType.height > paperType.width ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [paperType.width, paperType.height],
  });

  const pageWidth = paperType.width - leftMargin - rightMargin;
  const pageHeight = paperType.height - topMargin - bottomMargin;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  if (pageWidth <= 0) {
    throw new Error('页面宽度小于等于0');
  }

  // 如果内容高度超过单页，需要分页
  const totalPages = Math.ceil(imgHeight / pageHeight);
  for (let i = 0; i < totalPages; i++) {
    if (i > 0) {
      pdf.addPage(paperType.name);
    }
    const sourceY = (i * pageHeight * canvas.height) / imgHeight;
    const sourceHeight = Math.min(
      (pageHeight * canvas.height) / imgHeight,
      canvas.height - sourceY,
    );

    // 创建当前页面的canvas片段
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d')!;
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;

    // 绘制当前页面的内容
    pageCtx.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sourceHeight,
      0,
      0,
      canvas.width,
      sourceHeight,
    );

    const pageImgData = pageCanvas.toDataURL('image/png', 1);
    const pageImgHeight = (sourceHeight * pageWidth) / canvas.width;

    pdf.addImage(
      pageImgData,
      'PNG',
      leftMargin,
      topMargin,
      pageWidth,
      pageImgHeight,
    );
  }
  return pdf;
};

export { toPDF };
