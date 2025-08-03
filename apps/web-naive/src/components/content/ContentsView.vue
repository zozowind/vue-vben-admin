<script lang="ts" setup>
import type { ContentItem } from '#/api/questions';

import ContentDisplay from './ContentDisplay.vue';

interface Props {
  contents?: ContentItem[];
  displayMode?: boolean;
  fontSize?: number;
  showPreview?: boolean;
  showDownload?: boolean;
  showFileInfo?: boolean;
}

withDefaults(defineProps<Props>(), {
  contents: () => [],
  displayMode: false,
  fontSize: 18,
  showPreview: true,
  showDownload: false,
  showFileInfo: false,
});
</script>

<template>
  <div class="contents-view">
    <div class="content-container">
      <div
        v-for="(item, index) in contents"
        :key="index"
        class="content-item"
        :class="{
          'content-text': item.type === 'text',
          'content-image': item.type === 'image',
          'content-file': item.type === 'file',
          'display-mode': displayMode,
        }"
      >
        <ContentDisplay
          :item="item"
          :display-mode="displayMode"
          :font-size="fontSize"
          :show-preview="showPreview"
          :show-download="showDownload"
          :show-file-info="showFileInfo"
        />
      </div>

      <!-- 空状态 -->
      <div v-if="!contents || contents.length === 0" class="empty-content">
        <div class="empty-text">暂无内容</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contents-view {
  width: 100%;
  min-height: 40px;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.content-item {
  position: relative;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.content-text.display-mode {
  text-align: center;
  margin: 1rem 0;
}

.content-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.content-file {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  color: #999;
  font-style: italic;
}

.empty-text {
  font-size: 0.875rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-container {
    gap: 0.75rem;
  }

  .content-item {
    font-size: 0.9rem;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .empty-text {
    color: #666;
  }
}
</style>
