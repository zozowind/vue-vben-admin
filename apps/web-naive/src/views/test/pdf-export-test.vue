<script setup lang="ts">
import { nextTick, ref } from 'vue';

import html2canvas from 'html2canvas';
import { NButton, NCard, NSpace } from 'naive-ui';

import TextContentDisplay from '#/components/question/QuestionTextContentDisplay.vue';
import { toPDF } from '#/utils/export';

// 测试内容
const testContent = ref(`# 数学公式PDF导出测试

这是一个包含数学公式的测试文档，用于验证PDF导出功能。

## 行内公式测试

基础公式：$E = mc^2$

复杂行内公式：$\\sqrt{a^2 + b^2} = c$

## 块级公式测试

积分公式：
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

求和公式：
$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$

分数公式：
$$\\frac{d}{dx}\\left(\\frac{x^2 + 1}{x - 1}\\right) = \\frac{(2x)(x-1) - (x^2+1)(1)}{(x-1)^2}$$
分数公式：
$$\\frac{d}{dx}\\left(\\frac{x^2 + 1}{x - 1}\\right) = \\frac{(2x)(x-1) - (x^2+1)(1)}{(x-1)^2}$$
分数公式：
$$\\frac{d}{dx}\\left(\\frac{x^2 + 1}{x - 1}\\right) = \\frac{(2x)(x-1) - (x^2+1)(1)}{(x-1)^2}$$
分数公式：
$$\\frac{d}{dx}\\left(\\frac{x^2 + 1}{x - 1}\\right) = \\frac{(2x)(x-1) - (x^2+1)(1)}{(x-1)^2}$$
分数公式：
$$\\frac{d}{dx}\\left(\\frac{x^2 + 1}{x - 1}\\right) = \\frac{(2x)(x-1) - (x^2+1)(1)}{(x-1)^2}$$

## Markdown内容测试

**粗体文本**和*斜体文本*

- 列表项1
- 列表项2
- 列表项3

\`行内代码\`示例

\`\`\`javascript
function test() {
  console.log('代码块测试');
}
\`\`\`
`);

const paperRef = ref<HTMLElement>();
const exporting = ref(false);
const exportResult = ref('');

// PDF导出函数
const exportToPDF = async () => {
  if (exporting.value || !paperRef.value) return;

  const fileName = `数学公式测试_${new Date().toLocaleDateString('zh-CN')}.pdf`;

  const state = await toPDF(
    paperRef.value,
    {
      name: 'a4',
      width: 210,
      height: 297,
    },
    fileName,
  );
  exporting.value = state.exporting;
  exportResult.value = state.result;
};

// 测试canvas渲染
const testCanvasRender = async () => {
  if (!paperRef.value) {
    exportResult.value = 'Canvas测试失败: 未找到目标元素';
    return;
  }

  try {
    exportResult.value = '正在测试Canvas渲染...';

    const element = paperRef.value;

    // 检查元素尺寸
    const rect = element.getBoundingClientRect();
    console.warn('Element dimensions:', {
      width: rect.width,
      height: rect.height,
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
    });

    if (rect.width === 0 || rect.height === 0) {
      exportResult.value = 'Canvas测试失败: 元素尺寸为0';
      return;
    }

    // 检查元素可见性
    const computedStyle = window.getComputedStyle(element);
    const isVisible =
      computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
    console.warn('Element visibility:', {
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      isVisible,
    });

    // 等待内容渲染完成
    await nextTick();
    exportResult.value = '检查MathJax渲染状态...';

    // 智能检查是否需要MathJax渲染
    const needsMathjaxRender = checkMathJaxRenderStatus(element);
    if (needsMathjaxRender && window.MathJax && window.MathJax.typesetPromise) {
      exportResult.value = '应用MathJax渲染...';
      try {
        await window.MathJax.typesetPromise([element]);
        console.warn('MathJax typeset completed');
      } catch (mathError) {
        console.warn('MathJax typeset failed:', mathError);
      }
    } else {
      console.warn(
        'Skipping MathJax re-rendering - already processed by ContentRenderer',
      );
    }

    // 等待DOM稳定
    await new Promise((resolve) => setTimeout(resolve, 1000));
    exportResult.value = '开始Canvas截图...';

    // 使用与canvas-debug完全相同的配置
    console.warn('Starting html2canvas with config:', {
      logging: true,
      scale: 1,
      backgroundColor: '#ffffff',
    });

    const canvas = await html2canvas(element, {
      logging: true,
      scale: 1,
      backgroundColor: '#ffffff',
    });

    console.warn('Canvas created:', {
      width: canvas.width,
      height: canvas.height,
      hasData: canvas.toDataURL().length > 1000,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      exportResult.value = 'Canvas测试失败: 生成的canvas尺寸为0';
      return;
    }

    // 检查canvas是否有内容（与canvas-debug相同的检测）
    const canvasCtx = canvas.getContext('2d')!;
    const imageData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((pixel, index) => {
      // 检查非透明且非白色的像素
      if (index % 4 === 3) return false; // 跳过alpha通道
      return pixel < 250; // 不是纯白色
    });

    console.warn('Canvas content analysis:', {
      hasContent,
      totalPixels: imageData.data.length / 4,
      dataUrlLength: canvas.toDataURL().length,
    });

    // 创建一个临时的canvas来显示结果
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = Math.min(400, canvas.width);
    resultCanvas.height = (canvas.height * resultCanvas.width) / canvas.width;
    resultCanvas.style.border = '1px solid #ccc';
    resultCanvas.style.maxWidth = '100%';

    const ctx = resultCanvas.getContext('2d')!;

    // 设置白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

    // 绘制原始canvas
    ctx.drawImage(canvas, 0, 0, resultCanvas.width, resultCanvas.height);

    // 显示结果
    const resultContainer = document.querySelector('#canvas-result');
    if (resultContainer) {
      resultContainer.innerHTML = '';

      // 添加一些调试信息
      const debugInfo = document.createElement('div');
      debugInfo.innerHTML = `
        <p><strong>调试信息:</strong></p>
        <p>原始Canvas: ${canvas.width} x ${canvas.height}</p>
        <p>显示Canvas: ${resultCanvas.width} x ${resultCanvas.height}</p>
        <p>数据长度: ${canvas.toDataURL().length} 字符</p>
      `;
      debugInfo.style.fontSize = '12px';
      debugInfo.style.color = '#666';
      debugInfo.style.marginBottom = '10px';

      resultContainer.append(debugInfo);
      resultContainer.append(resultCanvas);
    }

    exportResult.value = 'Canvas渲染测试完成';
  } catch (error) {
    console.error('Canvas渲染测试失败:', error);
    exportResult.value = `Canvas测试失败: ${error}`;
  }
};

// 全局类型声明
declare global {
  interface Window {
    MathJax: any;
  }
}

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
</script>

<template>
  <div class="pdf-export-test p-6">
    <h1 class="mb-6 text-2xl font-bold">PDF导出功能测试</h1>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- 控制面板 -->
      <div>
        <NCard title="测试控制" class="mb-4">
          <NSpace vertical>
            <NButton type="primary" :loading="exporting" @click="exportToPDF">
              导出为PDF
            </NButton>

            <NButton type="info" :loading="exporting" @click="testCanvasRender">
              测试Canvas渲染
            </NButton>
          </NSpace>
        </NCard>

        <NCard title="测试结果">
          <div class="space-y-4">
            <div><strong>状态：</strong>{{ exportResult || '等待测试' }}</div>

            <div id="canvas-result">
              <p class="text-gray-500">Canvas渲染结果将显示在这里</p>
            </div>
          </div>
        </NCard>

        <NCard title="测试说明" class="mt-4">
          <div class="space-y-2 text-sm">
            <p><strong>测试目的：</strong></p>
            <ul class="ml-4 list-disc space-y-1">
              <li>验证数学公式在PDF中的显示效果</li>
              <li>检查html2canvas对SVG的支持</li>
              <li>测试不同主题模式下的导出效果</li>
              <li>验证分页功能</li>
            </ul>

            <p class="mt-4"><strong>注意事项：</strong></p>
            <ul class="ml-4 list-disc space-y-1">
              <li>确保MathJax已完全加载和渲染</li>
              <li>SVG颜色在不同主题下的显示</li>
              <li>长内容的分页处理</li>
            </ul>
          </div>
        </NCard>
      </div>

      <!-- 内容预览 -->
      <div>
        <NCard title="测试内容预览">
          <div
            ref="paperRef"
            class="bg-white p-8 shadow-lg"
            style="min-height: 400px; max-width: 210mm; margin: 0 auto"
          >
            <TextContentDisplay
              :content="testContent"
              :display-mode="true"
              :font-size="14"
            />
          </div>
        </NCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdf-export-test {
  max-width: 1400px;
  margin: 0 auto;
}

/* 确保打印样式不影响测试 */
@media print {
  .pdf-export-test {
    display: none;
  }
}
</style>
