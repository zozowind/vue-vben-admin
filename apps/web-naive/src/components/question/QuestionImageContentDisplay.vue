<script lang="ts" setup>
import type { ContentItem } from '#/api/questions';

import { computed } from 'vue';

import { NImage } from 'naive-ui';

interface Props {
  item: ContentItem;
  maxWidth?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down';
  showPreview?: boolean;
  fallbackSrc?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: '100%',
  objectFit: 'contain',
  showPreview: true,
  fallbackSrc:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMDAgMTAwTDI0MCAyMDBIMTYwTDIwMCAxMDBaIiBmaWxsPSIjQ0NDIi8+CjxjaXJjbGUgY3g9IjMwMCIgY3k9IjEwMCIgcj0iMjAiIGZpbGw9IiNDQ0MiLz4KPC9zdmc+',
});

// 渲染图片内容
const imageSrc = computed(() => {
  const item = props.item;

  if (item.format === 'base64') {
    const mimeType = item.attributes?.mime_type || 'image/jpeg';
    return `data:${mimeType};base64,${item.content}`;
  } else if (item.format === 'url') {
    return item.content;
  } else {
    return item.content;
  }
});

// 图片alt文本
const altText = computed(() => {
  return props.item.attributes?.filename || 'Image';
});

// 图片样式
const imageStyle = computed(() => ({
  maxWidth: props.maxWidth,
  height: 'auto',
}));
</script>

<template>
  <div class="image-content-display">
    <NImage
      :src="imageSrc"
      :alt="altText"
      :style="imageStyle"
      :object-fit="objectFit"
      :preview="showPreview"
      :fallback-src="fallbackSrc"
      class="content-image"
      lazy
    />
  </div>
</template>

<style scoped>
.image-content-display {
  text-align: center;
}

.content-image {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  transition: transform 0.3s ease;
}

.content-image:hover {
  transform: scale(1.02);
}

.image-info {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.filename {
  margin-bottom: 2px;
  font-weight: 500;
}

.file-size {
  font-size: 11px;
  opacity: 0.8;
}
</style>
