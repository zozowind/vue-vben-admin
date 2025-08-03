<!-- eslint-disable vue/custom-event-name-casing -->
<script lang="ts" setup>
import type { UploadFileInfo } from 'naive-ui';

import type { ContentItem } from '#/api/questions';

import { computed, reactive, ref, watch } from 'vue';

import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NP,
  NRadio,
  NRadioGroup,
  NSelect,
  NText,
  NUpload,
  NUploadDragger,
  useMessage,
} from 'naive-ui';

import { $t } from '#/locales';
import { createContentItem, fileToBase64 } from '#/utils/file';

interface Props {
  show: boolean;
  editingItem?: ContentItem | null;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'content-submitted', content: ContentItem): void;
}

const props = withDefaults(defineProps<Props>(), {
  editingItem: null,
});

const emit = defineEmits<Emits>();

const message = useMessage();

// 判断是否为编辑模式
const isEditMode = computed(() => !!props.editingItem);

// 模态框标题
const modalTitle = computed(() =>
  isEditMode.value
    ? $t('question.page.title.editContent')
    : $t('question.page.title.addContent'),
);

// 提交按钮文字
const submitButtonText = computed(() =>
  isEditMode.value ? $t('common.action.update') : $t('common.action.add'),
);

// 内容类型选项
const contentTypeOptions = [
  { label: $t('question.options.contentTypes.text'), value: 'text' },
  { label: $t('question.options.contentTypes.image'), value: 'image' },
  { label: $t('question.options.contentTypes.file'), value: 'file' },
];

// 表单数据
const formData = reactive({
  type: 'text' as ContentItem['type'],
  format: 'text' as ContentItem['format'],
  content: '',
  attributes: {} as Record<string, string>,
  uploadedFile: null as File | null,
});

const loading = ref(false);

// 监听编辑项变化，初始化表单数据
watch(
  () => props.editingItem,
  (item) => {
    if (item) {
      formData.type = item.type;
      formData.format = item.format || 'text';
      formData.content = item.content;
      formData.attributes = item.attributes ? { ...item.attributes } : {};
      formData.uploadedFile = null;
    } else {
      resetForm();
    }
  },
  { immediate: true, deep: true },
);

// 监听弹窗显示状态
watch(
  () => props.show,
  (show) => {
    if (!show) {
      resetForm();
    }
  },
);

// 重置表单
function resetForm() {
  formData.type = 'text';
  formData.format = 'text';
  formData.content = '';
  formData.attributes = {};
  formData.uploadedFile = null;
}

// 关闭弹窗
function handleClose() {
  emit('update:show', false);
  resetForm();
}

// 获取显示的格式选项
const formatOptions = computed(() => {
  if (formData.type === 'text') {
    return [
      { label: '普通文本', value: 'text' },
      { label: 'LaTeX', value: 'latex' },
    ];
  } else if (formData.type === 'image' || formData.type === 'file') {
    return [
      { label: 'URL链接', value: 'url' },
      { label: 'Base64编码', value: 'base64' },
    ];
  }
  return [];
});

// 根据添加方式筛选可用的内容类型
const availableContentTypes = computed(() => {
  return contentTypeOptions;
});

// 文件上传处理
async function handleFileUpload({ file }: { file: UploadFileInfo }) {
  try {
    const fileObj = file.file as File;
    if (!fileObj) {
      message.error('文件无效');
      return;
    }

    // 文件大小检查 (10MB)
    if (fileObj.size > 10 * 1024 * 1024) {
      message.error('文件大小不能超过10MB');
      return;
    }

    formData.uploadedFile = fileObj;
    formData.format = 'base64';

    // 根据文件类型自动设置内容类型
    const isImage = fileObj.type.startsWith('image/');
    formData.type = isImage ? 'image' : 'file';

    // 更新attributes
    formData.attributes = {
      filename: fileObj.name,
      mime_type: fileObj.type,
      size: fileObj.size.toString(),
    };

    message.success(`文件 "${fileObj.name}" 已选择`);
  } catch (error) {
    console.error('File selection error:', error);
    message.error('文件选择失败');
  }
}

// 提交处理
async function handleSubmit() {
  try {
    loading.value = true;
    let contentItem: ContentItem;

    if (formData.type === 'text') {
      // 文本内容
      if (!formData.content.trim()) {
        message.warning($t('question.message.textContentRequired'));
        return;
      }

      contentItem = {
        type: formData.type,
        content: formData.content.trim(),
        format: formData.format,
        attributes: {
          filename: formData.attributes.filename || '文本内容',
        },
      };
    } else if (formData.format === 'base64' && formData.uploadedFile) {
      // 文件上传
      const base64Content = await fileToBase64(formData.uploadedFile);
      contentItem = createContentItem({
        file: formData.uploadedFile,
        base64Content,
      });

      // 应用用户选择的类型
      contentItem.type = formData.type;
    } else if (formData.format === 'url') {
      // URL内容
      if (!formData.content.trim()) {
        message.warning($t('question.message.urlRequired'));
        return;
      }

      // 验证URL格式
      try {
        // eslint-disable-next-line no-new
        new URL(formData.content.trim());
      } catch {
        message.error('请输入有效的URL地址');
        return;
      }

      const url = formData.content.trim();
      contentItem = {
        type: formData.type,
        content: url,
        format: formData.format,
        attributes: {
          url,
          filename:
            formData.attributes.filename || url.split('/').pop() || 'URL内容',
        },
      };
    } else {
      message.error('请提供有效的内容');
      return;
    }

    // 发送内容提交事件
    emit('content-submitted', contentItem);

    // 关闭弹窗
    handleClose();

    // 显示成功消息
    const successMessage = isEditMode.value
      ? '内容更新成功'
      : $t('question.message.contentAdded');
    message.success(successMessage);
  } catch (error) {
    console.error('Content submit error:', error);
    const errorMessage = isEditMode.value
      ? '内容更新失败'
      : $t('question.message.addContentFailed');
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal :show="props.show" @update:show="emit('update:show', $event)">
    <NCard
      style="width: 800px; max-width: 90vw"
      :title="modalTitle"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      closable
      @close="handleClose"
    >
      <NForm label-placement="top" label-width="100">
        <!-- 内容类型选择 -->
        <NFormItem
          :label="$t('question.page.content.contentType')"
          style="min-height: 64px"
        >
          <NRadioGroup v-model:value="formData.type">
            <NRadio
              v-for="option in availableContentTypes"
              :key="option.value"
              :value="option.value"
              class="mr-4"
            >
              {{ option.label }}
            </NRadio>
          </NRadioGroup>
        </NFormItem>

        <!-- 格式选择 -->
        <NFormItem v-if="formatOptions.length > 1" label="内容格式">
          <NSelect
            v-model:value="formData.format"
            :options="formatOptions"
            placeholder="请选择内容格式"
          />
        </NFormItem>

        <!-- 主要内容输入区域 -->
        <NFormItem
          :label="
            formData.type === 'text'
              ? formData.format === 'latex'
                ? 'LaTeX内容'
                : '文本内容'
              : formData.format === 'url'
                ? formData.type === 'image'
                  ? '图片URL'
                  : '文件URL'
                : '文件上传'
          "
          style="min-height: 200px"
        >
          <!-- 文本内容编辑 -->
          <NInput
            v-if="formData.type === 'text'"
            v-model:value="formData.content"
            type="textarea"
            :placeholder="
              formData.format === 'latex'
                ? '请输入LaTeX格式的内容'
                : '请输入文本内容'
            "
            :autosize="{ minRows: 6, maxRows: 8 }"
          />

          <!-- URL内容编辑 -->
          <NInput
            v-else-if="formData.format === 'url'"
            v-model:value="formData.content"
            :placeholder="
              formData.type === 'image'
                ? '请输入图片URL地址'
                : '请输入文件URL地址'
            "
          />

          <!-- 文件上传 -->
          <NUpload
            v-else-if="formData.format === 'base64'"
            :custom-request="handleFileUpload"
            :show-file-list="false"
            accept="*/*"
          >
            <NUploadDragger style="min-height: 160px">
              <div style="margin-bottom: 12px">
                <NIcon size="48" :depth="3"> 📁 </NIcon>
              </div>
              <NText style="font-size: 16px">
                {{ $t('question.page.content.clickOrDrag') }}
              </NText>
              <NP depth="3" style="margin: 8px 0 0 0">
                {{ $t('question.page.content.supportFormats') }}
              </NP>
              <div v-if="formData.uploadedFile" class="mt-3 text-green-600">
                已选择：{{ formData.uploadedFile.name }}
              </div>
            </NUploadDragger>
          </NUpload>
        </NFormItem>

        <!-- 文件名编辑 -->
        <NFormItem v-if="formData.type !== 'text'" label="显示名称">
          <NInput
            v-model:value="formData.attributes.filename"
            placeholder="请输入显示名称"
          />
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton @click="handleClose">
            {{ $t('common.action.cancel') }}
          </NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">
            {{ submitButtonText }}
          </NButton>
        </div>
      </template>
    </NCard>
  </NModal>
</template>
