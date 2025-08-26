<script lang="ts" setup>
import type { ContentItem } from '#/api/questions';

import FileContentDisplay from './QuestionFileContentDisplay.vue';
import ImageContentDisplay from './QuestionImageContentDisplay.vue';
import TextContentDisplay from './QuestionTextContentDisplay.vue';

interface Props {
  item: ContentItem;
  displayMode?: boolean;
  fontSize?: number;
  showPreview?: boolean;
  showDownload?: boolean;
  showFileInfo?: boolean;
}

withDefaults(defineProps<Props>(), {
  displayMode: false,
  fontSize: 16,
  showPreview: true,
  showDownload: false,
  showFileInfo: false,
});
</script>

<template>
  <div class="content-display">
    <!-- 文本内容 -->
    <TextContentDisplay
      v-if="item.type === 'text'"
      :content="item.content"
      :display-mode="displayMode"
      :font-size="fontSize"
    />

    <!-- 图片内容 -->
    <ImageContentDisplay
      v-else-if="item.type === 'image'"
      :item="item"
      :show-preview="showPreview"
      :show-download="showDownload"
      :show-file-info="showFileInfo"
    />

    <!-- 文件内容 -->
    <FileContentDisplay
      v-else-if="item.type === 'file'"
      :item="item"
      :show-download="showDownload"
      :show-file-info="showFileInfo"
    />

    <!-- 未知类型 -->
    <div v-else class="unknown-content">
      <div class="text-gray-500">未知内容类型: {{ item.type }}</div>
    </div>
  </div>
</template>

<style scoped>
/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .unknown-content {
    background: #2a2a2a;
    border-color: #444;
  }
}

.content-display {
  width: 100%;
}

.unknown-content {
  padding: 1rem;
  text-align: center;
  background: #f9f9f9;
  border: 1px dashed #ccc;
  border-radius: 4px;
}
</style>
