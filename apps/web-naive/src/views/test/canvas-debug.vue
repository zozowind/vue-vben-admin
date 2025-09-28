<script setup lang="ts">
import { nextTick, ref } from 'vue';

import html2canvas from 'html2canvas';
import { NButton, NCard, NSpace } from 'naive-ui';

import TextContentDisplay from '#/components/question/QuestionTextContentDisplay.vue';

// 简单测试内容
const testContent = ref(`# 数学题目

已知函数 $f(x) = x^2 + 2x + 1$，求解方程 $f(x) = 0$。

**解题步骤：**

1. 将方程写成标准形式：$x^2 + 2x + 1 = 0$
2. 使用求根公式：

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

其中 $a = 1$, $b = 2$, $c = 1$

3. 计算判别式：$\\Delta = b^2 - 4ac = 4 - 4 = 0$

4. 因为 $\\Delta = 0$，所以方程有一个重根：

$$x = \\frac{-2}{2} = -1$$

**答案：** $x = -1$
`);

const paperRef = ref<HTMLElement>();
const debugResult = ref('等待测试');
const debugLogs = ref<string[]>([]);

const addLog = (message: string) => {
  debugLogs.value.push(`${new Date().toLocaleTimeString()}: ${message}`);
  debugResult.value = message;
  console.log(message);
};

// 简化的canvas测试
const testBasicCanvas = async () => {
  if (!paperRef.value) {
    addLog('错误: 未找到目标元素');
    return;
  }

  try {
    debugLogs.value = [];
    addLog('开始基础Canvas测试');

    const element = paperRef.value;

    // 检查元素
    const rect = element.getBoundingClientRect();
    addLog(`元素尺寸: ${rect.width} x ${rect.height}`);
    addLog(`偏移尺寸: ${element.offsetWidth} x ${element.offsetHeight}`);

    if (rect.width === 0 || rect.height === 0) {
      addLog('错误: 元素尺寸为0');
      return;
    }

    // 检查元素是否可见
    const isVisible =
      window.getComputedStyle(element).display !== 'none' &&
      window.getComputedStyle(element).visibility !== 'hidden';
    addLog(`元素可见性: ${isVisible}`);

    // 等待渲染
    await nextTick();
    addLog('等待DOM更新完成');

    // 简单的html2canvas调用
    addLog('开始html2canvas截图...');
    const canvas = await html2canvas(element, {
      logging: true,
      scale: 1,
      backgroundColor: '#ffffff',
    });

    addLog(`Canvas生成完成: ${canvas.width} x ${canvas.height}`);

    // 检查canvas是否有内容
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((pixel, index) => {
      // 检查非透明且非白色的像素
      if (index % 4 === 3) return false; // 跳过alpha通道
      return pixel < 250; // 不是纯白色
    });

    addLog(`Canvas包含内容: ${hasContent}`);

    // 显示结果
    const resultContainer = document.querySelector('#debug-canvas-result');
    if (resultContainer) {
      resultContainer.innerHTML = '';

      // 创建显示canvas
      const displayCanvas = document.createElement('canvas');
      displayCanvas.width = Math.min(400, canvas.width);
      displayCanvas.height =
        (canvas.height * displayCanvas.width) / canvas.width;
      displayCanvas.style.border = '2px solid #007bff';
      displayCanvas.style.maxWidth = '100%';

      const displayCtx = displayCanvas.getContext('2d')!;
      displayCtx.drawImage(
        canvas,
        0,
        0,
        displayCanvas.width,
        displayCanvas.height,
      );

      resultContainer.append(displayCanvas);

      // 添加原始canvas的缩略图
      const thumbnail = document.createElement('canvas');
      thumbnail.width = 100;
      thumbnail.height = (canvas.height * 100) / canvas.width;
      thumbnail.style.border = '1px solid #ccc';
      thumbnail.style.marginTop = '10px';

      const thumbCtx = thumbnail.getContext('2d')!;
      thumbCtx.drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height);

      resultContainer.append(thumbnail);
    }

    addLog('Canvas渲染测试完成');
  } catch (error) {
    addLog(`错误: ${error}`);
    console.error('Canvas test failed:', error);
  }
};

// 测试MathJax状态
const testMathJaxStatus = () => {
  debugLogs.value = [];
  addLog('检查MathJax状态...');

  if (window.MathJax === undefined) {
    addLog('MathJax未定义');
  } else {
    addLog('MathJax已定义');
    addLog(`MathJax版本: ${window.MathJax.version || '未知'}`);
    addLog(`tex2svg可用: ${typeof window.MathJax.tex2svg === 'function'}`);
    addLog(
      `typesetPromise可用: ${typeof window.MathJax.typesetPromise === 'function'}`,
    );
  }
};

// 全局类型声明
declare global {
  interface Window {
    MathJax: any;
  }
}
</script>

<template>
  <div class="canvas-debug p-6">
    <h1 class="mb-6 text-2xl font-bold">Canvas渲染调试</h1>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- 控制面板 -->
      <div>
        <NCard title="调试控制" class="mb-4">
          <NSpace vertical>
            <NButton type="primary" @click="testBasicCanvas">
              基础Canvas测试
            </NButton>

            <NButton type="info" @click="testMathJaxStatus">
              检查MathJax状态
            </NButton>
          </NSpace>
        </NCard>

        <NCard title="调试日志">
          <div class="space-y-2">
            <div><strong>当前状态：</strong>{{ debugResult }}</div>
            <div class="mt-4">
              <strong>详细日志：</strong>
              <div
                class="mt-2 max-h-60 overflow-y-auto rounded border p-2 text-sm"
                style="background: #f5f5f5"
              >
                <div
                  v-for="(log, index) in debugLogs"
                  :key="index"
                  class="mb-1"
                >
                  {{ log }}
                </div>
              </div>
            </div>
          </div>
        </NCard>

        <NCard title="Canvas结果" class="mt-4">
          <div id="debug-canvas-result">
            <p class="text-gray-500">Canvas渲染结果将显示在这里</p>
          </div>
        </NCard>
      </div>

      <!-- 测试内容 -->
      <div>
        <NCard title="测试内容">
          <div
            ref="paperRef"
            class="bg-white p-6 shadow-sm"
            style="min-height: 300px; border: 1px solid #e0e0e0"
          >
            <TextContentDisplay
              :content="testContent"
              :display-mode="true"
              :font-size="14"
            />
          </div>
        </NCard>

        <NCard title="元素信息" class="mt-4">
          <div class="text-sm">
            <p><strong>说明：</strong>这个调试页面用于诊断canvas渲染问题</p>
            <p><strong>检查项：</strong></p>
            <ul class="ml-4 list-disc">
              <li>元素尺寸和可见性</li>
              <li>MathJax加载状态</li>
              <li>html2canvas基础功能</li>
              <li>Canvas内容检测</li>
            </ul>
          </div>
        </NCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-debug {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
