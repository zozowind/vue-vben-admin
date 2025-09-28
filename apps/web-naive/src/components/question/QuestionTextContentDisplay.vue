<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { NSpin } from 'naive-ui';

import {
  ContentRendererSimple,
  getContentRenderer,
} from '#/utils/ContentRendererSimple';

interface Props {
  content?: string;
  displayMode?: boolean;
  fontSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  displayMode: false,
  fontSize: 16,
});

const loading = ref(false);
const rendererReady = ref(false);
const contentContainer = ref<HTMLElement>();
const renderedContent = ref<string>('');

// 获取内容渲染器实例
const contentRenderer = getContentRenderer();

// 初始化渲染器
onMounted(async () => {
  loading.value = true;
  try {
    await contentRenderer.warmup();
    rendererReady.value = true;
    await renderContent();
  } catch (error) {
    console.error('Failed to initialize content renderer:', error);
  } finally {
    loading.value = false;
  }
});

// 渲染内容
const renderContent = async () => {
  if (!props.content || !rendererReady.value) {
    renderedContent.value = '';
    return;
  }

  try {
    loading.value = true;

    // 检测内容类型，优化渲染选项
    const hasMath = ContentRendererSimple.hasMathFormulas(props.content);
    const hasMarkdown = ContentRendererSimple.hasMarkdownSyntax(props.content);

    // 渲染内容
    const result = await contentRenderer.render(props.content, {
      enableMarkdown: hasMarkdown || props.displayMode, // 显示模式默认启用Markdown
      enableMath: hasMath,
      fontSize: props.fontSize,
      // darkMode 会自动从 preferences.theme.mode 检测
    });

    renderedContent.value = result;
  } catch (error) {
    console.error('Content render error:', error);
    // 回退到简单处理
    renderedContent.value = props.content.replaceAll('\n', '<br>');
  } finally {
    loading.value = false;
  }
};

// 监听内容变化
watch(
  () => props.content,
  async () => {
    await nextTick();
    await renderContent();
  },
);

// 监听字体大小变化
watch(
  () => props.fontSize,
  async () => {
    await nextTick();
    await renderContent();
  },
);

// 样式
const contentStyle = computed(() => ({
  fontSize: `${props.fontSize}px`,
  lineHeight: 1.6,
}));
</script>

<template>
  <div class="text-content-display" :style="contentStyle">
    <NSpin :show="loading" description="渲染内容中...">
      <!-- 内容区域 -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div
        ref="contentContainer"
        class="content-wrapper"
        v-html="renderedContent"
      ></div>
    </NSpin>
  </div>
</template>

<style scoped>
.text-content-display {
  width: 100%;
  color: var(--text-color-1);
}

.content-wrapper {
  min-height: 40px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Markdown样式 */
.content-wrapper :deep(h1),
.content-wrapper :deep(h2),
.content-wrapper :deep(h3),
.content-wrapper :deep(h4),
.content-wrapper :deep(h5),
.content-wrapper :deep(h6) {
  margin: 1.5em 0 0.5em;
  font-weight: 600;
  line-height: 1.25;
  color: var(--text-color-1);
}

.content-wrapper :deep(h1) {
  padding-bottom: 0.3em;
  font-size: 2em;
  border-bottom: 1px solid var(--color-border-2);
}

.content-wrapper :deep(h2) {
  padding-bottom: 0.3em;
  font-size: 1.5em;
  border-bottom: 1px solid var(--color-border-2);
}

.content-wrapper :deep(h3) {
  font-size: 1.25em;
}

.content-wrapper :deep(h4) {
  font-size: 1em;
}

.content-wrapper :deep(h5) {
  font-size: 0.875em;
}

.content-wrapper :deep(h6) {
  font-size: 0.85em;
  color: var(--text-color-2);
}

.content-wrapper :deep(p) {
  margin: 1em 0;
  line-height: 1.6;
}

.content-wrapper :deep(blockquote) {
  padding: 0 1em;
  margin: 1em 0;
  color: var(--text-color-2);
  background: var(--color-fill-1);
  border-left: 4px solid var(--color-border-2);
}

.content-wrapper :deep(code) {
  padding: 0.2em 0.4em;
  font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
  font-size: 0.85em;
  background: var(--color-fill-2);
  border-radius: 3px;
}

.content-wrapper :deep(pre) {
  padding: 1em;
  margin: 1em 0;
  overflow-x: auto;
  font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
  background: var(--color-fill-2);
  border-radius: 6px;
}

.content-wrapper :deep(pre code) {
  padding: 0;
  background: none;
  border-radius: 0;
}

.content-wrapper :deep(ul),
.content-wrapper :deep(ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.content-wrapper :deep(li) {
  margin: 0.25em 0;
  line-height: 1.6;
}

.content-wrapper :deep(hr) {
  margin: 2em 0;
  border: none;
  border-top: 1px solid var(--color-border-2);
}

.content-wrapper :deep(table) {
  width: 100%;
  margin: 1em 0;
  border-collapse: collapse;
}

.content-wrapper :deep(th),
.content-wrapper :deep(td) {
  padding: 0.75em;
  text-align: left;
  border: 1px solid var(--color-border-2);
}

.content-wrapper :deep(th) {
  font-weight: 600;
  background: var(--color-fill-1);
}

.content-wrapper :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
}

.content-wrapper :deep(a:hover) {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.content-wrapper :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

/* 数学公式样式 */
.content-wrapper :deep(.math-block) {
  margin: 1em 0;
  text-align: center;
  overflow-x: auto;
}

.content-wrapper :deep(.math-inline) {
  display: inline-block;
  vertical-align: middle;
}

.content-wrapper :deep(.math-block svg),
.content-wrapper :deep(.math-inline svg) {
  max-width: 100%;
  height: auto;
  vertical-align: middle;
}

/* 暗色模式支持现在通过JavaScript直接处理SVG颜色 */
</style>
