import { requestClient } from './request';

// 基础类型定义
export interface ContentItem {
  type: 'file' | 'image' | 'text';
  content: string;
  format: 'base64' | 'latex' | 'path' | 's3' | 'text' | 'url';
  attributes?: Record<string, any>;
}

export interface AnalysisResult {
  question_type: string;
  subject: string;
  grade: number;
  difficulty: string;
  knowledge_points?: string[];
  answer?: string;
  solution_steps?: string[];
  explanation?: string;
}

export interface QuestionImportRequest {
  question_id: string;
  question_type: string;
  contents: ContentItem[];
  subject: string;
  difficulty?: string;
  grade?: number;
  knowledge_points?: string[];
}

export interface QuestionEditRequest {
  question_type?: string;
  contents?: ContentItem[];
  subject?: string;
  difficulty?: string;
  grade?: number;
  knowledge_points?: string[];
  answer?: string;
  solution_steps?: string[];
  explanation?: string;
  status?: string;
  reanalysis?: boolean;
  reembedding?: boolean;
}

export interface QuestionChangeStatusRequest {
  status: 'completed' | 'confirming'; // 仅支持这两种状态
}

export interface QuestionChangeStatusResponse {
  id: string;
  status: string;
  updated_at: string;
}

export interface QuestionBatchDeleteRequest {
  ids: string[];
}

export interface QuestionBatchDeleteResponse {
  success: string[];
  failed: string[];
}

export interface QuestionImportResponse {
  id: string;
  status: string;
  error_message: string;
  analysis?: AnalysisResult;
  created_at: string;
  updated_at: string;
}

// 题目基本信息
export interface QuestionBasicInfo {
  id: string;
  external_id: string;
  question_type: string;
  subject: string;
  difficulty: string;
  grade: number;
  knowledge_points: string[];
  contents: ContentItem[];
  status: string;
  error_message: string;
  created_at: string;
  updated_at: string;
}

// 题目完整信息
export interface QuestionInfo {
  id: string;
  external_id: string;
  question_type: string;
  subject: string;
  difficulty: string;
  grade: number;
  knowledge_points: string[];
  contents: ContentItem[];
  status: string;
  error_message: string;
  created_at: string;
  updated_at: string;
  analysis?: AnalysisResult;
}

export interface QuestionSearchItem {
  id: string;
  external_id: string;
  question_type: string;
  subject: string;
  difficulty: string;
  grade: number;
  knowledge_points: string[];
  contents: ContentItem[];
  status: string;
  error_message: string;
  created_at: string;
  updated_at: string;
  similarity?: number;
  highlights?: string[];
  score?: number;
}

export interface QuestionSearchRequest {
  subjects?: string[];
  grades?: number[];
  difficulties?: string[];
  question_types?: string[];
  statuses?: string[];
  knowledge_points?: string[];
  query?: string;
  query_type?: 'fulltext' | 'keyword' | 'semantic';
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
  similarity_threshold?: number;
  embedding_model?: string;
}

export interface QuestionSearchResponse {
  questions: QuestionSearchItem[];
  total: number;
  page: number;
  page_size: number;
  query?: string;
  time_taken: string;
}

/**
 * 题目导入
 */
export async function importQuestion(data: QuestionImportRequest) {
  return requestClient.post<QuestionImportResponse>(
    '/api/v1/questions/import',
    data,
  );
}

/**
 * 获取题目详情
 */
export async function getQuestion(id: string) {
  return requestClient.get<QuestionInfo>(`/api/v1/questions/${id}`);
}

/**
 * 搜索题目
 */
export async function searchQuestions(params: QuestionSearchRequest) {
  return requestClient.get<QuestionSearchResponse>('/api/v1/questions/search', {
    params,
  });
}

/**
 * 删除题目
 */
export async function deleteQuestion(id: string) {
  return requestClient.delete(`/api/v1/questions/${id}`);
}

/**
 * 更新题目
 */
export async function updateQuestion(id: string, data: QuestionEditRequest) {
  return requestClient.put<QuestionInfo>(`/api/v1/questions/${id}`, data);
}

/**
 * 批量删除题目
 */
export async function batchDeleteQuestions(data: QuestionBatchDeleteRequest) {
  return requestClient.delete<QuestionBatchDeleteResponse>(
    '/api/v1/questions',
    {
      data,
    },
  );
}

/**
 * 更新题目状态
 */
export async function updateQuestionStatus(
  id: string,
  data: QuestionChangeStatusRequest,
) {
  // 使用POST方法代替PATCH，因为requestClient没有patch方法
  return requestClient.post<QuestionChangeStatusResponse>(
    `/api/v1/questions/${id}/status`,
    data,
  );
}
