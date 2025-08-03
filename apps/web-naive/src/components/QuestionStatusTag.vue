<script lang="ts" setup>
import { NTag } from 'naive-ui';

import { $t } from '#/locales';

interface Props {
  status: string;
}

defineProps<Props>();

function getStatusType(status: string) {
  switch (status) {
    case 'completed': {
      return 'success';
    }
    case 'confirming': {
      return 'warning';
    }
    case 'failed': {
      return 'error';
    }
    case 'processing': {
      return 'info';
    }
    default: {
      return 'default';
    }
  }
}
</script>

<template>
  <NTag :type="getStatusType(status)">
    {{ $t(`question.options.statuses.${status}`) }}
  </NTag>
</template>
