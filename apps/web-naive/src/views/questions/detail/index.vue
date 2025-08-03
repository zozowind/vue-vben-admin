<script lang="ts" setup>
import type { QuestionInfo } from '#/api/questions';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NPopconfirm,
  NSpace,
  NSpin,
  useMessage,
} from 'naive-ui';

import { getQuestion, updateQuestionStatus } from '#/api/questions';
import ContentsView from '#/components/content/ContentsView.vue';
import QuestionDifficultyTag from '#/components/QuestionDifficultyTag.vue';
import QuestionGradeTag from '#/components/QuestionGradeTag.vue';
import QuestionKnowledgePointsTag from '#/components/QuestionKnowledgePointsTag.vue';
import QuestionStatusTag from '#/components/QuestionStatusTag.vue';
import QuestionSubjectTag from '#/components/QuestionSubjectTag.vue';
import QuestionTypeTag from '#/components/QuestionTypeTag.vue';
import { $t } from '#/locales';
import { localTime } from '#/utils/time';

defineOptions({
  name: 'QuestionDetail',
});

const route = useRoute();
const router = useRouter();
const message = useMessage();

const loading = ref(false);
const statusLoading = ref(false);
const questionData = ref<null | QuestionInfo>(null);

const questionId = route.params.id as string;

// 获取题目详情
async function fetchQuestionDetail() {
  try {
    loading.value = true;
    const result = await getQuestion(questionId);
    questionData.value = result;
  } catch (error) {
    message.error($t('question.message.fetchFailed'));
    console.error('Failed to fetch question detail:', error);
  } finally {
    loading.value = false;
  }
}

// 返回列表
function handleBack() {
  router.push('/questions/list');
}

// 编辑题目
function handleEdit() {
  router.push(`/questions/${questionId}/edit`);
}

// 状态切换
async function handleStatusChange() {
  if (!questionData.value) return;

  const currentStatus = questionData.value.status;
  const newStatus = currentStatus === 'confirming' ? 'completed' : 'confirming';

  try {
    statusLoading.value = true;
    const result = await updateQuestionStatus(questionId, {
      status: newStatus,
    });

    // 更新本地数据
    questionData.value.status = result.status;
    questionData.value.updated_at = result.updated_at;

    message.success($t('question.message.statusUpdateSuccess'));
  } catch (error) {
    message.error($t('question.message.statusUpdateFailed'));
    console.error('Failed to update question status:', error);
  } finally {
    statusLoading.value = false;
  }
}

// 判断是否可以切换状态
function canChangeStatus() {
  if (!questionData.value) return false;
  return ['completed', 'confirming'].includes(questionData.value.status);
}

// 获取状态切换按钮文本
function getStatusChangeButtonText() {
  if (!questionData.value) return '';
  return questionData.value.status === 'confirming'
    ? $t('question.action.markAsCompleted')
    : $t('question.action.markAsConfirming');
}

function getStepContents(steps: string[]) {
  return steps.map((step) => ({
    type: 'text',
    content: step,
    format: 'text',
  }));
}

onMounted(() => {
  fetchQuestionDetail();
});
</script>

<template>
  <div class="p-4">
    <NSpin :show="loading">
      <div v-if="questionData" class="space-y-6">
        <!-- 头部操作 -->
        <NCard>
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold">
              {{ $t('question.page.title.detail') }}
            </h1>
            <NSpace>
              <NButton @click="handleBack">
                {{ $t('question.action.backToList') }}
              </NButton>
              <NButton type="primary" @click="handleEdit">
                {{ $t('question.action.edit') }}
              </NButton>
              <NPopconfirm
                v-if="canChangeStatus()"
                :positive-text="$t('common.action.confirm')"
                :negative-text="$t('common.action.cancel')"
                @positive-click="handleStatusChange"
              >
                <template #trigger>
                  <NButton
                    type="warning"
                    :loading="statusLoading"
                    :disabled="statusLoading"
                  >
                    {{ getStatusChangeButtonText() }}
                  </NButton>
                </template>
                {{ $t('question.message.statusChangeConfirm') }}
              </NPopconfirm>
            </NSpace>
          </div>
        </NCard>

        <!-- 1. 题目基本信息 -->
        <NCard :title="$t('question.page.title.basicInfo')">
          <NDescriptions
            :column="3"
            label-placement="left"
            label-style="font-weight: bold;"
          >
            <NDescriptionsItem :label="$t('question.property.id')">
              {{ questionData.external_id || questionData.id }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('question.property.type')">
              <QuestionTypeTag :type="questionData.question_type" />
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('question.property.status')">
              <QuestionStatusTag :status="questionData.status" />
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('question.property.subject')">
              <QuestionSubjectTag :subject="questionData.subject" />
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('question.property.grade')">
              <QuestionGradeTag :grade="questionData.grade" />
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('question.property.difficulty')">
              <QuestionDifficultyTag :difficulty="questionData.difficulty" />
            </NDescriptionsItem>
            <NDescriptionsItem
              :label="$t('question.property.knowledgePoints')"
              :span="3"
            >
              <QuestionKnowledgePointsTag
                :knowledge-points="questionData.knowledge_points"
              />
            </NDescriptionsItem>
            <NDescriptionsItem
              v-if="questionData.error_message"
              :label="$t('question.property.errorMessage')"
              :span="3"
            >
              <NTag type="error">
                {{ questionData.error_message }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('question.property.createdAt')">
              {{ localTime(questionData.created_at) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('question.property.updatedAt')">
              {{ localTime(questionData.updated_at) }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <!-- 2. 题目内容 -->
        <NCard :title="$t('question.page.title.content')">
          <div class="question-content">
            <ContentsView
              v-if="questionData.contents && questionData.contents.length > 0"
              :contents="questionData.contents"
              :display-mode="false"
              :font-size="18"
            />
            <div v-else class="text-gray-500">
              {{ $t('question.message.noContent') }}
            </div>
          </div>
        </NCard>

        <!-- 3. 题目解析 -->
        <NCard
          v-if="questionData.analysis"
          :title="$t('question.page.title.analysis')"
        >
          <div class="analysis-content space-y-6">
            <!-- 答案 -->
            <div v-if="questionData.analysis.answer" class="answer-section">
              <h4 class="mb-3 text-lg font-semibold text-blue-600">
                {{ $t('question.property.answer') }}
              </h4>
              <div class="answer-content rounded-lg bg-blue-50 p-4">
                <ContentsView
                  :contents="[
                    {
                      type: 'text',
                      content: questionData.analysis.answer,
                      format: 'text',
                    },
                  ]"
                  :display-mode="true"
                  :font-size="18"
                />
              </div>
            </div>

            <!-- 解题步骤 -->
            <div
              v-if="questionData.analysis.solution_steps"
              class="solution-section"
            >
              <h4 class="mb-3 text-lg font-semibold text-green-600">
                {{ $t('question.property.solutionSteps') }}
              </h4>
              <div class="step-content rounded-lg bg-green-50 p-4">
                <ContentsView
                  v-if="
                    questionData.analysis.solution_steps &&
                    questionData.analysis.solution_steps.length > 0
                  "
                  :contents="
                    getStepContents(questionData.analysis.solution_steps)
                  "
                  :display-mode="false"
                  :font-size="18"
                />
              </div>
            </div>

            <!-- 解释说明 -->
            <div
              v-if="questionData.analysis.explanation"
              class="explanation-section"
            >
              <h4 class="mb-3 text-lg font-semibold text-purple-600">
                {{ $t('question.property.explanation') }}
              </h4>
              <div class="explanation-content rounded-lg bg-purple-50 p-4">
                <ContentsView
                  :contents="[
                    {
                      type: 'text',
                      content: questionData.analysis.explanation,
                      format: 'text',
                    },
                  ]"
                  :display-mode="false"
                  :font-size="15"
                />
              </div>
            </div>

            <!-- 如果没有解析内容 -->
            <div
              v-if="
                !questionData.analysis.answer &&
                (!questionData.analysis.solution_steps ||
                  questionData.analysis.solution_steps.length === 0) &&
                !questionData.analysis.explanation
              "
              class="py-8 text-center text-gray-500"
            >
              {{ $t('question.message.noAnalysis') }}
            </div>
          </div>
        </NCard>

        <!-- 如果没有分析数据 -->
        <NCard v-else :title="$t('question.page.title.analysis')">
          <div class="py-8 text-center text-gray-500">
            {{ $t('question.message.noAnalysis') }}
          </div>
        </NCard>
      </div>

      <!-- 题目不存在 -->
      <div v-else-if="!loading" class="py-12 text-center">
        <p class="text-gray-500">{{ $t('question.message.notFound') }}</p>
        <NButton class="mt-4" @click="handleBack">
          {{ $t('question.action.backToList') }}
        </NButton>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.question-content {
  min-height: 200px;
}

.analysis-content .answer-section,
.analysis-content .solution-section,
.analysis-content .explanation-section {
  border-left: 4px solid currentColor;
  padding-left: 1rem;
}

.latex-content {
  font-family: 'Times New Roman', serif;
  line-height: 1.6;
}

.step-content,
.answer-content,
.explanation-content {
  font-family: 'Times New Roman', serif;
  line-height: 1.6;
}
</style>
