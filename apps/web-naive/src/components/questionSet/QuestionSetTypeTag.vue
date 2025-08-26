<script lang="ts" setup>
import { NTag } from 'naive-ui';

import { $t } from '#/locales';

interface Props {
  type: string;
}

defineProps<Props>();
</script>

<template>
  <NTag type="info">
    {{ $t(`question_set.options.types.${type}`) }}
  </NTag>
</template>
