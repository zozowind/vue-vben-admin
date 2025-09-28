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

// 题目集类型选项
const questionSetTypes = ['practice'];

// 题目集状态选项
const questionSetStatuses = ['active', 'inactive'];

// 导出选项
const questionSetExports = ['pdf', 'image', 'word'];

export interface PaperType {
  name: string;
  width: number;
  height: number;
}

// 纸张类型选项
const paperTypes: PaperType[] = [
  {
    name: 'a4',
    width: 210,
    height: 297,
  },
  {
    name: 'a3',
    width: 297,
    height: 420,
  },
];

interface FontSize {
  name: string;
  size: number;
}

const fontSizes: FontSize[] = [
  {
    name: 'small',
    size: 12,
  },
  {
    name: 'medium',
    size: 16,
  },
  {
    name: 'large',
    size: 20,
  },
];

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

// 题目集类型选项
export const getQuestionSetTypeOptions = (): SelectOption[] =>
  questionSetTypes.map((questionSetType) => ({
    label: $t(`question_set.options.types.${questionSetType}`),
    value: questionSetType,
  }));

// 题目集状态选项
export const getQuestionSetStatusOptions = (): SelectOption[] =>
  questionSetStatuses.map((status) => ({
    label: $t(`question_set.options.statuses.${status}`),
    value: status,
  }));

// 导出选项
export const getQuestionSetExportOptions = (): SelectOption[] =>
  questionSetExports.map((exportOption) => ({
    label: $t(`question_set.options.exports.${exportOption}`),
    key: exportOption,
  }));

// 根据纸张类型名称获取纸张类型
export const getPaperType = (name: string): PaperType => {
  const pt = paperTypes.find((paperType) => paperType.name === name);
  if (!pt) {
    throw new Error(`Paper type ${name} not found`);
  }
  return pt;
};

// 纸张类型选项
export const getPaperTypeOptions = (): SelectOption[] =>
  paperTypes.map((paperType) => ({
    label: $t(`question_set.options.paperTypes.${paperType.name}`),
    value: paperType.name,
  }));

// 字体大小选项
export const getFontSizeOptions = (): SelectOption[] =>
  fontSizes.map((fontSize) => ({
    label: $t(`question_set.options.fontSizes.${fontSize.name}`),
    value: fontSize.size,
  }));
