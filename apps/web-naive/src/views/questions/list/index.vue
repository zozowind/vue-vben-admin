<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type {
  QuestionSearchItem,
  QuestionSearchRequest,
} from '#/api/questions';

import { computed, h, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  NButton,
  NCard,
  NDataTable,
  NInput,
  NPagination,
  NPopconfirm,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import {
  batchDeleteQuestions,
  deleteQuestion,
  searchQuestions,
} from '#/api/questions';
import { useQuestionOptions } from '#/composables/useQuestionOptions';
import { $t } from '#/locales';
import { getQuestionContentsPreview } from '#/utils/question';
import { localTime } from '#/utils/time';

defineOptions({
  name: 'QuestionList',
});

const router = useRouter();
const message = useMessage();

// 搜索表单
const searchForm = reactive<QuestionSearchRequest>({
  query: '',
  query_type: 'keyword',
  subjects: [],
  grades: [],
  difficulties: [],
  question_types: [],
  statuses: [],
  page: 1,
  page_size: 20,
  order_by: 'created_at',
  order_dir: 'desc',
});

// 数据状态
const loading = ref(false);
const questions = ref<QuestionSearchItem[]>([]);
const total = ref(0);
const selectedRowKeys = ref<string[]>([]);

// 选项配置
const {
  queryTypeOptions,
  subjectOptions,
  gradeOptions,
  difficultyOptions,
  questionTypeOptions,
  statusOptions,
} = useQuestionOptions();

// 表格列定义
const columns = computed<DataTableColumns<QuestionSearchItem>>(() => [
  {
    type: 'selection',
    multiple: true,
  },
  {
    title: $t('question.property.type'),
    key: 'question_type',
    width: 100,
    render: (row) =>
      row.question_type
        ? $t(`question.options.questionTypes.${row.question_type}`)
        : '',
  },
  {
    title: $t('question.property.subject'),
    key: 'subject',
    width: 80,
    render: (row) =>
      row.subject ? $t(`question.options.subjects.${row.subject}`) : '',
  },
  {
    title: $t('question.property.grade'),
    key: 'grade',
    width: 80,
    render: (row) =>
      row.grade
        ? $t(`question.options.grades.grade`, { grade: row.grade })
        : '',
  },
  {
    title: $t('question.property.difficulty'),
    key: 'difficulty',
    width: 80,
    render: (row) =>
      row.difficulty
        ? $t(`question.options.difficulties.${row.difficulty}`)
        : '',
  },
  {
    title: $t('question.property.content'),
    key: 'content_preview',
    ellipsis: {
      tooltip: true,
    },
    render: (row) => getQuestionContentsPreview(row.contents),
  },
  {
    title: $t('question.property.status'),
    key: 'status',
    width: 100,
    render: (row) =>
      row.status ? $t(`question.options.statuses.${row.status}`) : '',
  },
  {
    title: $t('question.property.createdAt'),
    key: 'created_at',
    width: 180,
    render: (row) => localTime(row.created_at),
  },
  {
    title: $t('question.property.actions'),
    key: 'actions',
    width: 200,
    render: (row) => {
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                onClick: () => handleView(row.id),
              },
              { default: () => $t('common.action.view') },
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'warning',
                onClick: () => handleEdit(row.id),
              },
              { default: () => $t('common.action.edit') },
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleDelete(row.id),
              },
              {
                default: () => $t('question_set.message.deleteConfirm'),
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      type: 'error',
                    },
                    { default: () => $t('common.action.delete') },
                  ),
              },
            ),
          ],
        },
      );
    },
  },
]);

// 方法
async function fetchQuestions() {
  try {
    loading.value = true;
    const result = await searchQuestions(searchForm);
    questions.value = result.questions;
    total.value = result.total;
  } catch (error) {
    message.error($t('question.message.listFetchFailed'));
    console.error('Failed to fetch questions:', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  searchForm.page = 1;
  fetchQuestions();
}

function handleReset() {
  Object.assign(searchForm, {
    query: '',
    query_type: 'keyword',
    subjects: [],
    grades: [],
    difficulties: [],
    question_types: [],
    statuses: [],
    page: 1,
    page_size: 20,
    order_by: 'created_at',
    order_dir: 'desc',
  });
  fetchQuestions();
}

// 查看题目
function handleView(id: string) {
  router.push(`/questions/${id}/detail`);
}

// 编辑题目
function handleEdit(id: string) {
  router.push(`/questions/${id}/edit`);
}

async function handleDelete(id: string) {
  try {
    await deleteQuestion(id);
    message.success($t('question.message.deleteSuccess'));
    fetchQuestions();
  } catch (error) {
    message.error($t('question.message.deleteFailed'));
    console.error('Failed to delete question:', error);
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('page.questions.selectToDelete'));
    return;
  }

  try {
    const result = await batchDeleteQuestions({ ids: selectedRowKeys.value });
    if (result.success.length > 0) {
      message.success(
        $t('question.message.batchDeleteSuccess', {
          count: result.success.length,
        }),
      );
    }
    if (result.failed.length > 0) {
      message.warning(
        $t('question.message.batchDeletePartialFailed', {
          count: result.failed.length,
        }),
      );
    }
    selectedRowKeys.value = [];
    fetchQuestions();
  } catch (error) {
    message.error($t('question.message.batchDeleteFailed'));
    console.error('Failed to batch delete questions:', error);
  }
}

function handlePageChange(page: number) {
  searchForm.page = page;
  fetchQuestions();
}

function handlePageSizeChange(pageSize: number) {
  searchForm.page_size = pageSize;
  searchForm.page = 1;
  fetchQuestions();
}

function handleRowSelectionChange(keys: (number | string)[]) {
  selectedRowKeys.value = keys as string[];
}

function handleImport() {
  router.push('/questions/import');
}

onMounted(() => {
  fetchQuestions();
});
</script>

<template>
  <div class="p-4">
    <!-- 头部区域 -->
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">
        {{ $t('question.page.title.list') }}
      </h1>
      <NSpace>
        <NButton type="primary" @click="handleImport">
          {{ $t('question.action.import') }}
        </NButton>
        <NPopconfirm @positive-click="handleBatchDelete">
          <template #trigger>
            <NButton type="error" :disabled="selectedRowKeys.length === 0">
              {{ $t('question.action.batchDelete') }}
            </NButton>
          </template>
          {{ $t('question.message.deleteConfirm') }}
        </NPopconfirm>
      </NSpace>
    </div>

    <!-- 搜索区域 -->
    <NCard class="mb-4">
      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NInput
          v-model:value="searchForm.query"
          :placeholder="$t('question.placeholder.search')"
          clearable
          @keyup.enter="handleSearch"
        />

        <NSelect
          v-model:value="searchForm.query_type"
          :options="queryTypeOptions"
          :placeholder="$t('question.placeholder.searchType')"
        />

        <NSelect
          v-model:value="searchForm.subjects"
          :options="subjectOptions"
          :placeholder="$t('question.placeholder.subject')"
          multiple
          clearable
        />

        <NSelect
          v-model:value="searchForm.grades"
          :options="gradeOptions"
          :placeholder="$t('question.placeholder.grade')"
          multiple
          clearable
        />

        <NSelect
          v-model:value="searchForm.difficulties"
          :options="difficultyOptions"
          :placeholder="$t('question.placeholder.difficulty')"
          multiple
          clearable
        />

        <NSelect
          v-model:value="searchForm.question_types"
          :options="questionTypeOptions"
          :placeholder="$t('question.placeholder.questionType')"
          multiple
          clearable
        />

        <NSelect
          v-model:value="searchForm.statuses"
          :options="statusOptions"
          :placeholder="$t('question.placeholder.status')"
          multiple
          clearable
        />
      </div>

      <NSpace>
        <NButton type="primary" @click="handleSearch">
          {{ $t('question.action.search') }}
        </NButton>
        <NButton @click="handleReset">
          {{ $t('common.action.reset') }}
        </NButton>
      </NSpace>
    </NCard>

    <!-- 数据表格 -->
    <NCard>
      <NDataTable
        :columns="columns"
        :data="questions"
        :loading="loading"
        :row-key="(row: QuestionSearchItem) => row.id"
        :checked-row-keys="selectedRowKeys"
        @update:checked-row-keys="handleRowSelectionChange"
        size="small"
        striped
      />

      <div class="mt-4 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          {{ $t('common.table.total', { total }) }}
        </div>
        <NPagination
          v-model:page="searchForm.page"
          v-model:page-size="searchForm.page_size"
          :item-count="total"
          :page-sizes="[10, 20, 50, 100]"
          show-size-picker
          show-quick-jumper
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </NCard>
  </div>
</template>
