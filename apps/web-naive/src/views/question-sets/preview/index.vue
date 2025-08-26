<script setup lang="ts">
import type { PreviewTemplate } from '#/components/questionSet/templates';

import { nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ArrowLeft, RotateCw } from '@vben/icons';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { NButton, NSelect, NSwitch, useMessage } from 'naive-ui';

import { getQuestion } from '#/api/questions';
import {
  availableTemplates,
  getDefaultTemplate,
} from '#/components/questionSet/templates';
import {
  getFontSizeOptions,
  getPaperType,
  getPaperTypeOptions,
  getQuestionSetExportOptions,
} from '#/config/options';
import { useQuestionSetsStore } from '#/store/modules/question-sets';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const questionSetsStore = useQuestionSetsStore();

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

const handleExport = (key: string) => {
  switch (key) {
    case 'image': {
      exportToImage();
      break;
    }
    case 'pdf': {
      exportToPDF();
      break;
    }
    case 'word': {
      exportToWord();
      break;
    }
  }
};

const exportToPDF = async () => {
  if (exporting.value) {
    return;
  }

  try {
    exporting.value = true;
    message.info('正在生成PDF，请稍候...');

    const paperElement = paperRef.value;
    if (!paperElement) {
      throw new Error('未找到试卷元素');
    }

    // 隐藏工具栏等不需要导出的元素
    const toolbar = document.querySelector('.no-print') as HTMLElement;
    const originalToolbarDisplay = toolbar?.style.display ?? '';
    if (toolbar) {
      toolbar.style.display = 'none';
    }

    // 显示打印专用元素
    const printOnlyElements = document.querySelectorAll(
      '.print-only',
    ) as NodeListOf<HTMLElement>;
    const originalDisplays: string[] = [];
    printOnlyElements.forEach((el, index) => {
      originalDisplays[index] = el.style.display ?? '';
      el.style.display = 'block';
    });

    // 设置导出样式
    const originalPaperStyle = {
      position: paperElement.style.position,
      left: paperElement.style.left,
      top: paperElement.style.top,
      transform: paperElement.style.transform,
      boxShadow: paperElement.style.boxShadow,
      margin: paperElement.style.margin,
    };

    // 临时调整样式以适应导出
    paperElement.style.position = 'relative';
    paperElement.style.left = 'auto';
    paperElement.style.top = 'auto';
    paperElement.style.transform = 'none';
    paperElement.style.boxShadow = 'none';
    paperElement.style.margin = '0';

    // 等待样式应用
    await nextTick();

    // 计算页面尺寸
    const paperWidth = paperElement.offsetWidth;
    const paperHeight = paperElement.offsetHeight;

    // 使用 html2canvas 生成图片
    const canvas = await html2canvas(paperElement, {
      scale: 2, // 提高分辨率
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: paperWidth,
      height: paperHeight,
      scrollX: 0,
      scrollY: 0,
    });

    // 恢复原始样式
    Object.assign(paperElement.style, originalPaperStyle);

    // 恢复工具栏显示
    if (toolbar) {
      toolbar.style.display = originalToolbarDisplay;
    }

    // 恢复打印专用元素隐藏
    printOnlyElements.forEach((el, index) => {
      el.style.display = originalDisplays[index] ?? '';
    });

    // 创建 PDF
    const imgData = canvas.toDataURL('image/png');

    // 根据纸张类型设置PDF尺寸（毫米）
    const pt = getPaperType(paperType.value);
    const pdfWidth = pt.width;
    const pdfHeight = pt.height;

    // eslint-disable-next-line new-cap
    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    // 计算图片在PDF中的尺寸
    const imgWidth = pdfWidth - 20; // 左右各留10mm边距
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 如果内容高度超过单页，需要分页
    if (imgHeight > pdfHeight - 20) {
      // 分页处理
      const pageHeight = pdfHeight - 20; // 上下各留10mm边距
      const totalPages = Math.ceil(imgHeight / pageHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage([pdfWidth, pdfHeight]);
        }

        // 计算当前页面应该显示的内容区域
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

        const pageImgData = pageCanvas.toDataURL('image/png');
        const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;

        pdf.addImage(
          pageImgData,
          'PNG',
          10, // x: 10mm边距
          10, // y: 10mm边距
          imgWidth,
          pageImgHeight,
        );
      }
    } else {
      // 单页处理
      const yPosition = (pdfHeight - imgHeight) / 2; // 垂直居中
      pdf.addImage(
        imgData,
        'PNG',
        10, // x: 10mm边距
        Math.max(10, yPosition), // y: 至少10mm边距
        imgWidth,
        imgHeight,
      );
    }

    // 下载PDF
    const fileName = `${questionSet.value?.name || '练习题集'}_${new Date().toLocaleDateString('zh-CN')}.pdf`;
    pdf.save(fileName);

    message.success('PDF导出成功！');
  } catch (error) {
    console.error('PDF导出失败:', error);
    message.error('导出PDF失败');
  } finally {
    exporting.value = false;
  }
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
          <CommonSelect
            v-model:value="paperType"
            :options="getPaperTypeOptions()"
            style="width: 100px"
            size="small"
            placeholder="question_set.placeholder.settings.paperType"
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
