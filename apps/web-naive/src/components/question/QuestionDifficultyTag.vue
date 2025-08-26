<script lang="ts" setup>
import { NTag } from 'naive-ui';

import { $t } from '#/locales';

interface Props {
  difficulty: string;
}

defineProps<Props>();

function getDifficultyType(difficulty: string) {
  switch (difficulty) {
    case 'easy':
    case 'fair': {
      return 'success';
    }
    case 'extreme': {
      return 'error';
    }
    case 'hard': {
      return 'warning';
    }
    case 'medium': {
      return 'info';
    }
    default: {
      return 'default';
    }
  }
}
</script>

<template>
  <NTag v-if="difficulty" :type="getDifficultyType(difficulty)">
    {{ $t(`question.options.difficulties.${difficulty}`) }}
  </NTag>
  <NTag v-else type="default">
    {{ $t('question.options.difficulties.unknown') }}
  </NTag>
</template>
