<script lang="ts" setup>
import type { SelectOption } from 'naive-ui';

import { NFormItem, NSelect } from 'naive-ui';

import { $t } from '#/locales';

interface Props {
  clearable?: boolean;
  options: SelectOption[];
}

defineProps<Props>();

// 使用 defineModel 处理 v-model
const modelValue = defineModel<string>();
</script>

<template>
  <NFormItem :label="$t('question.property.difficulty')" path="difficulty">
    <NSelect
      v-model:value="modelValue"
      :options="options"
      :placeholder="$t('question.placeholder.difficulty')"
      :clearable="clearable"
    />
  </NFormItem>
</template>
