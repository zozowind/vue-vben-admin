<script lang="ts" setup>
import { ref } from 'vue';

import { NButton, NCard, NDivider, NInput, NSpace } from 'naive-ui';

import ContentsView from '#/components/content/ContentsView.vue';

interface ContentItem {
  type: 'file' | 'image' | 'text';
  content: string;
  format?: 'base64' | 'latex' | 'path' | 's3' | 'text' | 'url';
  attributes?: Record<string, string>;
}

const testContents = ref<ContentItem[]>([
  { type: 'text', content: '普通文本测试' },
  { type: 'text', content: '行内公式测试: $x^2 + y^2 = z^2$' },
  {
    type: 'text',
    content: String.raw`块级公式测试: $$\frac{1}{2}mv^2 = mgh$$`,
  },
  {
    type: 'text',
    content: String.raw`复杂公式: $$\int_0^\pi \sin(x) dx = 2$$`,
  },
  {
    type: 'text',
    content: String.raw`分数: $\frac{a}{b}$ 和根号: $\sqrt{x^2+1}$`,
  },
]);

const customInput = ref('$$E = mc^2$$');

function addCustomContent() {
  if (customInput.value.trim()) {
    testContents.value.push({
      type: 'text',
      content: customInput.value.trim(),
    });
    customInput.value = '';
  }
}

function clearContents() {
  testContents.value = [];
}

function resetContents() {
  testContents.value = [
    { type: 'text', content: '普通文本测试' },
    { type: 'text', content: '行内公式测试: $x^2 + y^2 = z^2$' },
    {
      type: 'text',
      content: String.raw`块级公式测试: $$\frac{1}{2}mv^2 = mgh$$`,
    },
    {
      type: 'text',
      content: String.raw`复杂公式: $$\int_0^\pi \sin(x) dx = 2$$`,
    },
    {
      type: 'text',
      content: String.raw`分数: $\frac{a}{b}$ 和根号: $\sqrt{x^2+1}$`,
    },
  ];
}

// 模拟后端数据格式
const mockQuestionContent = ref<ContentItem[]>([
  {
    type: 'text',
    content: '这是一道数学题：求解方程 $x^2 + 3x + 2 = 0$',
    format: 'text',
  },
  {
    type: 'text',
    content: String.raw`解题步骤：$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$`,
    format: 'latex',
  },
]);
</script>

<template>
  <div class="p-6">
    <NCard title="LaTeX 渲染器测试页面">
      <template #header-extra>
        <NSpace>
          <NButton @click="resetContents">重置</NButton>
          <NButton @click="clearContents">清空</NButton>
        </NSpace>
      </template>

      <!-- 输入测试 -->
      <div class="mb-6">
        <h3 class="mb-4 text-lg font-semibold">自定义输入测试</h3>
        <NSpace>
          <NInput
            v-model:value="customInput"
            placeholder="输入LaTeX公式，如: $$x^2 + y^2 = z^2$$"
            style="width: 400px"
            @keyup.enter="addCustomContent"
          />
          <NButton type="primary" @click="addCustomContent">添加</NButton>
        </NSpace>
      </div>

      <NDivider />

      <!-- 基础测试 -->
      <div class="mb-6">
        <h3 class="mb-4 text-lg font-semibold">基础LaTeX渲染测试</h3>

        <!-- 调试信息 -->
        <div class="mb-4 rounded bg-gray-100 p-3 text-sm">
          <p><strong>调试信息:</strong></p>
          <p>测试内容数量: {{ testContents.length }}</p>
          <details class="mt-2">
            <summary class="cursor-pointer text-blue-600">查看详细数据</summary>
            <pre class="mt-2 bg-white p-2 text-xs">{{
              JSON.stringify(testContents, null, 2)
            }}</pre>
          </details>
        </div>

        <!-- LaTeX渲染器 -->
        <div class="rounded border border-gray-200 p-4">
          <ContentsView
            :contents="testContents"
            :display-mode="false"
            :font-size="16"
          />
        </div>

        <!-- 如果没有内容 -->
        <div
          v-if="testContents.length === 0"
          class="py-8 text-center text-gray-500"
        >
          暂无测试内容
        </div>
      </div>

      <NDivider />

      <!-- 模拟后端数据测试 -->
      <div>
        <h3 class="mb-4 text-lg font-semibold">模拟后端数据格式测试</h3>

        <div class="mb-4 rounded bg-blue-50 p-3 text-sm">
          <p><strong>模拟题目内容:</strong></p>
          <pre class="mt-2 bg-white p-2 text-xs">{{
            JSON.stringify(mockQuestionContent, null, 2)
          }}</pre>
        </div>

        <div class="rounded border border-blue-200 p-4">
          <ContentsView
            :contents="mockQuestionContent"
            :display-mode="false"
            :font-size="16"
          />
        </div>
      </div>
    </NCard>
  </div>
</template>
