import type { Component } from 'vue';

import type { QuestionSetSettings } from '#/api/question-sets';

import { $t } from '#/locales';

import DefaultPreviewTemplate from './DefaultPreviewTemplate.vue';

// 通用类型定义
export interface QuestionSetWithSettings {
  id: string;
  name: string;
  description?: string;
  set_type: string;
  settings?: null | QuestionSetSettings;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateDisplayProps {
  showAnswers: boolean;
  showAnalysis: boolean;
  fontSize: number;
  paperType: string;
}

export interface TemplateProps {
  questionSet: QuestionSetWithSettings;
  questions: any[];
  loading: boolean;
  display: TemplateDisplayProps;
}

// 模板类型定义
export interface PreviewTemplate {
  id: string;
  name: string;
  description: string;
  component: Component;
  // thumbnail?: string; // 缩略图URL
  // category?: string; // 模板分类
}

// 可用的预览模板
export const availableTemplates: PreviewTemplate[] = [
  {
    id: 'default',
    name: $t('question_set.templates.default.name'),
    description: $t('question_set.templates.default.description'),
    component: DefaultPreviewTemplate,
  },
  // 未来可以添加更多模板
  // {
  //   id: 'compact',
  //   name: '紧凑模板',
  //   description: '紧凑的题目集预览模板，节省纸张',
  //   component: CompactPreviewTemplate,
  //   category: 'standard',
  // },
  // {
  //   id: 'exam',
  //   name: '考试模板',
  //   description: '专为正式考试设计的模板',
  //   component: ExamPreviewTemplate,
  //   category: 'exam',
  // },
];

// 根据ID获取模板
export const getTemplateById = (id: string): PreviewTemplate | undefined => {
  return availableTemplates.find((template) => template.id === id);
};

// 获取默认模板
export const getDefaultTemplate = (): PreviewTemplate => {
  const defaultTemplate = availableTemplates[0];
  if (!defaultTemplate) {
    throw new Error($t('question_set.message.noDefaultTemplate'));
  }
  return defaultTemplate;
};

// 导出默认模板组件
export { DefaultPreviewTemplate };
