<script setup lang="ts">
import type { FormRules } from 'naive-ui';

import type { QuestionSearchItem } from '#/api/questions';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Search as SearchIcon, X } from '@vben/icons';

import {
  NAlert,
  NButton,
  NCard,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  useMessage,
} from 'naive-ui';

import { searchQuestions } from '#/api/questions';
import ContentDisplay from '#/components/question/QuestionContentDisplay.vue';
import QuestionDifficultyFormSelect from '#/components/question/QuestionDifficultyFormSelect.vue';
import QuestionDifficultyTag from '#/components/question/QuestionDifficultyTag.vue';
import QuestionDisplay from '#/components/question/QuestionDisplay.vue';
import QuestionGradeFormSelect from '#/components/question/QuestionGradeFormSelect.vue';
import QuestionGradeTag from '#/components/question/QuestionGradeTag.vue';
import QuestionKnowledgePointsTag from '#/components/question/QuestionKnowledgePointsTag.vue';
import QuestionSubjectFormSelect from '#/components/question/QuestionSubjectFormSelect.vue';
import QuestionSubjectTag from '#/components/question/QuestionSubjectTag.vue';
import QuestionTypeFormSelect from '#/components/question/QuestionTypeFormSelect.vue';
import QuestionTypeTag from '#/components/question/QuestionTypeTag.vue';
import { useQuestionOptions } from '#/composables/useQuestionOptions';
import { useQuestionSetOptions } from '#/composables/useQuestionSetOptions';
import { $t } from '#/locales';
import { useQuestionSetsStore } from '#/store/modules/question-sets';
import { localTime } from '#/utils/time';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const questionSetsStore = useQuestionSetsStore();

// 选项配置
const { subjectOptions, questionTypeOptions, difficultyOptions, gradeOptions } =
  useQuestionOptions();
const { questionSetTypeOptions } = useQuestionSetOptions();

// 响应式数据
const formRef = ref();
const loading = ref(false);
const saving = ref(false);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const questions = ref<QuestionSearchItem[]>([]);

const showPreviewModal = ref(false);
const previewingQuestion = ref<any>(null);

// 表单数据
const formData = ref({
  name: '',
  description: '',
  set_type: 'practice',
  settings: {
    show_answers: false,
    show_analysis: false,
  },
});

// 筛选条件
const filters = ref({
  subject: undefined as string | undefined,
  difficulty: undefined as string | undefined,
  grade: undefined as number | undefined,
  question_type: undefined as string | undefined,
});

// 表单验证规则
const rules: FormRules = {
  name: {
    required: true,
    message: $t('question_set.placeholder.name'),
    trigger: 'blur',
  },
  set_type: {
    required: true,
    message: $t('question_set.placeholder.type'),
    trigger: 'change',
  },
};

// 计算属性
const selectedQuestions = computed(() => questionSetsStore.selectedQuestions);
const currentQuestionSetItems = computed(
  () => questionSetsStore.currentQuestionSetItems,
);

// 方法
const fetchData = async () => {
  const id = route.params.id as string;

  loading.value = true;
  try {
    const data = await questionSetsStore.fetchQuestionSet(id);

    // 填充表单数据
    formData.value = {
      name: data.name || '',
      description: data.description || '',
      set_type: data.set_type || 'practice',
      settings: {
        show_answers: data.settings?.show_answers || false,
        show_analysis: data.settings?.show_analysis || false,
      },
    };

    // 获取题目集中的题目
    await fetchQuestionSetItems();
  } catch (error) {
    message.error('获取题目集详情失败');
    console.error('Failed to fetch question set:', error);
  } finally {
    loading.value = false;
  }
};

const fetchQuestionSetItems = async () => {
  const id = route.params.id as string;
  try {
    await questionSetsStore.fetchQuestionSetItems(id);
  } catch (error) {
    console.error('Failed to fetch question set items:', error);
  }
};

const fetchQuestions = async () => {
  loading.value = true;
  try {
    const params = {
      query: searchKeyword.value || undefined,
      subjects: filters.value.subject ? [filters.value.subject] : undefined,
      difficulties: filters.value.difficulty
        ? [filters.value.difficulty]
        : undefined,
      grades: filters.value.grade ? [filters.value.grade] : undefined,
      page: currentPage.value,
      page_size: pageSize.value,
      status: 'completed', // 只显示已完成的题目
    };

    const response = await searchQuestions(params);
    questions.value = response.questions || [];
    total.value = response.total || 0;
  } catch (error) {
    message.error($t('question.message.fetchFailed'));
    console.error('Failed to fetch questions:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchQuestions();
};

const handleFilterChange = () => {
  currentPage.value = 1;
  fetchQuestions();
};

const handleReset = () => {
  filters.value = {
    subject: undefined,
    difficulty: undefined,
    grade: undefined,
    question_type: undefined,
  };
  searchKeyword.value = '';
  currentPage.value = 1;
  fetchQuestions();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchQuestions();
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchQuestions();
};

const isQuestionSelected = (questionId: string) => {
  return selectedQuestions.value.some((q) => q.id === questionId);
};

const isQuestionInSet = (questionId: string) => {
  return currentQuestionSetItems.value.some(
    (item) => item.question_id === questionId,
  );
};

const toggleQuestionSelection = (question: any) => {
  questionSetsStore.toggleQuestionSelection(question);
};

const removeQuestionFromQuestionSet = async (questionId: string) => {
  const setId = route.params.id as string;
  try {
    await questionSetsStore.removeQuestionFromSet(setId, questionId);
    message.success('题目删除成功');
    await fetchQuestionSetItems(); // 刷新题目列表
  } catch (error) {
    message.error('删除题目失败');
    console.error('Failed to remove question from set:', error);
  }
};

const addSelectedQuestionsToSet = async () => {
  const setId = route.params.id as string;
  if (selectedQuestions.value.length === 0) {
    message.warning('请先选择要添加的题目');
    return;
  }

  try {
    const addPromises = selectedQuestions.value.map((question, index) =>
      questionSetsStore.addQuestionToSet(
        setId,
        question.id,
        currentQuestionSetItems.value.length + index + 1,
      ),
    );

    await Promise.all(addPromises);
    message.success(`成功添加 ${selectedQuestions.value.length} 个题目`);
    questionSetsStore.clearSelectedQuestions();
    await fetchQuestionSetItems(); // 刷新题目列表
  } catch (error) {
    message.error('添加题目失败');
    console.error('Failed to add questions to set:', error);
  }
};

const handleClear = () => {
  questionSetsStore.clearSelectedQuestions();
};

const handleView = (id: string) => {
  router.push(`/questions/${id}/detail`);
};

const handleSave = async () => {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  saving.value = true;
  try {
    await questionSetsStore.updateQuestionSet(route.params.id as string, {
      ...formData.value,
      status: 'active', // 默认状态
    });

    message.success('题目集更新成功');
    router.push(`/question-sets/detail/${route.params.id}`);
  } catch (error) {
    message.error('更新题目集失败');
    console.error('Failed to update question set:', error);
  } finally {
    saving.value = false;
  }
};

const handleBack = () => {
  router.back();
};

// 生命周期
onMounted(() => {
  fetchData();
  fetchQuestions();
});
</script>

<template>
  <div class="p-4">
    <!-- 头部区域 -->
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">
        {{ $t('question_set.page.title.edit') }}
      </h1>
      <NSpace>
        <NButton @click="handleBack">
          {{ $t('common.action.back') }}
        </NButton>
        <NButton type="primary" @click="handleSave" :loading="saving">
          {{ $t('common.action.save') }}
        </NButton>
      </NSpace>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <NSpin size="large" />
    </div>

    <div v-else class="grid grid-cols-12 gap-6">
      <!-- 左侧：题目集信息表单 -->
      <div class="col-span-4">
        <NCard
          :title="$t('question_set.page.title.questionSetInfo')"
          class="sticky top-4"
        >
          <NForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-placement="top"
            size="medium"
          >
            <NFormItem :label="$t('question_set.property.name')" path="name">
              <NInput
                v-model:value="formData.name"
                :placeholder="$t('question_set.placeholder.name')"
              />
            </NFormItem>

            <NFormItem
              :label="$t('question_set.property.description')"
              path="description"
            >
              <NInput
                v-model:value="formData.description"
                type="textarea"
                :placeholder="$t('question_set.placeholder.description')"
                :rows="3"
              />
            </NFormItem>

            <NFormItem
              :label="$t('question_set.property.set_type')"
              path="set_type"
            >
              <NSelect
                v-model:value="formData.set_type"
                :placeholder="$t('question_set.placeholder.set_type')"
                :options="questionSetTypeOptions"
              />
            </NFormItem>

            <NFormItem label="设置">
              <NSpace vertical class="w-full">
                <div class="flex items-center justify-between">
                  <span>是否显示答案</span>
                  <NSwitch v-model:value="formData.settings.show_answers" />
                </div>
                <div class="flex items-center justify-between">
                  <span>是否显示解析</span>
                  <NSwitch v-model:value="formData.settings.show_analysis" />
                </div>
              </NSpace>
            </NFormItem>
          </NForm>

          <div class="mt-6">
            <NAlert type="info" class="mb-4">
              <div class="text-sm">
                <p>
                  当前题目集包含 {{ currentQuestionSetItems.length }} 个题目
                </p>
                <p v-if="selectedQuestions.length > 0">
                  已选择 {{ selectedQuestions.length }} 个新题目
                </p>
              </div>
            </NAlert>

            <NSpace>
              <NButton
                @click="addSelectedQuestionsToSet"
                :disabled="selectedQuestions.length === 0"
                type="success"
              >
                添加选中题目 ({{ selectedQuestions.length }})
              </NButton>
              <NButton
                @click="handleClear"
                :disabled="selectedQuestions.length === 0"
              >
                清空选择
              </NButton>
            </NSpace>
          </div>

          <!-- 题目集中的题目列表 -->
          <div class="mt-6">
            <NDivider>
              题目集中的题目 ({{ currentQuestionSetItems.length }})
            </NDivider>

            <div
              v-if="currentQuestionSetItems.length === 0"
              class="py-4 text-center text-gray-500"
            >
              当前题目集还没有题目，请从右侧选择题目添加
            </div>

            <div v-if="currentQuestionSetItems.length > 0">
              <div class="max-h-64 overflow-y-auto">
                <div
                  v-for="(item, index) in currentQuestionSetItems"
                  :key="item.id"
                  class="mb-2 flex items-center justify-between rounded bg-gray-50 p-2"
                >
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium">
                      {{ index + 1 }}. 题目 {{ item.question_id }}
                    </div>
                    <div class="text-xs text-gray-500">
                      排序: {{ item.sort_order }}
                    </div>
                  </div>
                  <NSpace>
                    <NButton
                      size="tiny"
                      type="info"
                      ghost
                      @click="handleView(item.question_id)"
                    >
                      {{ $t('common.action.view') }}
                    </NButton>
                    <NButton
                      size="tiny"
                      type="error"
                      ghost
                      @click="removeQuestionFromQuestionSet(item.question_id)"
                    >
                      {{ $t('common.action.remove') }}
                    </NButton>
                  </NSpace>
                </div>
              </div>
            </div>
          </div>

          <!-- 已选题目列表 -->
          <div v-if="selectedQuestions.length > 0" class="mt-6">
            <NDivider> 待添加的题目 ({{ selectedQuestions.length }}) </NDivider>
            <div class="max-h-64 overflow-y-auto">
              <div
                v-for="(question, index) in selectedQuestions"
                :key="question.id"
                class="mb-2 flex items-center justify-between rounded bg-blue-50 p-2"
              >
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium">
                    {{ index + 1 }}.
                    {{ `题目 ${question.external_id || question.id}` }}
                  </div>
                  <div class="text-xs text-gray-500">
                    <QuestionTypeTag :type="question.question_type" />
                    <QuestionDifficultyTag :difficulty="question.difficulty" />
                  </div>
                </div>
                <NSpace>
                  <NButton
                    size="tiny"
                    type="info"
                    ghost
                    @click="handleView(question.id)"
                  >
                    {{ $t('common.action.view') }}
                  </NButton>
                  <NButton
                    size="tiny"
                    type="error"
                    ghost
                    @click="toggleQuestionSelection(question)"
                  >
                    {{ $t('common.action.cancel') }}
                  </NButton>
                </NSpace>
              </div>
            </div>
          </div>
        </NCard>
      </div>

      <!-- 右侧：题目列表 -->
      <div class="col-span-8">
        <NCard title="选择题目">
          <!-- 筛选器 -->
          <div class="mb-4 flex items-center space-x-4">
            <QuestionSubjectFormSelect
              v-model="filters.subject"
              :options="subjectOptions"
              :style="{ width: '120px' }"
              :clearable="true"
              :handle-update="handleFilterChange"
            />

            <QuestionGradeFormSelect
              v-model="filters.grade"
              :options="gradeOptions"
              :style="{ width: '120px' }"
              :clearable="true"
              :handle-update="handleFilterChange"
            />

            <QuestionTypeFormSelect
              v-model="filters.question_type"
              :options="questionTypeOptions"
              :style="{ width: '120px' }"
              :clearable="true"
              :handle-update="handleFilterChange"
            />

            <QuestionDifficultyFormSelect
              v-model="filters.difficulty"
              :options="difficultyOptions"
              :style="{ width: '120px' }"
              :clearable="true"
              :handle-update="handleFilterChange"
            />
          </div>
          <div class="mb-4 flex items-center space-x-4">
            <NInput
              v-model:value="searchKeyword"
              placeholder="搜索题目内容..."
              clearable
              style="width: 600px"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <SearchIcon />
              </template>
            </NInput>
            <NButton @click="handleReset"> 重置 </NButton>
            <NButton @click="handleSearch" :loading="loading"> 搜索 </NButton>
          </div>

          <!-- 题目列表 -->
          <div v-if="loading" class="flex justify-center py-8">
            <NSpin size="medium" />
          </div>

          <div
            v-else-if="questions.length === 0"
            class="py-8 text-center text-gray-500"
          >
            暂无题目
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="question in questions"
              :key="question.id"
              class="rounded-lg border p-4 transition-shadow hover:shadow-md"
              :class="{
                'border-blue-500 bg-blue-50': isQuestionSelected(question.id),
                'border-green-500 bg-green-50': isQuestionInSet(question.id),
                'border-gray-200':
                  !isQuestionSelected(question.id) &&
                  !isQuestionInSet(question.id),
              }"
            >
              <div class="flex items-start justify-between">
                <div class="min-w-0 flex-1">
                  <div class="mb-2 flex items-center space-x-2">
                    <QuestionSubjectTag :subject="question.subject" />
                    <QuestionGradeTag :grade="question.grade" />
                    <QuestionTypeTag :type="question.question_type" />
                    <QuestionDifficultyTag :difficulty="question.difficulty" />
                    <span class="text-xs text-gray-500">
                      {{ localTime(question.created_at) }}
                    </span>
                    <span
                      v-if="isQuestionInSet(question.id)"
                      class="text-xs font-medium text-green-600"
                    >
                      已在题目集中
                    </span>
                  </div>

                  <div class="mb-2 text-sm text-gray-900">
                    <ContentDisplay
                      v-for="(item, index) in question.contents"
                      :key="index"
                      :item="item"
                      :display-mode="true"
                      :font-size="16"
                      :show-preview="true"
                    />
                  </div>

                  <QuestionKnowledgePointsTag
                    :knowledge-points="question.knowledge_points"
                  />
                </div>

                <div class="flex items-center space-x-2">
                  <NButton
                    v-if="!isQuestionInSet(question.id)"
                    size="small"
                    :type="
                      isQuestionSelected(question.id) ? 'error' : 'primary'
                    "
                    @click="toggleQuestionSelection(question)"
                  >
                    {{ isQuestionSelected(question.id) ? '取消选择' : '选择' }}
                  </NButton>
                  <NButton size="small" ghost @click="handleView(question.id)">
                    查看
                  </NButton>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="questions.length > 0" class="mt-6 flex justify-center">
            <NPagination
              v-model:page="currentPage"
              :page-count="Math.ceil(total / pageSize)"
              :page-size="pageSize"
              show-size-picker
              :page-sizes="[10, 20, 50]"
              @update:page="handlePageChange"
              @update:page-size="handlePageSizeChange"
            />
          </div>
        </NCard>
      </div>
    </div>

    <!-- 题目预览对话框 -->
    <NModal
      v-model:show="showPreviewModal"
      style="width: 80%; max-width: 800px"
    >
      <NCard
        title="题目预览"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <template #header-extra>
          <NButton quaternary @click="showPreviewModal = false">
            <template #icon>
              <X />
            </template>
          </NButton>
        </template>

        <div v-if="previewingQuestion">
          <QuestionDisplay :question="previewingQuestion" />
        </div>
      </NCard>
    </NModal>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
}

.col-span-4 {
  grid-column: span 4 / span 4;
}

.col-span-8 {
  grid-column: span 8 / span 8;
}

.grid-cols-12 {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.sticky {
  position: sticky;
}

.top-4 {
  top: 1rem;
}
</style>
