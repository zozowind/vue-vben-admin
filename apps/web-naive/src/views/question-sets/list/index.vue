<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';

import type { QuestionSetInfo } from '#/api/question-sets';

import { computed, h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { RotateCw, Search } from '@vben/icons';

import {
  NButton,
  NCard,
  NDataTable,
  NInput,
  NModal,
  NSelect,
  useMessage,
} from 'naive-ui';

import {
  getQuestionSetStatusOptions,
  getQuestionSetTypeOptions,
} from '#/config/options';
import { $t } from '#/locales';
import { useQuestionSetsStore } from '#/store/modules/question-sets';
import { localTime } from '#/utils/time';

const router = useRouter();
const message = useMessage();
const questionSetsStore = useQuestionSetsStore();

// 响应式数据
const loading = ref(false);
const deleting = ref(false);
const searchKeyword = ref('');
const selectedStatus = ref<null | string>(null);
const selectedType = ref<null | string>(null);
const showDeleteModal = ref(false);
const deletingItem = ref<null | QuestionSetInfo>(null);
const currentPage = ref(1);
const pageSize = ref(20);

// 计算属性
const questionSets = computed(() => questionSetsStore.questionSets);
const total = computed(() => questionSetsStore.total);
const questionSetTypeOptions = computed(() => [
  { label: $t('question_set.options.all'), value: '' },
  ...getQuestionSetTypeOptions(),
]);
const questionSetStatusOptions = computed(() => [
  { label: $t('question_set.options.all'), value: '' },
  ...getQuestionSetStatusOptions(),
]);

// 分页配置
const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  itemCount: total.value,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  showQuickJumper: true,
  onUpdatePage: (page: number) => {
    currentPage.value = page;
    fetchData();
  },
  onUpdatePageSize: (size: number) => {
    pageSize.value = size;
    currentPage.value = 1;
    fetchData();
  },
}));

// 表格列定义
const columns: DataTableColumns<QuestionSetInfo> = [
  {
    title: $t('question_set.property.name'),
    key: 'name',
    render: (row) => {
      return h('div', { class: 'font-medium' }, row.name);
    },
  },
  {
    title: $t('question_set.property.description'),
    key: 'description',
    render: (row) => {
      return row.description || '-';
    },
  },
  {
    title: $t('question_set.property.set_type'),
    key: 'set_type',
    render: (row) => {
      return $t(`question_set.options.types.${row.set_type}`);
    },
  },
  {
    title: $t('question_set.property.status'),
    key: 'status',
    render: (row) => {
      return $t(`question_set.options.statuses.${row.status}`);
    },
  },
  {
    title: $t('question_set.property.createdAt'),
    key: 'created_at',
    render: (row) => localTime(row.created_at),
  },
  {
    title: $t('question_set.property.actions'),
    key: 'actions',
    render: (row) => {
      return h('div', { class: 'flex space-x-2' }, [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            ghost: true,
            onClick: () => handleView(row),
          },
          { default: () => $t('common.action.view') },
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'info',
            ghost: true,
            onClick: () => handleEdit(row),
          },
          { default: () => $t('common.action.edit') },
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'success',
            ghost: true,
            onClick: () => handlePreview(row),
          },
          { default: () => $t('common.action.preview') },
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            ghost: true,
            onClick: () => handleDelete(row),
          },
          { default: () => $t('common.action.delete') },
        ),
      ]);
    },
  },
];

// 方法
const fetchData = async () => {
  loading.value = true;
  try {
    await questionSetsStore.fetchQuestionSets({
      page: currentPage.value,
      page_size: pageSize.value,
      status:
        selectedStatus.value && selectedStatus.value !== ''
          ? selectedStatus.value
          : undefined,
      set_type:
        selectedType.value && selectedType.value !== ''
          ? selectedType.value
          : undefined,
      keyword:
        searchKeyword.value && searchKeyword.value.trim() !== ''
          ? searchKeyword.value.trim()
          : undefined,
    });
  } catch {
    message.error($t('question_set.message.fetchFailed'));
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchData();
};

const handleRefresh = () => {
  fetchData();
};

const handleCreate = () => {
  router.push('/question-sets/create');
};

const handleView = (item: QuestionSetInfo) => {
  router.push(`/question-sets/${item.id}/detail`);
};

const handleEdit = (item: QuestionSetInfo) => {
  router.push(`/question-sets/${item.id}/edit`);
};

const handlePreview = (item: QuestionSetInfo) => {
  router.push(`/question-sets/${item.id}/preview`);
};

const handleDelete = (item: QuestionSetInfo) => {
  deletingItem.value = item;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!deletingItem.value) return;

  deleting.value = true;
  try {
    await questionSetsStore.deleteQuestionSet(deletingItem.value.id);
    message.success($t('question_set.message.deleteSuccess'));
    showDeleteModal.value = false;
    fetchData();
  } catch {
    message.error($t('question_set.message.deleteFailed'));
  } finally {
    deleting.value = false;
  }
};

// 生命周期
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">
        {{ $t('question_set.page.title.questionSetManagement') }}
      </h1>

      <NSpace>
        <NButton type="primary" @click="handleCreate" :loading="loading">
          {{ $t('question_set.action.create') }}
        </NButton>
      </NSpace>
    </div>
    <div>
      <div class="flex items-center space-x-2">
        <NInput
          v-model:value="searchKeyword"
          placeholder="搜索题目集..."
          clearable
          style="width: 250px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <Search />
          </template>
        </NInput>
        <NSelect
          v-model:value="selectedType"
          :options="questionSetTypeOptions"
          placeholder="选择类型"
          clearable
          style="width: 150px"
        />
        <NSelect
          v-model:value="selectedStatus"
          :options="questionSetStatusOptions"
          placeholder="选择状态"
          clearable
          style="width: 150px"
        />
        <NButton type="primary" @click="handleSearch" :loading="loading">
          <template #icon>
            <Search />
          </template>
          搜索
        </NButton>
        <NButton @click="handleRefresh" :loading="loading">
          <template #icon>
            <RotateCw />
          </template>
        </NButton>
      </div>
    </div>
    <!-- 题目集列表 -->
    <NCard>
      <NDataTable
        :columns="columns"
        :data="questionSets"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row) => row.id"
        size="medium"
      />
    </NCard>

    <!-- 删除确认对话框 -->
    <NModal v-model:show="showDeleteModal">
      <NCard
        style="width: 400px"
        title="确认删除"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <div class="mb-4">
          <p>确定要删除题目集 "{{ deletingItem?.name }}" 吗？</p>
          <p class="mt-2 text-sm text-gray-500">此操作不可撤销。</p>
        </div>
        <template #footer>
          <div class="flex justify-end space-x-2">
            <NButton @click="showDeleteModal = false">取消</NButton>
            <NButton type="error" @click="confirmDelete" :loading="deleting">
              删除
            </NButton>
          </div>
        </template>
      </NCard>
    </NModal>
  </div>
</template>

<style scoped>
.n-data-table :deep(.n-data-table-th) {
  background-color: #f8f9fa;
}
</style>
