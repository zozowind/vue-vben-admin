<script lang="ts" setup>
import type { ContentItem } from '#/api/questions';

import { computed } from 'vue';

import { NButton, NIcon } from 'naive-ui';

import { $t } from '#/locales';
import { formatFileSize } from '#/utils/file';

interface Props {
  item: ContentItem;
  showDownload?: boolean;
  showFileInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDownload: true,
  showFileInfo: true,
});

// 获取文件图标
const fileIcon = computed(() => {
  const mimeType = props.item.attributes?.mime_type || '';
  const filename = props.item.attributes?.filename || '';

  // 根据MIME类型或文件扩展名返回图标
  if (mimeType.startsWith('image/')) {
    return '🖼️';
  } else if (mimeType.includes('pdf')) {
    return '📄';
  } else if (mimeType.includes('word') || filename.includes('.doc')) {
    return '📝';
  } else if (mimeType.includes('excel') || filename.includes('.xls')) {
    return '📊';
  } else if (mimeType.includes('powerpoint') || filename.includes('.ppt')) {
    return '📋';
  } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
    return '📦';
  } else if (mimeType.includes('video/')) {
    return '🎬';
  } else if (mimeType.includes('audio/')) {
    return '🎵';
  } else {
    return '📎';
  }
});

// 渲染文件链接
const fileLink = computed(() => {
  const item = props.item;

  if (item.format === 'url') {
    return item.content;
  }

  if (item.format === 'base64') {
    const mimeType = item.attributes?.mime_type || 'application/octet-stream';
    try {
      const binaryString = atob(item.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.codePointAt(i) || 0;
      }
      const blob = new Blob([bytes], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to create blob URL:', error);
      return '#';
    }
  }

  return '#';
});

// 文件名
const fileName = computed(() => {
  return props.item.attributes?.filename || 'Unknown File';
});

// 文件大小
const fileSize = computed(() => {
  const size = props.item.attributes?.size;
  if (!size) return null;

  return formatFileSize(Number(size));
});

// 文件类型
const fileType = computed(() => {
  return props.item.attributes?.mime_type || 'Unknown Type';
});

// 是否是URL类型
const isUrlType = computed(() => {
  return props.item.format === 'url';
});

// 处理文件点击
function handleFileClick() {
  const link = fileLink.value;
  if (link && link !== '#') {
    const newWindow = globalThis.window?.open(link, '_blank');
    if (!newWindow) {
      // 如果弹窗被阻止，尝试直接下载
      const a = document.createElement('a');
      a.href = link;
      a.download = fileName.value;
      a.click();
    }
  }
}
</script>

<template>
  <div class="file-content-display">
    <div class="file-container">
      <div class="file-icon">
        <NIcon size="32">{{ fileIcon }}</NIcon>
      </div>

      <div class="file-info">
        <div class="file-name">{{ fileName }}</div>

        <div v-if="showFileInfo" class="file-details">
          <span class="file-type">{{ fileType }}</span>
          <span v-if="fileSize" class="file-size">• {{ fileSize }}</span>
          <span v-if="isUrlType" class="file-source">• URL</span>
        </div>
      </div>

      <div v-if="showDownload" class="file-actions">
        <NButton type="primary" size="small" @click="handleFileClick">
          {{
            isUrlType ? $t('common.action.view') : $t('common.action.download')
          }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-content-display {
  width: 100%;
}

.file-container {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-container:hover {
  background-color: #f1f3f4;
  border-color: #d1d9e0;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  opacity: 0.8;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
  word-break: break-all;
}

.file-details {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #718096;
}

.file-type {
  font-family: monospace;
}

.file-size {
  white-space: nowrap;
}

.file-source {
  font-weight: 500;
  color: #3182ce;
}

.file-actions {
  margin-left: 12px;
}
</style>
