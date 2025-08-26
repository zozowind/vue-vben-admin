import { computed } from 'vue';

import {
  getQuestionSetStatusOptions,
  getQuestionSetTypeOptions,
} from '#/config/options';

export function useQuestionSetOptions() {
  return {
    questionSetTypeOptions: computed(() => getQuestionSetTypeOptions()),
  };
}

export function useQuestionSetStatusOptions() {
  return {
    questionSetStatusOptions: computed(() => getQuestionSetStatusOptions()),
  };
}
