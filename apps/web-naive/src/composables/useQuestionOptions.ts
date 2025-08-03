import { computed } from 'vue';

import {
  getDifficultyOptions,
  getGradeOptions,
  getQueryTypeOptions,
  getQuestionTypeOptions,
  getStatusOptions,
  getSubjectOptions,
} from '#/config/options';

export function useQuestionOptions() {
  return {
    queryTypeOptions: computed(() => getQueryTypeOptions()),
    subjectOptions: computed(() => getSubjectOptions()),
    gradeOptions: computed(() => getGradeOptions()),
    difficultyOptions: computed(() => getDifficultyOptions()),
    questionTypeOptions: computed(() => getQuestionTypeOptions()),
    statusOptions: computed(() => getStatusOptions()),
  };
}
