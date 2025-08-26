<script lang="ts" setup>
import type { ContentItem, QuestionEditRequest } from '#/api/questions';

import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  NButton,
  NCard,
  NCheckbox,
  NDivider,
  NDynamicTags,
  NForm,
  NFormItem,
  NSpace,
  useMessage,
} from 'naive-ui';

import { getQuestion, updateQuestion } from '#/api/questions';
import ContentsEdit from '#/components/question/QuestionContentsEdit.vue';
import QuestionDifficultyFormSelect from '#/components/question/QuestionDifficultyFormSelect.vue';
import QuestionGradeFormSelect from '#/components/question/QuestionGradeFormSelect.vue';
import QuestionSubjectFormSelect from '#/components/question/QuestionSubjectFormSelect.vue';
import QuestionTypeFormSelect from '#/components/question/QuestionTypeFormSelect.vue';
import { useQuestionOptions } from '#/composables/useQuestionOptions';
import { $t } from '#/locales';
import { gradeValidator } from '#/utils/validators';

defineOptions({
  name: 'QuestionEdit',
});

const route = useRoute();
const router = useRouter();
const message = useMessage();

const questionId = route.params.id as string;

// 用于跟踪是否是初始加载
const isInitialLoad = ref(true);
const originalContents = ref<ContentItem[]>([]);
const autoChecked = ref(false); // 标记是否自动勾选过

// 表单数据
const formRef = ref();
const loading = ref(false);
const fetchLoading = ref(false);
const formData = reactive<QuestionEditRequest>({
  question_type: '',
  contents: [],
  subject: '',
  difficulty: '',
  grade: undefined, // 初始化为undefined，强制用户选择
  knowledge_points: [],
  answer: '',
  solution_steps: [],
  explanation: '',
  status: '',
  reanalysis: false,
  reembedding: false,
});

// 选项配置
const { subjectOptions, questionTypeOptions, difficultyOptions, gradeOptions } =
  useQuestionOptions();

// 获取题目详情
async function fetchQuestionDetail() {
  try {
    fetchLoading.value = true;
    const result = await getQuestion(questionId);

    // 保存原始内容用于比较
    originalContents.value = structuredClone(result.contents || []);

    // 填充表单数据
    Object.assign(formData, {
      question_type: result.question_type || '',
      contents: result.contents || [], // 保留原有内容
      subject: result.subject || '',
      difficulty: result.difficulty || '',
      grade: result.grade || undefined, // 如果没有年级，使用undefined而不是默认值
      knowledge_points: result.knowledge_points || [],
      answer: result.analysis?.answer || '',
      solution_steps: result.analysis?.solution_steps || [],
      explanation: result.analysis?.explanation || '',
      status: result.status || '',
      // 保持reanalysis和reembedding的初始值
      reanalysis: false,
      reembedding: false,
    });

    // 标记初始加载完成
    setTimeout(() => {
      isInitialLoad.value = false;
    }, 100);
  } catch (error) {
    message.error($t('question.message.fetchFailed'));
    console.error('Failed to fetch question detail:', error);
  } finally {
    fetchLoading.value = false;
  }
}

// 表单验证规则
const rules = {
  question_type: {
    required: true,
    message: $t('question.placeholder.questionType'),
    trigger: ['blur', 'change'],
  },
  subject: {
    required: true,
    message: $t('question.placeholder.subject'),
    trigger: ['blur', 'change'],
  },
  grade: {
    required: true,
    message: $t('question.placeholder.grade'),
    trigger: ['blur', 'change'],
    validator: gradeValidator,
  },
};

// 处理内容更新
function handleContentsUpdate(newContents: ContentItem[]) {
  formData.contents = newContents;
}

// 检查内容是否发生变化
function hasContentsChanged(): boolean {
  if (isInitialLoad.value) return false;

  const current = formData.contents || [];
  const original = originalContents.value || [];

  // 比较数组长度
  if (current.length !== original.length) {
    return true;
  }

  // 深度比较每个内容项
  for (const [index, currentItem] of current.entries()) {
    const originalItem = original[index];
    if (!currentItem || !originalItem) continue;

    if (
      currentItem.type !== originalItem.type ||
      currentItem.content !== originalItem.content ||
      currentItem.format !== originalItem.format ||
      JSON.stringify(currentItem.attributes) !==
        JSON.stringify(originalItem.attributes)
    ) {
      return true;
    }
  }

  return false;
}

// 监听内容变化
watch(
  () => formData.contents,
  () => {
    if (hasContentsChanged() && !autoChecked.value) {
      // 内容发生变化时自动勾选重新处理选项
      formData.reanalysis = true;
      formData.reembedding = true;
      autoChecked.value = true;

      // 显示提示信息
      message.info('检测到内容变化，已自动勾选重新分析和重新嵌入选项', {
        duration: 5000,
      });
    }
  },
  { deep: true },
);

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value?.validate();
    loading.value = true;

    const updateData: QuestionEditRequest = {
      ...formData,
      contents: formData.contents,
    };

    await updateQuestion(questionId, updateData);
    message.success($t('question.message.updateSuccess'));
    router.push('/questions/list');
  } catch (error: any) {
    if (error?.message) {
      message.error(error.message);
    } else {
      message.error($t('question.message.updateFailed'));
    }
    console.error('Failed to update question:', error);
  } finally {
    loading.value = false;
  }
}

// 返回列表
function handleBack() {
  router.push('/questions/list');
}

// 移除不再需要的函数

onMounted(() => {
  fetchQuestionDetail();
});
</script>

<template>
  <div class="p-4">
    <!-- 头部区域 -->
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">
        {{ $t('question.page.title.edit') }}
      </h1>
      <NSpace>
        <NButton @click="handleBack">
          {{ $t('common.action.back') }}
        </NButton>
        <NButton type="primary" @click="handleSubmit" :loading="loading">
          {{ $t('common.action.save') }}
        </NButton>
      </NSpace>
    </div>

    <NCard>
      <NForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="100"
        require-mark-placement="right-hanging"
      >
        <!-- 基本信息 -->
        <NFormItem
          :label="$t('question.property.questionType')"
          path="question_type"
        >
          <QuestionTypeFormSelect
            v-model:model-value="formData.question_type"
            :options="questionTypeOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('question.property.subject')" path="subject">
          <QuestionSubjectFormSelect
            v-model:model-value="formData.subject"
            :options="subjectOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('question.property.grade')" path="grade">
          <QuestionGradeFormSelect
            v-model:model-value="formData.grade"
            :options="gradeOptions"
          />
        </NFormItem>
        <NFormItem
          :label="$t('question.property.difficulty')"
          path="difficulty"
        >
          <QuestionDifficultyFormSelect
            v-model:model-value="formData.difficulty"
            :options="difficultyOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('question.property.knowledgePoints')">
          <NDynamicTags v-model:value="formData.knowledge_points" />
        </NFormItem>

        <!-- 题目内容 -->
        <NFormItem :label="$t('question.page.title.content')">
          <ContentsEdit
            :contents="formData.contents || []"
            :editable="true"
            :show-add-button="true"
            @update:contents="handleContentsUpdate"
          />
        </NFormItem>

        <!-- 高级选项 -->
        <NDivider title-placement="left">
          {{ $t('question.page.title.advancedOptions') }}
        </NDivider>

        <NFormItem :label="$t('question.page.title.reprocessOptions')">
          <NSpace vertical>
            <div>
              <NCheckbox v-model:checked="formData.reanalysis">
                {{ $t('question.page.title.reanalyze') }}
                <span
                  v-if="autoChecked && formData.reanalysis"
                  class="ml-2 text-xs text-blue-600"
                >
                  ({{ $t('question.page.content.auto') }})
                </span>
              </NCheckbox>
              <div class="ml-6 mt-1 text-sm text-gray-500">
                {{ $t('question.page.content.reanalyzeDescription') }}
              </div>
            </div>
            <div>
              <NCheckbox v-model:checked="formData.reembedding">
                {{ $t('question.page.title.reembedding') }}
                <span
                  v-if="autoChecked && formData.reembedding"
                  class="ml-2 text-xs text-blue-600"
                >
                  ({{ $t('question.page.content.auto') }})
                </span>
              </NCheckbox>
              <div class="ml-6 mt-1 text-sm text-gray-500">
                {{ $t('question.page.content.reembeddingDescription') }}
              </div>
            </div>
            <div
              v-if="autoChecked"
              class="mt-2 rounded border border-blue-200 bg-blue-50 p-2"
            >
              <div class="text-sm text-blue-700">
                {{ $t('question.page.content.reprocessDescription') }}
              </div>
            </div>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCard>
  </div>
</template>
