<script setup lang="ts">
import type { PreviewTemplate } from '#/components/questionSet/templates';

import { nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ArrowLeft, RotateCw } from '@vben/icons';

import { NButton, NDropdown, NSelect, NSwitch, useMessage } from 'naive-ui';

import { getQuestion } from '#/api/questions';
import {
  availableTemplates,
  getDefaultTemplate,
} from '#/components/questionSet/templates';
import {
  getFontSizeOptions,
  getPaperTypeOptions,
  getQuestionSetExportOptions,
} from '#/config/options';
import { useQuestionSetsStore } from '#/store/modules/question-sets';
import { toPDF } from '#/utils/export';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const questionSetsStore = useQuestionSetsStore();

// 全局类型声明
declare global {
  interface Window {
    MathJax: any;
  }
}

// 响应式数据
const loading = ref(false);
const exporting = ref(false);
const questionSet = ref<any>(null);
const questions = ref<any[]>([]);
const paperRef = ref<HTMLElement>();

// 模板相关状态
const currentTemplate = ref<PreviewTemplate>(getDefaultTemplate());
const selectedTemplateId = ref<string>('default');

// 预览设置
const showAnswers = ref(false);
const showAnalysis = ref(false);
const fontSize = ref(14);
const paperType = ref('a4');

// 方法
const fetchData = async () => {
  const id = route.params.id as string;

  if (id === 'temp') {
    // 临时预览模式，从sessionStorage获取数据
    loadTempPreviewData();
    return;
  }

  loading.value = true;
  try {
    // 获取题目集信息
    questionSet.value = await questionSetsStore.fetchQuestionSet(id);

    // 根据题目集设置初始化预览设置
    if (questionSet.value?.settings) {
      showAnswers.value = questionSet.value.settings.show_answers ?? false;
      showAnalysis.value = questionSet.value.settings.show_analysis ?? false;
      fontSize.value = questionSet.value.settings.font_size ?? 14;
      paperType.value = questionSet.value.settings.paper_size ?? 'a4';
      selectedTemplateId.value =
        questionSet.value.settings.template ?? 'default';
      switchTemplate(selectedTemplateId.value);
    }

    // 获取题目集的题目
    const response = await questionSetsStore.fetchQuestionSetItems(id, {
      page: 1,
      page_size: 100,
    });

    // 获取每个题目的详细信息和分析
    const questionPromises = response.items.map(
      async (item: any, _index: number) => {
        try {
          const question = await getQuestion(item.question_id);
          return {
            ...question,
            analysis: null,
            sort_order: item.sort_order,
          };
        } catch (error) {
          console.error(`Failed to fetch question ${item.question_id}:`, error);
          return null;
        }
      },
    );

    const questionResults = await Promise.all(questionPromises);
    const filtered = questionResults.filter((q): q is any => q !== null);
    filtered.sort(
      (a: any, b: any) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0),
    );
    questions.value = filtered;
  } catch (error) {
    message.error('加载题目集失败');
    console.error('Failed to fetch question set:', error);
  } finally {
    loading.value = false;
  }
};

const loadTempPreviewData = () => {
  try {
    const data = sessionStorage.getItem('preview-question-set');
    if (data) {
      const previewData = JSON.parse(data);
      questionSet.value = previewData.questionSet;
      questions.value = previewData.questions.map((q: any, index: number) => ({
        ...q,
        sort_order: index + 1,
      }));
    }
  } catch (error) {
    console.error('Failed to load temp preview data:', error);
    message.error('预览数据加载失败');
  }
};

// 模板切换方法
const switchTemplate = (templateId: string) => {
  const template = availableTemplates.find((t) => t.id === templateId);
  if (template) {
    currentTemplate.value = template;
    selectedTemplateId.value = templateId;
  }
};

const updatePreviewSettings = () => {
  // 预览设置更新后的处理
  nextTick(() => {
    // 可以在这里处理一些UI更新逻辑
  });
};

const handleBack = () => {
  const id = route.params.id as string;
  if (id === 'temp') {
    window.close();
  } else {
    router.back();
  }
};

const handleRefresh = () => {
  fetchData();
};

const handlePrint = () => {
  // 隐藏工具栏等不需要打印的元素
  const toolbar = document.querySelector('.no-print');
  if (toolbar) {
    (toolbar as HTMLElement).style.display = 'none';
  }

  // 设置页面标题（影响打印时的页眉）
  const originalTitle = document.title;
  const pageTitle = questionSet.value?.name || '练习题集';
  document.title = pageTitle;

  // 设置打印样式
  const printStyles = `
    @media print {
      body * { visibility: hidden; }
      .paper, .paper * { visibility: visible; }
      .paper { 
        position: absolute; 
        left: 0; 
        top: 0; 
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        box-shadow: none !important;
        page-break-inside: avoid;
      }
      .question-item { 
        page-break-inside: avoid; 
        break-inside: avoid;
      }
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      .answer-analysis { display: ${showAnswers.value || showAnalysis.value ? 'block' : 'none'} !important; }
    }
    @page { 
      size: ${paperType.value.toUpperCase()}; 
      margin: 1.5cm 1cm;
    }
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = printStyles;
  document.head.append(styleSheet);

  // 打印
  window.print();

  // 恢复工具栏显示和原标题
  setTimeout(() => {
    if (toolbar) {
      (toolbar as HTMLElement).style.display = '';
    }
    document.title = originalTitle;
    styleSheet.remove();
  }, 1000);
};

const handleExport = (...args: any[]) => {
  console.warn('handleExport called with arguments:', args);
  console.warn('Arguments length:', args.length);
  console.warn('First argument type:', typeof args[0]);
  console.warn('First argument value:', args[0]);

  const key = args[0];
  const option = args[1];

  console.warn('Extracted key:', key, 'type:', typeof key);
  console.warn('Extracted option:', option);

  if (key === undefined || key === null) {
    console.error('Key is undefined or null');
    message.error('导出类型无效');
    return;
  }

  switch (key) {
    case 'image': {
      console.warn('Executing image export');
      exportToImage();
      break;
    }
    case 'pdf': {
      console.warn('Executing PDF export');
      exportToPDF();
      break;
    }
    case 'word': {
      console.warn('Executing word export');
      exportToWord();
      break;
    }
    default: {
      console.error('Unknown export key:', key, 'type:', typeof key);
      message.error(`未知的导出类型: ${key}`);
    }
  }
};

const exportToPDF = async () => {
  const filename = `${questionSet.value?.name || '练习题集'}_${new Date().toLocaleDateString('zh-CN')}.pdf`;
  const state = await toPDF(
    paperRef.value,
    {
      name: 'a4',
      width: 210,
      height: 297,
    },
    filename,
  );
  exporting.value = state.exporting;
  message.info(state.result);
};

const exportToWord = async () => {
  try {
    message.info('Word导出功能开发中...');
  } catch {
    message.error('导出Word失败');
  }
};

const exportToImage = async () => {
  try {
    // 可以使用 html2canvas 库
    message.info('图片导出功能开发中...');
  } catch {
    message.error('导出图片失败');
  }
};

// 生命周期
onMounted(() => {
  fetchData();
  // 调试：检查导出选项
  const exportOptions = getQuestionSetExportOptions();
  console.warn('Export options:', exportOptions);
  console.warn('Export options type:', typeof exportOptions);
  console.warn('Export options is array:', Array.isArray(exportOptions));
  if (Array.isArray(exportOptions)) {
    exportOptions.forEach((option, index) => {
      console.warn(`Option ${index}:`, option);
      console.warn(
        `Option ${index} value:`,
        option.value,
        'type:',
        typeof option.value,
      );
    });
  }
});
</script>

<template>
  <div class="preview-container">
    <!-- 工具栏 -->
    <div
      class="toolbar no-print sticky top-0 z-10 border-b bg-white px-4 py-3 shadow-sm"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <NButton @click="handleBack" ghost>
            <template #icon>
              <ArrowLeft />
            </template>
            返回
          </NButton>
          <h1 class="text-lg font-semibold">试卷预览</h1>
        </div>

        <div class="flex items-center space-x-2">
          <NButton @click="handleRefresh" :loading="loading">
            <template #icon>
              <RotateCw />
            </template>
          </NButton>

          <NDropdown
            :options="getQuestionSetExportOptions()"
            @select="handleExport"
            trigger="click"
          >
            <NButton :loading="exporting"> 导出 </NButton>
          </NDropdown>

          <NButton type="primary" @click="handlePrint"> 打印 </NButton>
        </div>
      </div>

      <!-- 预览设置 -->
      <div class="mt-3 flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">
            {{ $t('question_set.property.settings.showAnswer') }} :
          </span>
          <NSwitch
            v-model:value="showAnswers"
            @update:value="updatePreviewSettings"
          />
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">
            {{ $t('question_set.property.settings.showAnalysis') }} :
          </span>
          <NSwitch
            v-model:value="showAnalysis"
            @update:value="updatePreviewSettings"
          />
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">字体大小:</span>
          <NSelect
            v-model:value="fontSize"
            :options="getFontSizeOptions()"
            style="width: 100px"
            size="small"
            @update:value="updatePreviewSettings"
          />
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">
            {{ $t('question_set.property.settings.paperType') }} :
          </span>
          <NSelect
            v-model:value="paperType"
            :options="getPaperTypeOptions()"
            style="width: 100px"
            size="small"
            @update:value="updatePreviewSettings"
          />
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">模板:</span>
          <NSelect
            v-model:value="selectedTemplateId"
            :options="
              availableTemplates.map((t) => ({ value: t.id, label: t.name }))
            "
            style="width: 120px"
            size="small"
            @update:value="switchTemplate"
          />
        </div>
      </div>
    </div>

    <!-- 预览内容 -->
    <div class="preview-content min-h-screen bg-gray-100 p-8">
      <div ref="paperRef">
        <!-- 动态模板组件 -->
        <component
          :is="currentTemplate.component"
          :question-set="questionSet"
          :questions="questions"
          :loading="loading"
          :show-answers="showAnswers"
          :show-analysis="showAnalysis"
          :font-size="fontSize"
          :paper-type="paperType"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  .preview-content {
    padding: 1rem;
  }

  .toolbar .flex {
    flex-direction: column;
    gap: 1rem;
  }
}

.preview-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.toolbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.preview-content {
  padding: 2rem;
  background-color: #f3f4f6;
}
</style>
