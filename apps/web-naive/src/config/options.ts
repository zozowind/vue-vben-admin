import type { SelectOption } from 'naive-ui';

import { $t } from '#/locales';

// 学科选项
const subjects = [
  'math',
  'chinese',
  'english',
  'physics',
  'chemistry',
  'biology',
  'history',
  'geography',
  'politics',
];

// 题目类型选项
const questionTypes = [
  'single_choice',
  'multiple_choice',
  'fill_blank',
  'essay',
  'true_false',
  'calculation',
  'proof',
];

// 难度选项
const difficulties = ['easy', 'fair', 'medium', 'hard', 'extreme'];

// 年级选项
const grades = Array.from({ length: 12 }, (_, i) => i + 1);

// 查询类型选项
const queryTypes = ['keyword', 'fulltext', 'semantic'];

// 状态选项
const statuses = ['processing', 'completed', 'failed', 'confirming'];

// 学科选项
export const getSubjectOptions = (): SelectOption[] =>
  subjects.map((subject) => ({
    label: $t(`question.options.subjects.${subject}`),
    value: subject,
  }));

// 题目类型选项
export const getQuestionTypeOptions = (): SelectOption[] =>
  questionTypes.map((questionType) => ({
    label: $t(`question.options.questionTypes.${questionType}`),
    value: questionType,
  }));

// 难度选项
export const getDifficultyOptions = (): SelectOption[] =>
  difficulties.map((difficulty) => ({
    label: $t(`question.options.difficulties.${difficulty}`),
    value: difficulty,
  }));

// 年级选项
export const getGradeOptions = (): SelectOption[] =>
  grades.map((grade) => ({
    label: $t('question.options.grades.grade', { grade }),
    value: grade,
  }));

// 查询类型选项
export const getQueryTypeOptions = (): SelectOption[] =>
  queryTypes.map((queryType) => ({
    label: $t(`question.options.queryTypes.${queryType}`),
    value: queryType,
  }));

// 状态选项
export const getStatusOptions = (): SelectOption[] =>
  statuses.map((status) => ({
    label: $t(`question.options.statuses.${status}`),
    value: status,
  }));
