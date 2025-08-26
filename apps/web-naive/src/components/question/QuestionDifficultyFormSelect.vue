<script lang="ts" setup>
import type { SelectOption } from 'naive-ui';

import { NSelect } from 'naive-ui';

import { $t } from '#/locales';

interface Props {
  clearable?: boolean;
  options: SelectOption[];
  style?: Record<string, string> | string;
  handleUpdate?: (value: null | string) => void;
}

defineProps<Props>();

// 使用 defineModel 处理 v-model
const modelValue = defineModel<string>();
</script>

<template>
  <NSelect
    v-model:value="modelValue"
    :options="options"
    :placeholder="$t('question.placeholder.difficulty')"
    :clearable="clearable"
    :style="style"
    @update:value="handleUpdate"
  />
</template>
