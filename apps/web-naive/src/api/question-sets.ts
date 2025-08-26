import { requestClient } from './request';

// 题目集设置类型定义
export interface QuestionSetSettings {
  show_answers?: boolean; // 是否显示答案
  show_analysis?: boolean; // 是否显示解析
  keep_answer_area?: boolean; // 是否留出答题区域
  font_size?: number; // 字体大小（单位：px）
  paper_type?: 'a3' | 'a4' | 'letter'; // 纸张类型
  template?: 'default' | string; // 模板标识
}

// 题目集相关类型定义
export interface QuestionSetInfo {
  id: string;
  name: string;
  description?: string;
  set_type: 'exam' | 'practice';
  settings?: QuestionSetSettings;
  parent_set_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface QuestionSetItemInfo {
  id: number;
  set_id: string;
  question_id: string;
  sort_order: number;
  added_at: string;
}

export interface QuestionSetTreeNode extends QuestionSetInfo {
  children?: QuestionSetTreeNode[];
  items?: QuestionSetItemInfo[];
  questions?: any[];
}

// 请求类型定义
export interface CreateQuestionSetRequest {
  name: string;
  description?: string;
  set_type: 'exam' | 'practice';
  settings?: QuestionSetSettings;
  parent_set_id?: string;
}

export interface UpdateQuestionSetRequest {
  name: string;
  description?: string;
  set_type: 'exam' | 'practice';
  settings?: QuestionSetSettings;
  parent_set_id?: string;
  status: 'active' | 'inactive';
}

export interface QuestionSetListRequest {
  parent_id?: string;
  status?: string;
  set_type?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}

export interface AddQuestionToSetRequest {
  question_id: string;
  sort_order?: number;
}

export interface UpdateQuestionOrderRequest {
  items: QuestionSetItemInfo[];
}

// 响应类型定义
export interface QuestionSetListResponse {
  items: QuestionSetInfo[];
  total: number;
  page: number;
  page_size: number;
}

export interface QuestionSetQuestionsResponse {
  items: QuestionSetItemInfo[];
  total: number;
  page: number;
  page_size: number;
}

// API接口
export const questionSetApi = {
  // 创建题目集
  createQuestionSet: (data: CreateQuestionSetRequest) => {
    return requestClient.post<QuestionSetInfo>('/api/v1/question-sets', data);
  },

  // 获取题目集列表
  getQuestionSetList: (params?: QuestionSetListRequest) => {
    return requestClient.get<QuestionSetListResponse>('/api/v1/question-sets', {
      params,
    });
  },

  // 获取题目集详情
  getQuestionSet: (id: string) => {
    return requestClient.get<QuestionSetInfo>(`/api/v1/question-sets/${id}`);
  },

  // 更新题目集
  updateQuestionSet: (id: string, data: UpdateQuestionSetRequest) => {
    return requestClient.put<QuestionSetInfo>(
      `/api/v1/question-sets/${id}`,
      data,
    );
  },

  // 删除题目集
  deleteQuestionSet: (id: string) => {
    return requestClient.delete(`/api/v1/question-sets/${id}`);
  },

  // 获取题目集树形结构
  getQuestionSetTree: (id: string) => {
    return requestClient.get<QuestionSetTreeNode>(
      `/api/v1/question-sets/${id}/tree`,
    );
  },

  // 获取题目集的题目列表
  getQuestionSetQuestions: (
    id: string,
    params?: { page?: number; page_size?: number },
  ) => {
    return requestClient.get<QuestionSetQuestionsResponse>(
      `/api/v1/question-sets/${id}/questions`,
      {
        params,
      },
    );
  },

  // 添加题目到题目集
  addQuestionToSet: (id: string, data: AddQuestionToSetRequest) => {
    return requestClient.post<QuestionSetItemInfo>(
      `/api/v1/question-sets/${id}/questions`,
      data,
    );
  },

  // 从题目集删除题目
  removeQuestionFromSet: (id: string, questionId: string) => {
    return requestClient.delete(
      `/api/v1/question-sets/${id}/questions/${questionId}`,
    );
  },

  // 更新题目在题目集中的顺序
  updateQuestionOrder: (id: string, data: UpdateQuestionOrderRequest) => {
    return requestClient.put(
      `/api/v1/question-sets/${id}/questions/order`,
      data,
    );
  },
};
