<script setup lang="ts">
import type { ContentItem } from '#/api/questions';

import { computed, onMounted, ref } from 'vue';

import { NDivider, NTag } from 'naive-ui';

import { localTime } from '#/utils/time';

// 移除未使用的 questionsApi 导入
import ContentDisplay from './QuestionContentDisplay.vue';

interface Props {
  question: any;
  showAnalysis?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAnalysis: true,
});

// 响应式数据
const analysis = ref<any>(null);

// 计算属性
const parsedContent = computed(() => {
  if (!props.question?.content) return [];

  try {
    const content =
      typeof props.question.content === 'string'
        ? JSON.parse(props.question.content)
        : props.question.content;

    if (Array.isArray(content)) {
      return content as ContentItem[];
    }

    // 如果不是数组，尝试转换为文本内容
    return [
      {
        type: 'text' as const,
        content:
          typeof content === 'string' ? content : JSON.stringify(content),
        format: 'text' as const,
      },
    ];
  } catch {
    // 解析失败时，作为纯文本处理
    return [
      {
        type: 'text' as const,
        content: props.question.content,
        format: 'text' as const,
      },
    ];
  }
});

// 方法
const getStatusType = (status: string) => {
  const statusMap: Record<string, 'error' | 'info' | 'success' | 'warning'> = {
    completed: 'success',
    confirming: 'warning',
    processing: 'info',
    failed: 'error',
  };
  return statusMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    completed: '已完成',
    confirming: '待确认',
    processing: '处理中',
    failed: '失败',
  };
  return statusMap[status] || status;
};

const fetchAnalysis = async () => {
  if (!props.showAnalysis || !props.question?.id) return;

  // 如果题目已经包含分析数据，直接使用
  if (props.question.analysis) {
    analysis.value = props.question.analysis;
  }

  // 暂时不支持单独获取题目分析，后续可以添加相应的API
  // TODO: 实现题目分析API
};

// 生命周期
onMounted(() => {
  fetchAnalysis();
});
</script>

<template>
  <div class="question-display">
    <div v-if="question" class="space-y-4">
      <!-- 题目基本信息 -->
      <div class="mb-4 flex items-center space-x-2">
        <NTag type="info" size="small">{{ question.subject }}</NTag>
        <NTag type="warning" size="small">
          {{ question.difficulty || '未知' }}
        </NTag>
        <NTag size="small">{{ question.question_type }}</NTag>
        <span class="text-sm text-gray-500">
          题目ID: {{ question.external_question_id || question.id }}
        </span>
      </div>

      <!-- 题目内容 -->
      <div class="question-content">
        <h3 class="mb-3 text-lg font-medium">题目内容</h3>
        <div class="rounded-lg bg-gray-50 p-4">
          <ContentDisplay
            v-for="(item, index) in parsedContent"
            :key="index"
            :item="item"
            :display-mode="true"
            :font-size="16"
            :show-preview="true"
          />
        </div>
      </div>

      <!-- 知识点 -->
      <div v-if="question.knowledge_points?.length" class="knowledge-points">
        <h4 class="text-md mb-2 font-medium">知识点</h4>
        <div class="flex flex-wrap gap-1">
          <NTag
            v-for="point in question.knowledge_points"
            :key="point"
            type="success"
            size="small"
          >
            {{ point }}
          </NTag>
        </div>
      </div>

      <!-- 题目分析（如果有） -->
      <div v-if="analysis" class="analysis-section">
        <NDivider>题目分析</NDivider>

        <div v-if="analysis.answer" class="mb-4">
          <h4 class="text-md mb-2 font-medium">答案</h4>
          <div class="rounded border-l-4 border-green-400 bg-green-50 p-3">
            {{ analysis.answer }}
          </div>
        </div>

        <div v-if="analysis.solution_steps?.length" class="mb-4">
          <h4 class="text-md mb-2 font-medium">解题步骤</h4>
          <div class="rounded border-l-4 border-blue-400 bg-blue-50 p-3">
            <ol class="list-inside list-decimal space-y-1">
              <li v-for="(step, index) in analysis.solution_steps" :key="index">
                {{ step }}
              </li>
            </ol>
          </div>
        </div>

        <div v-if="analysis.explanation" class="mb-4">
          <h4 class="text-md mb-2 font-medium">解题思路</h4>
          <div class="rounded border-l-4 border-yellow-400 bg-yellow-50 p-3">
            {{ analysis.explanation }}
          </div>
        </div>
      </div>

      <!-- 题目状态 -->
      <div class="flex items-center justify-between border-t pt-4">
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500">
            创建时间: {{ localTime(question.created_at) }}
          </span>
          <span class="text-sm text-gray-500">
            更新时间: {{ localTime(question.updated_at) }}
          </span>
        </div>
        <NTag :type="getStatusType(question.status)" size="small">
          {{ getStatusText(question.status) }}
        </NTag>
      </div>
    </div>

    <div v-else class="py-8 text-center text-gray-500">暂无题目数据</div>
  </div>
</template>

<style scoped>
.question-display {
  max-width: 100%;
  overflow-wrap: break-word;
}

.question-content :deep(.content-display) {
  margin-bottom: 1rem;
}

.question-content :deep(.content-display:last-child) {
  margin-bottom: 0;
}

.analysis-section {
  margin-top: 1.5rem;
}

.analysis-section h4 {
  font-weight: 500;
  color: #374151;
}
</style>
