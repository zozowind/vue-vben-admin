<script setup lang="ts">
import type { TemplateProps } from './index';

import { computed } from 'vue';

import { NSpin } from 'naive-ui';

import ContentDisplay from '#/components/question/QuestionContentDisplay.vue';

const props = defineProps<TemplateProps>();

// 计算属性
const paperClasses = computed(() => {
  // 优先使用 settings 中的 paper_size，否则使用传入的 paperType
  const paperType =
    props.questionSet?.settings?.paper_type || props.display?.paperType || 'a4';
  return `paper-${paperType}`;
});

const paperStyles = computed(() => {
  // 优先使用 settings 中的 font_size，否则使用传入的 fontSize
  const fontSize =
    Number(props.questionSet?.settings?.font_size) ||
    props.display?.fontSize ||
    16;
  return {
    fontSize: `${fontSize}px`,
    lineHeight: '1.6',
  };
});

// 方法
const getAnswerLines = (question: any) => {
  // 根据题目类型返回不同的答题行数
  const typeLines: Record<string, number> = {
    single_choice: 0,
    multiple_choice: 1,
    fill_blank: 2,
    short_answer: 3,
    essay: 5,
    calculation: 4,
  };

  return typeLines[question.question_type as string] ?? 3;
};
</script>

<template>
  <div
    class="paper mx-auto bg-white shadow-lg"
    :class="paperClasses"
    :style="paperStyles"
  >
    <!-- 打印页眉（仅在打印时显示） -->
    <div class="print-header print-only">
      <div
        class="mb-4 flex items-center justify-between border-b pb-2 text-xs text-gray-600"
      >
        <span>{{ questionSet?.name || '练习题集' }}</span>
        <span>
          {{ new Date().toLocaleString('zh-CN') }}
        </span>
      </div>
    </div>

    <!-- 试卷头部 -->
    <div class="paper-header mb-8 text-center"></div>

    <!-- 试卷说明 -->
    <div v-if="questionSet?.description" class="paper-instructions mb-6">
      <h2 class="mb-2 text-lg font-semibold">考试说明</h2>
      <p class="text-sm leading-relaxed text-gray-700">
        {{ questionSet.description }}
      </p>
    </div>

    <!-- 题目列表 -->
    <div class="questions-section">
      <div v-if="loading" class="py-8 text-center">
        <NSpin size="medium" />
        <p class="mt-2 text-gray-500">加载中...</p>
      </div>

      <div
        v-else-if="questions.length === 0"
        class="py-8 text-center text-gray-500"
      >
        暂无题目
      </div>

      <div v-else class="space-y-8">
        <div
          v-for="(question, index) in questions"
          :key="question.id"
          class="question-item"
        >
          <!-- 题目标题 -->
          <div class="question-header mb-3">
            <h3 class="text-lg font-medium">
              {{ index + 1 }}.
              <span class="ml-2 text-sm text-gray-500">(5 分)</span>
            </h3>
          </div>

          <!-- 题目内容 -->
          <div class="question-content mb-4">
            <template v-if="question.contents && question.contents.length > 0">
              <ContentDisplay
                v-for="(item, contentIndex) in question.contents"
                :key="contentIndex"
                :item="item"
                :display-mode="true"
                :font-size="
                  Number(questionSet?.settings?.font_size) || display?.fontSize
                "
                :show-preview="false"
              />
            </template>
            <div v-else class="italic text-gray-500">[题目内容为空]</div>
          </div>

          <!-- 答题区域 -->
          <div class="answer-area mb-4">
            <div class="border-l-4 border-gray-200 pl-4">
              <h4 class="mb-2 text-sm font-medium text-gray-600">答题区域：</h4>
              <div class="answer-lines">
                <div
                  v-for="i in getAnswerLines(question)"
                  :key="i"
                  class="answer-line mb-2"
                >
                  <div class="h-6 border-b border-dashed border-gray-300"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 答案和解析（可选显示） -->
          <div
            v-if="
              questionSet?.settings?.show_answers ||
              display?.showAnswers ||
              questionSet?.settings?.show_analysis ||
              display?.showAnalysis
            "
            class="answer-analysis rounded bg-gray-50 p-4"
          >
            <div
              v-if="
                (questionSet?.settings?.show_answers || display?.showAnswers) &&
                question.analysis?.answer
              "
              class="mb-3"
            >
              <h4 class="mb-1 text-sm font-semibold text-green-700">
                参考答案：
              </h4>
              <p class="text-sm text-green-800">
                {{ question.analysis.answer }}
              </p>
            </div>

            <div
              v-if="
                (questionSet?.settings?.show_analysis ||
                  display?.showAnalysis) &&
                question.analysis?.explanation
              "
              class="mb-3"
            >
              <h4 class="mb-1 text-sm font-semibold text-blue-700">
                解题思路：
              </h4>
              <p class="text-sm text-blue-800">
                {{ question.analysis.explanation }}
              </p>
            </div>

            <div
              v-if="
                (questionSet?.settings?.show_analysis ||
                  display?.showAnalysis) &&
                question.analysis?.solution_steps?.length
              "
              class="mb-3"
            >
              <h4 class="mb-1 text-sm font-semibold text-purple-700">
                解题步骤：
              </h4>
              <ol
                class="list-inside list-decimal space-y-1 text-sm text-purple-800"
              >
                <li
                  v-for="step in question.analysis.solution_steps"
                  :key="step"
                >
                  {{ step }}
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 试卷尾部 -->
    <div class="paper-footer"></div>

    <!-- 打印页脚（仅在打印时显示） -->
    <div class="print-footer print-only">
      <div
        class="mt-4 flex items-center justify-center border-t pt-2 text-xs text-gray-600"
      >
        <span>第 <span class="page-number"></span> 页</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 打印时隐藏的元素 */
.print-only {
  display: none;
}

@media print {
  .print-only {
    display: block !important;
  }

  .paper {
    padding: 1cm;
    margin: 0;
    box-shadow: none;
  }

  .question-item {
    page-break-inside: avoid;
  }

  /* 自定义页眉页脚样式 */
  .print-header {
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
  }

  .print-footer {
    border-top: 1px solid #e5e7eb;
    margin-top: 1rem;
    padding-top: 0.5rem;
  }
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .paper-a4 {
    width: 100%;
    max-width: 210mm;
  }

  .paper-a3 {
    width: 100%;
    max-width: 297mm;
  }

  .paper-letter {
    width: 100%;
    max-width: 8.5in;
  }
}

@media (max-width: 768px) {
  .paper {
    padding: 1rem;
  }
}

.paper {
  padding: 2rem;
  margin: 0 auto;
  background: white;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 10%),
    0 2px 4px -1px rgb(0 0 0 / 6%);
}

.paper-a4 {
  width: 210mm;
  min-height: 297mm;
}

.paper-a3 {
  width: 297mm;
  min-height: 420mm;
}

.paper-letter {
  width: 8.5in;
  min-height: 11in;
}

.paper-header h1 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.question-item {
  margin-bottom: 2rem;
  break-inside: avoid;
  page-break-inside: avoid;
}

.question-header h3 {
  font-weight: 600;
  color: #374151;
}

.answer-lines {
  min-height: 3rem;
}

.answer-line {
  height: 1.5rem;
}

.answer-analysis {
  margin-top: 1rem;
  border-left: 4px solid #e5e7eb;
}
</style>
