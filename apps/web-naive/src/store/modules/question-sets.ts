import { defineStore } from 'pinia';
import { ref } from 'vue';

import type {
  QuestionSetInfo,
  QuestionSetItemInfo,
  QuestionSetTreeNode,
} from '#/api/question-sets';
import { questionSetApi } from '#/api/question-sets';

export const useQuestionSetsStore = defineStore('question-sets', () => {
  // 状态
  const questionSets = ref<QuestionSetInfo[]>([]);
  const currentQuestionSet = ref<QuestionSetInfo | null>(null);
  const currentQuestionSetItems = ref<QuestionSetItemInfo[]>([]);
  const loading = ref(false);
  const total = ref(0);

  // 选中的题目（用于创建题目集）
  const selectedQuestions = ref<any[]>([]);
  
  // 当前编辑的题目集
  const editingQuestionSet = ref<Partial<QuestionSetInfo> | null>(null);

  // Actions
  const fetchQuestionSets = async (params?: {
    parent_id?: string;
    status?: string;
    set_type?: string;
    keyword?: string;
    page?: number;
    page_size?: number;
  }) => {
    loading.value = true;
    try {
      const response = await questionSetApi.getQuestionSetList(params);
      questionSets.value = response.items;
      total.value = response.total;
      return response;
    } catch (error) {
      console.error('Failed to fetch question sets:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchQuestionSet = async (id: string) => {
    loading.value = true;
    try {
      const response = await questionSetApi.getQuestionSet(id);
      currentQuestionSet.value = response;
      return response;
    } catch (error) {
      console.error('Failed to fetch question set:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createQuestionSet = async (data: {
    name: string;
    description?: string;
    set_type: string;
    settings?: Record<string, any>;
    parent_set_id?: string;
  }) => {
    loading.value = true;
    try {
      const response = await questionSetApi.createQuestionSet(data);
      // 添加到本地列表
      questionSets.value.unshift(response);
      return response;
    } catch (error) {
      console.error('Failed to create question set:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateQuestionSet = async (id: string, data: {
    name: string;
    description?: string;
    set_type: string;
    settings?: Record<string, any>;
    parent_set_id?: string;
    status: string;
  }) => {
    loading.value = true;
    try {
      const response = await questionSetApi.updateQuestionSet(id, data);
      // 更新本地列表
      const index = questionSets.value.findIndex(item => item.id === id);
      if (index !== -1) {
        questionSets.value[index] = response;
      }
      if (currentQuestionSet.value?.id === id) {
        currentQuestionSet.value = response;
      }
      return response;
    } catch (error) {
      console.error('Failed to update question set:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteQuestionSet = async (id: string) => {
    loading.value = true;
    try {
      await questionSetApi.deleteQuestionSet(id);
      // 从本地列表删除
      const index = questionSets.value.findIndex(item => item.id === id);
      if (index !== -1) {
        questionSets.value.splice(index, 1);
      }
      if (currentQuestionSet.value?.id === id) {
        currentQuestionSet.value = null;
      }
    } catch (error) {
      console.error('Failed to delete question set:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchQuestionSetTree = async (id: string): Promise<QuestionSetTreeNode> => {
    loading.value = true;
    try {
      const response = await questionSetApi.getQuestionSetTree(id);
      return response;
    } catch (error) {
      console.error('Failed to fetch question set tree:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchQuestionSetItems = async (id: string, params?: { page?: number; page_size?: number }) => {
    loading.value = true;
    try {
      const response = await questionSetApi.getQuestionSetQuestions(id, params);
      currentQuestionSetItems.value = response.items;
      return response;
    } catch (error) {
      console.error('Failed to fetch question set items:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const addQuestionToSet = async (setId: string, questionId: string, sortOrder?: number) => {
    try {
      const response = await questionSetApi.addQuestionToSet(setId, {
        question_id: questionId,
        sort_order: sortOrder,
      });
      // 添加到本地列表
      currentQuestionSetItems.value.push(response);
      return response;
    } catch (error) {
      console.error('Failed to add question to set:', error);
      throw error;
    }
  };

  const removeQuestionFromSet = async (setId: string, questionId: string) => {
    try {
      await questionSetApi.removeQuestionFromSet(setId, questionId);
      // 从本地列表删除
      const index = currentQuestionSetItems.value.findIndex(item => item.question_id === questionId);
      if (index !== -1) {
        currentQuestionSetItems.value.splice(index, 1);
      }
    } catch (error) {
      console.error('Failed to remove question from set:', error);
      throw error;
    }
  };

  const updateQuestionOrder = async (setId: string, items: QuestionSetItemInfo[]) => {
    try {
      await questionSetApi.updateQuestionOrder(setId, { items });
      // 更新本地顺序
      currentQuestionSetItems.value = items;
    } catch (error) {
      console.error('Failed to update question order:', error);
      throw error;
    }
  };

  // 选择题目相关方法
  const addSelectedQuestion = (question: any) => {
    const exists = selectedQuestions.value.find(q => q.id === question.id);
    if (!exists) {
      selectedQuestions.value.push(question);
    }
  };

  const removeSelectedQuestion = (questionId: string) => {
    const index = selectedQuestions.value.findIndex(q => q.id === questionId);
    if (index !== -1) {
      selectedQuestions.value.splice(index, 1);
    }
  };

  const clearSelectedQuestions = () => {
    selectedQuestions.value = [];
  };

  const toggleQuestionSelection = (question: any) => {
    const exists = selectedQuestions.value.find(q => q.id === question.id);
    if (exists) {
      removeSelectedQuestion(question.id);
    } else {
      addSelectedQuestion(question);
    }
  };

  // 编辑题目集相关方法
  const setEditingQuestionSet = (questionSet: Partial<QuestionSetInfo> | null) => {
    editingQuestionSet.value = questionSet;
  };

  const clearCurrentData = () => {
    currentQuestionSet.value = null;
    currentQuestionSetItems.value = [];
  };

  return {
    // 状态
    questionSets,
    currentQuestionSet,
    currentQuestionSetItems,
    loading,
    total,
    selectedQuestions,
    editingQuestionSet,

    // Actions
    fetchQuestionSets,
    fetchQuestionSet,
    createQuestionSet,
    updateQuestionSet,
    deleteQuestionSet,
    fetchQuestionSetTree,
    fetchQuestionSetItems,
    addQuestionToSet,
    removeQuestionFromSet,
    updateQuestionOrder,

    // 选择题目相关
    addSelectedQuestion,
    removeSelectedQuestion,
    clearSelectedQuestions,
    toggleQuestionSelection,

    // 编辑相关
    setEditingQuestionSet,
    clearCurrentData,
  };
});
