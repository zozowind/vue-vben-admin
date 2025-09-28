<script setup lang="ts">
import { computed, ref } from 'vue';

import { NCard, NInput, NInputNumber, NSpace, NSwitch } from 'naive-ui';

import TextContentDisplay from '#/components/question/QuestionTextContentDisplay.vue';

// 测试内容
const testContents = [
  {
    name: '纯文本',
    content: '这是一段普通的文本内容，没有任何特殊格式。',
  },
  {
    name: 'Markdown格式',
    content: `# 标题一
## 标题二

这是一段包含**粗体**和*斜体*的文本。

- 列表项1
- 列表项2
- 列表项3

\`行内代码\`示例。

\`\`\`javascript
function hello() {
  console.log('Hello World!');
}
\`\`\`

[链接示例](https://example.com)`,
  },
  {
    name: '行内数学公式',
    content: String.raw`这是一个行内公式：$E = mc^2$，还有另一个：$\sqrt{a^2 + b^2}$。`,
  },
  {
    name: '块级数学公式',
    content: `这是一个块级公式：

$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

还有一个复杂的公式：

$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$`,
  },
  {
    name: '混合内容',
    content: `# 数学题目

已知函数 $f(x) = x^2 + 2x + 1$，求解方程 $f(x) = 0$。

**解题步骤：**

1. 将方程写成标准形式：$x^2 + 2x + 1 = 0$
2. 使用求根公式：

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

其中 $a = 1$, $b = 2$, $c = 1$

3. 计算判别式：$\\Delta = b^2 - 4ac = 4 - 4 = 0$

4. 因为 $\\Delta = 0$，所以方程有一个重根：

$$x = \\frac{-2}{2} = -1$$

**答案：** $x = -1$`,
  },
];

// 响应式数据
const selectedContent = ref(testContents[0].content);
const customContent = ref('');
const fontSize = ref(16);
const displayMode = ref(true);
const useCustom = ref(false);

// 当前显示的内容
const currentContent = computed(() => {
  return useCustom.value ? customContent.value : selectedContent.value;
});
</script>

<template>
  <div class="content-renderer-test p-6">
    <h1 class="mb-6 text-2xl font-bold">内容渲染器测试页面</h1>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- 控制面板 -->
      <div class="space-y-4">
        <NCard title="测试控制" class="h-fit">
          <NSpace vertical>
            <!-- 预设内容选择 -->
            <div>
              <label class="mb-2 block text-sm font-medium"
                >预设测试内容：</label
              >
              <select
                v-model="selectedContent"
                :disabled="useCustom"
                class="w-full rounded border border-gray-300 p-2"
              >
                <option
                  v-for="item in testContents"
                  :key="item.name"
                  :value="item.content"
                >
                  {{ item.name }}
                </option>
              </select>
            </div>

            <!-- 自定义内容切换 -->
            <div class="flex items-center space-x-2">
              <NSwitch v-model:value="useCustom" />
              <span class="text-sm">使用自定义内容</span>
            </div>

            <!-- 自定义内容输入 -->
            <div v-if="useCustom">
              <label class="mb-2 block text-sm font-medium">自定义内容：</label>
              <NInput
                v-model:value="customContent"
                type="textarea"
                placeholder="输入您的测试内容..."
                :autosize="{ minRows: 6, maxRows: 12 }"
              />
            </div>

            <!-- 渲染选项 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-2 block text-sm font-medium">字体大小：</label>
                <NInputNumber
                  v-model:value="fontSize"
                  :min="12"
                  :max="24"
                  :step="1"
                  style="width: 100%"
                />
              </div>

              <div class="flex items-center space-x-2">
                <NSwitch v-model:value="displayMode" />
                <span class="text-sm">显示模式</span>
              </div>
            </div>
          </NSpace>
        </NCard>

        <!-- 原始内容预览 -->
        <NCard title="原始内容">
          <pre class="whitespace-pre-wrap text-sm">{{ currentContent }}</pre>
        </NCard>
      </div>

      <!-- 渲染结果 -->
      <div>
        <NCard title="渲染结果" class="h-fit">
          <div class="min-h-[400px] border border-gray-200 p-4">
            <TextContentDisplay
              :content="currentContent"
              :display-mode="displayMode"
              :font-size="fontSize"
            />
          </div>
        </NCard>
      </div>
    </div>

    <!-- 使用说明 -->
    <NCard title="使用说明" class="mt-6">
      <div class="space-y-2 text-sm">
        <p><strong>功能特性：</strong></p>
        <ul class="ml-4 list-disc space-y-1">
          <li>支持Markdown语法渲染（标题、列表、代码块、链接等）</li>
          <li>支持行内数学公式：<code>$公式$</code></li>
          <li>支持块级数学公式：<code>$$公式$$</code></li>
          <li>数学公式渲染为SVG，支持复杂的LaTeX语法</li>
          <li>自动检测内容类型，优化渲染性能</li>
          <li>支持字体大小调整和暗色模式</li>
        </ul>

        <p class="mt-4"><strong>测试方法：</strong></p>
        <ul class="ml-4 list-disc space-y-1">
          <li>选择预设的测试内容查看不同格式的渲染效果</li>
          <li>开启"自定义内容"输入您自己的测试内容</li>
          <li>调整字体大小查看缩放效果</li>
          <li>切换显示模式测试不同的渲染策略</li>
        </ul>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.content-renderer-test {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
