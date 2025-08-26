<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Eye } from '@vben/icons';

import {
  NButton,
  NCard,
  NPagination,
  NSpace,
  NSpin,
  NTag,
  useMessage,
} from 'naive-ui';

import { getQuestion } from '#/api/questions';
import QuestionDifficultyTag from '#/components/question/QuestionDifficultyTag.vue';
import QuestionTypeTag from '#/components/question/QuestionTypeTag.vue';
import QuestionSetStatusTag from '#/components/questionSet/QuestionSetStatusTag.vue';
import QuestionSetTypeTag from '#/components/questionSet/QuestionSetTypeTag.vue';
import { $t } from '#/locales';
import { useQuestionSetsStore } from '#/store/modules/question-sets';
import { getQuestionContentsPreview } from '#/utils/question';
import { localTime } from '#/utils/time';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const questionSetsStore = useQuestionSetsStore();

// 响应式数据
const loading = ref(false);
const itemsLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const questions = ref<any[]>([]);

// 计算属性
const questionSet = computed(() => questionSetsStore.currentQuestionSet);
const total = computed(() => questionSetsStore.currentQuestionSetItems.length);

// 方法
const fetchData = async () => {
  const id = route.params.id as string;

  loading.value = true;
  try {
    await questionSetsStore.fetchQuestionSet(id);
    await fetchItems();
  } catch (error) {
    message.error($t('question_set.message.fetchFailed'));
    console.error('Failed to fetch question set:', error);
  } finally {
    loading.value = false;
  }
};

const fetchItems = async () => {
  const id = route.params.id as string;
  itemsLoading.value = true;
  try {
    const response = await questionSetsStore.fetchQuestionSetItems(id, {
      page: currentPage.value,
      page_size: pageSize.value,
    });

    // 获取题目详情
    const questionPromises = response.items.map(async (item) => {
      try {
        const question = await getQuestion(item.question_id);
        return { ...question, sort_order: item.sort_order };
      } catch (error) {
        console.error(`Failed to fetch question ${item.question_id}:`, error);
        return null;
      }
    });

    const questionResults = await Promise.all(questionPromises);
    questions.value = questionResults.filter((q) => q !== null);
  } catch (error) {
    message.error($t('question_set.message.fetchFailed'));
    console.error('Failed to fetch items:', error);
  } finally {
    itemsLoading.value = false;
  }
};

const handleEdit = () => {
  if (questionSet.value) {
    router.push(`/question-sets/${questionSet.value.id}/edit`);
  }
};

const handlePreview = () => {
  if (questionSet.value) {
    router.push(`/question-sets/${questionSet.value.id}/preview`);
  }
};

const previewQuestion = (question: any) => {
  router.push(`/questions/${question.id}/detail`);
};

// 生命周期
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4">
    <!-- 头部区域 -->
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">
        {{ $t('question_set.page.title.detail') }}
      </h1>
      <NSpace>
        <NButton @click="router.push('/question-sets/list')">
          {{ $t('question_set.action.backToList') }}
        </NButton>
        <NButton type="primary" @click="handleEdit">
          {{ $t('common.action.edit') }}
        </NButton>
        <NButton type="primary" @click="handlePreview">
          <template #icon>
            <Eye />
          </template>
          {{ $t('common.action.preview') }}
        </NButton>
      </NSpace>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <NSpin size="large" />
    </div>

    <div v-else-if="questionSet" class="space-y-6">
      <!-- 题目集基本信息 -->
      <NCard title="基本信息">
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-600">
                {{ $t('question_set.property.name') }}:
              </label>
              <p>{{ questionSet.name }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">
                {{ $t('question_set.property.set_type') }}:
              </label>
              <QuestionSetTypeTag :type="questionSet.set_type" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">
                {{ $t('question_set.property.createdAt') }}:
              </label>
              <p>{{ localTime(questionSet.created_at) }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-600">
                {{ $t('question_set.property.description') }}:
              </label>
              <p v-if="questionSet.description">
                {{ questionSet.description }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">
                {{ $t('question_set.property.status') }}:
              </label>
              <QuestionSetStatusTag :status="questionSet.status" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">
                {{ $t('question_set.property.updatedAt') }}:
              </label>
              <p>{{ localTime(questionSet.updated_at) }}</p>
            </div>
          </div>
        </div>

        <div v-if="questionSet.settings" class="mt-6">
          <label class="text-sm font-medium text-gray-600">
            {{ $t('question_set.page.title.settings') }}:
          </label>
          <div class="mt-2 rounded bg-gray-50 p-4">
            <div class="grid grid-cols-3 gap-4">
              <div>
                <span class="text-sm text-gray-600">显示答案：</span>
                <span>{{ questionSet.settings?.show_answers ? '是' : '否' }}</span>
              </div>
            </div>
          </div>
        </div>
      </NCard>

      <!-- 题目列表 -->
      <NCard :title="$t('question_set.page.title.questionList')">
        <div class="mb-4 flex w-full items-center justify-between">
          <span class="text-sm text-gray-600">
            {{ $t('question_set.page.content.totalQuestions', { total }) }}
          </span>
        </div>

        <NSpin :show="itemsLoading">
          <div
            v-if="questions.length === 0"
            class="py-8 text-center text-gray-500"
          >
            {{ $t('question_set.page.content.noQuestions') }}
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(question, index) in questions"
              :key="question.id"
              class="rounded-lg border p-4 transition-shadow hover:shadow-md"
            >
              <div class="flex items-start space-x-4">
                <div class="min-w-0 flex-1">
                  <div class="mb-2 flex items-center space-x-2">
                    <span class="text-sm text-gray-500">#{{ index + 1 }}</span>
                    <QuestionTypeTag :type="question.question_type" />
                    <QuestionDifficultyTag :difficulty="question.difficulty" />
                  </div>

                  <div class="mb-2 text-gray-900">
                    {{ getQuestionContentsPreview(question.contents) }}
                  </div>

                  <div
                    v-if="question.knowledge_points?.length"
                    class="flex flex-wrap gap-1"
                  >
                    <NTag
                      v-for="point in question.knowledge_points"
                      :key="point"
                      size="small"
                      type="default"
                    >
                      {{ point }}
                    </NTag>
                  </div>
                </div>

                <div class="flex flex-col space-y-2">
                  <NButton
                    size="small"
                    type="info"
                    @click="previewQuestion(question)"
                  >
                    {{ $t('common.action.preview') }}
                  </NButton>
                </div>
              </div>
            </div>
          </div>

          <div v-if="questions.length > 0" class="mt-6 flex justify-center">
            <NPagination
              v-model:page="currentPage"
              :page-size="pageSize"
              :item-count="total"
              @update:page="fetchItems"
            />
          </div>
        </NSpin>
      </NCard>
    </div>

    <div v-else class="py-8 text-center">
      {{ $t('question_set.message.questionSetNotExist') }}
    </div>
  </div>
</template>
