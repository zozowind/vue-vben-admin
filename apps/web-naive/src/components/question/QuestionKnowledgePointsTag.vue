<script lang="ts" setup>
import { NSpace, NTag } from 'naive-ui';

interface Props {
  knowledgePoints: string[];
}

defineProps<Props>();
</script>

<template>
  <NSpace>
    <NTag v-for="point in knowledgePoints" :key="point" type="info">
      {{ point }}
    </NTag>
  </NSpace>
</template>
