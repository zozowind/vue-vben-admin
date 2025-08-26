<script lang="ts" setup>
import { NTag } from 'naive-ui';

import { $t } from '#/locales';

interface Props {
  status: string;
}

defineProps<Props>();

function getStatusType(status: string) {
  switch (status) {
    case 'active': {
      return 'success';
    }
    case 'inactive': {
      return 'warning';
    }
    default: {
      return 'default';
    }
  }
}
</script>

<template>
  <NTag :type="getStatusType(status)">
    {{ $t(`question_set.options.statuses.${status}`) }}
  </NTag>
</template>
