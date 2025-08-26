<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { NSpin } from 'naive-ui';

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
const mathJaxLoaded = ref(false);
const markdownLoaded = ref(false);
const contentContainer = ref<HTMLElement>();

// 库引用
const markdownLib = ref<any>(null);

// 在客户端动态加载库
onMounted(async () => {
  loading.value = true;
  try {
    // 动态导入markdown-it（默认启用）
    const markdownModule = await import('markdown-it');
    markdownLib.value = markdownModule.default({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true,
    });
    markdownLoaded.value = true;

    // 加载MathJax（使用CDN版本）
    if (window.MathJax) {
      mathJaxLoaded.value = true;
    } else {
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$']],
          displayMath: [['$$', '$$']],
          processEscapes: true,
          processEnvironments: true,
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
        },
        startup: {
          typeset: false,
        },
      };

      // 动态加载MathJax脚本
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
      script.async = true;
      script.addEventListener('load', () => {
        mathJaxLoaded.value = true;
      });
      document.head.append(script);
    }
  } catch (error) {
    console.error('Failed to load libraries:', error);
  } finally {
    loading.value = false;
  }
});

// 处理换行符
function processLineBreaks(text: string): string {
  return text.replaceAll('\n', '<br>');
}

// 渲染内容
const renderedContent = computed(() => {
  if (!props.content) return '';

  let content = props.content;

  try {
    // 默认启用Markdown渲染
    content =
      markdownLoaded.value && markdownLib.value
        ? markdownLib.value.render(content)
        : processLineBreaks(content);

    return content;
  } catch (error) {
    console.error('Content render error:', error);
    return processLineBreaks(props.content);
  }
});

// MathJax渲染函数
const renderMathJax = async () => {
  if (!mathJaxLoaded.value || !window.MathJax || !contentContainer.value) {
    return;
  }

  try {
    // 重新渲染数学公式
    await window.MathJax.typesetPromise([contentContainer.value]);
  } catch (error) {
    console.error('MathJax render error:', error);
  }
};

// 监听内容变化，重新渲染MathJax
watch(
  () => props.content,
  async () => {
    await nextTick();
    await renderMathJax();
  },
);

// 监听MathJax加载完成，初始渲染
watch(mathJaxLoaded, async (loaded) => {
  if (loaded) {
    await nextTick();
    await renderMathJax();
  }
});

// 样式
const contentStyle = computed(() => ({
  fontSize: `${props.fontSize}px`,
  lineHeight: 1.6,
}));

// 全局类型声明
declare global {
  interface Window {
    MathJax: any;
  }
}
</script>

<template>
  <div class="text-content-display" :style="contentStyle">
    <NSpin :show="loading" description="加载渲染器...">
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

/* MathJax样式 */
.content-wrapper :deep(.MathJax) {
  outline: none;
}

.content-wrapper :deep(.MathJax_Display) {
  margin: 1em 0;
  text-align: center;
}

.content-wrapper :deep(.MathJax_CHTML) {
  color: var(--text-color-1);
}
</style>
