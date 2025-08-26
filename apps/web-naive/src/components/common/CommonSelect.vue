<script lang="ts" setup>
import type { SelectOption } from 'naive-ui';

import { NSelect } from 'naive-ui';

import { $t } from '#/locales';

interface Props {
  clearable?: boolean;
  options: SelectOption[];
  placeholder?: string;
  handleUpdate?: (value: null | string) => void;
}

const props = defineProps<Props>();

const placeholder = computed(() => {
  return props.placeholder
    ? $t(props.placeholder)
    : $t('common.placeholder.select');
});

// 使用 defineModel 处理 v-model
const modelValue = defineModel<string>();
</script>

<template>
  <NSelect
    v-model:value="modelValue"
    :options="options"
    :placeholder="placeholder"
    :clearable="clearable"
    @update:value="handleUpdate"
  />
</template>
