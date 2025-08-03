<script lang="ts" setup>
import { $t } from '#/locales';

interface Props {
  grade: number;
}

defineProps<Props>();
</script>

<template>
  <NTag type="info">
    {{ $t('question.options.grades.grade', { grade }) }}
  </NTag>
</template>
