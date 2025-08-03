<script lang="ts" setup>
import { NTag } from 'naive-ui';

import { $t } from '#/locales';

interface Props {
  subject: string;
}

defineProps<Props>();
</script>

<template>
  <NTag type="info">
    {{ $t(`question.options.subjects.${subject}`) }}
  </NTag>
</template>
