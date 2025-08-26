<script lang="ts" setup>
import type { ContentItem } from '#/api/questions';

import { ref } from 'vue';

import {
  NButton,
  NCard,
  NIcon,
  NPopconfirm,
  NSpace,
  useMessage,
} from 'naive-ui';

import { $t } from '#/locales';

import ContentDisplay from './QuestionContentDisplay.vue';
import QuestionContentModal from './QuestionContentModal.vue';

interface Props {
  contents?: ContentItem[];
  editable?: boolean;
  showAddButton?: boolean;
}

interface Emits {
  (e: 'update:contents', contents: ContentItem[]): void;
  (e: 'contentAdded', content: ContentItem, index: number): void;
  (e: 'contentRemoved', index: number): void;
  (e: 'contentUpdated', content: ContentItem, index: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  contents: () => [],
  editable: false,
  showAddButton: true,
});

const emit = defineEmits<Emits>();

const message = useMessage();

// 弹窗状态
const showModal = ref(false);
const insertIndex = ref(-1); // -1表示在末尾添加，其他值表示在指定位置插入
const editingIndex = ref(-1);
const editingItem = ref<ContentItem | null>(null);

// 获取内容类型图标
function getContentIcon(item: ContentItem) {
  switch (item.type) {
    case 'image': {
      return '🖼️';
    }
    case 'text': {
      return '📝';
    }
    default: {
      return '📄';
    }
  }
}

// 打开添加弹窗
function openAddModal(index = -1) {
  insertIndex.value = index;
  editingIndex.value = -1;
  editingItem.value = null;
  showModal.value = true;
}

// 打开编辑弹窗
function openEditModal(index: number) {
  insertIndex.value = -1;
  editingIndex.value = index;
  editingItem.value = props.contents?.[index] || null;
  showModal.value = true;
}

// 处理内容提交（统一处理添加和编辑）
function handleContentSubmitted(content: ContentItem) {
  const currentContents = props.contents || [];
  const newContents = [...currentContents];

  if (editingIndex.value >= 0) {
    // 编辑模式
    newContents[editingIndex.value] = content;
    emit('update:contents', newContents);
    emit('contentUpdated', content, editingIndex.value);
  } else {
    // 添加模式
    if (insertIndex.value === -1) {
      // 在末尾添加
      newContents.push(content);
      emit('contentAdded', content, newContents.length - 1);
    } else {
      // 在指定位置插入
      newContents.splice(insertIndex.value, 0, content);
      emit('contentAdded', content, insertIndex.value);
    }
    emit('update:contents', newContents);
  }
}

// 删除内容项
function handleRemoveContent(index: number) {
  const currentContents = props.contents || [];
  const newContents = [...currentContents];
  newContents.splice(index, 1);
  emit('update:contents', newContents);
  emit('contentRemoved', index);
  message.success($t('question.message.contentRemoved'));
}

// 移动内容项
function moveContent(fromIndex: number, toIndex: number) {
  const currentContents = props.contents || [];
  if (toIndex < 0 || toIndex >= currentContents.length) return;

  const newContents = [...currentContents];
  const [movedItem] = newContents.splice(fromIndex, 1);
  if (movedItem) {
    newContents.splice(toIndex, 0, movedItem);
  }
  emit('update:contents', newContents);
}

// 移除渲染函数，由ContentDisplay组件处理
</script>

<template>
  <div class="contents-edit">
    <!-- 内容为空时的提示 -->
    <div
      v-if="!contents || contents.length === 0"
      class="flex flex-col items-center justify-center py-12 text-gray-500"
    >
      <NIcon size="48" class="mb-4">📝</NIcon>
      <p class="mb-4">{{ $t('question.message.noContent') }}</p>
      <NButton
        v-if="editable && showAddButton"
        type="primary"
        @click="openAddModal()"
      >
        {{ $t('question.page.content.addFirstContent') }}
      </NButton>
    </div>

    <!-- 内容块列表 -->
    <div v-else class="space-y-4">
      <template v-for="(item, index) in contents" :key="index">
        <!-- 插入按钮（在内容项前面） -->
        <div v-if="editable && showAddButton" class="flex justify-center">
          <NButton size="small" quaternary @click="openAddModal(index)">
            <NIcon>➕</NIcon>
            {{ $t('question.page.content.insertBefore') }}
          </NButton>
        </div>

        <!-- 内容块 -->
        <NCard class="content-block" :bordered="true">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <NIcon size="16">{{ getContentIcon(item) }}</NIcon>
                <span class="text-sm text-gray-600">
                  {{ $t(`question.options.contentTypes.${item.type}`) }}
                </span>
                <span class="text-xs text-gray-400"> #{{ index + 1 }} </span>
              </div>

              <!-- 操作按钮 -->
              <NSpace v-if="editable" size="small">
                <!-- 编辑 -->
                <NButton
                  size="tiny"
                  type="primary"
                  quaternary
                  @click="openEditModal(index)"
                >
                  ✏️
                </NButton>

                <!-- 上移 -->
                <NButton
                  size="tiny"
                  quaternary
                  :disabled="index === 0"
                  @click="moveContent(index, index - 1)"
                >
                  ↑
                </NButton>

                <!-- 下移 -->
                <NButton
                  size="tiny"
                  quaternary
                  :disabled="index === (contents?.length || 0) - 1"
                  @click="moveContent(index, index + 1)"
                >
                  ↓
                </NButton>

                <!-- 删除 -->
                <NPopconfirm
                  :content="$t('question.message.deleteContentConfirm')"
                  @positive-click="handleRemoveContent(index)"
                >
                  <template #trigger>
                    <NButton size="tiny" type="error" quaternary> 🗑️ </NButton>
                  </template>
                </NPopconfirm>
              </NSpace>
            </div>
          </template>

          <!-- 内容展示 -->
          <div
            class="content-display-wrapper"
            :class="{ 'editable-content': editable }"
            @click="editable ? openEditModal(index) : undefined"
          >
            <ContentDisplay
              :item="item"
              :display-mode="false"
              :font-size="16"
              :show-preview="true"
              :show-download="true"
              :show-file-info="true"
            />
          </div>
        </NCard>

        <!-- 插入按钮（在最后一个内容项后面） -->
        <div
          v-if="
            editable && showAddButton && index === (contents?.length || 0) - 1
          "
          class="flex justify-center"
        >
          <NButton size="small" quaternary @click="openAddModal()">
            <NIcon>➕</NIcon>
            {{ $t('question.page.content.insertAfter') }}
          </NButton>
        </div>
      </template>
    </div>

    <!-- 内容弹窗（统一处理添加和编辑） -->
    <!-- eslint-disable-next-line vue/v-on-event-hyphenation -->
    <QuestionContentModal
      v-model:show="showModal"
      :editing-item="editingItem"
      @content-submitted="handleContentSubmitted"
    />
  </div>
</template>

<style scoped>
/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .editable-content:hover {
    background-color: rgb(255 255 255 / 5%);
  }
}

.content-block {
  transition: all 0.2s ease;
}

.content-block:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
}

.content-display-wrapper {
  width: 100%;
}

.editable-content {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.editable-content:hover {
  background-color: rgb(0 0 0 / 2%);
  border-radius: 4px;
}
</style>
