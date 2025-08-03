<script lang="ts" setup>
import type { ContentItem, QuestionImportRequest } from '#/api/questions';

import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

// import { CloudUploadOutline } from '@vicons/ionicons5';
import {
  NButton,
  NCard,
  NDynamicTags,
  NForm,
  NFormItem,
  NInput,
  useMessage,
} from 'naive-ui';

import { importQuestion } from '#/api/questions';
import ContentsEdit from '#/components/content/ContentsEdit.vue';
import QuestionDifficultyFormSelect from '#/components/QuestionDifficultyFormSelect.vue';
import QuestionGradeFormSelect from '#/components/QuestionGradeFormSelect.vue';
import QuestionSubjectFormSelect from '#/components/QuestionSubjectFormSelect.vue';
import QuestionTypeFormSelect from '#/components/QuestionTypeFormSelect.vue';
import { useQuestionOptions } from '#/composables/useQuestionOptions';
import { $t } from '#/locales';
import { gradeValidator } from '#/utils/validators';

defineOptions({
  name: 'QuestionImport',
});

const router = useRouter();
const message = useMessage();

// 表单数据
const formRef = ref();
const loading = ref(false);
const formData = reactive<QuestionImportRequest>({
  question_id: '',
  question_type: '',
  contents: [],
  subject: '',
  difficulty: '',
  grade: undefined, // 使用undefined，强制用户选择
  knowledge_points: [],
});

// 选项配置
const { subjectOptions, questionTypeOptions, difficultyOptions, gradeOptions } =
  useQuestionOptions();

// 移除旧的内容管理相关代码

// 表单规则
const rules = {
  question_id: {
    required: true,
    message: $t('question.placeholder.externalQuestionId'),
    trigger: ['blur', 'input'],
  },
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

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value?.validate();
    loading.value = true;

    // 更新内容项
    const updatedContents = [...(formData.contents || [])];

    // 内容已通过 ContentBlockList 管理，无需额外处理

    // 提交数据
    const submitData = {
      ...formData,
      contents: updatedContents,
    };

    const result = await importQuestion(submitData);

    message.success($t('question.message.importSuccess'));

    // 导入成功后跳转到详情页
    router.push(`/questions/${result.id}/detail`);
  } catch (error) {
    console.error('Import failed:', error);
    message.error($t('question.message.importFailed'));
  } finally {
    loading.value = false;
  }
}

// 重置表单
function handleReset() {
  Object.assign(formData, {
    question_id: '',
    question_type: '',
    contents: [],
    subject: '',
    difficulty: '',
    grade: 1,
    knowledge_points: [],
  });
  // 内容通过 ContentBlockList 管理
  message.success($t('common.message.formResetSuccess'));
}

// 返回列表
function handleBack() {
  router.push('/questions/list');
}
</script>

<template>
  <div class="p-4">
    <NCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span>{{ $t('page.questions.import') }}</span>
          <NButton @click="handleBack">
            {{ $t('common.action.backToList') }}
          </NButton>
        </div>
      </template>

      <NForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="120"
        require-mark-placement="right-hanging"
      >
        <!-- 基本信息 -->
        <div class="mb-6">
          <h3 class="mb-4 text-lg font-semibold">
            {{ $t('question.page.title.basicInfo') }}
          </h3>

          <NFormItem
            :label="$t('question.property.externalQuestionId')"
            path="question_id"
          >
            <NInput
              v-model:value="formData.question_id"
              :placeholder="$t('question.placeholder.externalQuestionId')"
            />
          </NFormItem>

          <QuestionTypeFormSelect
            v-model:model-value="formData.question_type"
            :options="questionTypeOptions"
          />

          <QuestionSubjectFormSelect
            v-model:model-value="formData.subject"
            :options="subjectOptions"
          />

          <QuestionGradeFormSelect
            v-model:model-value="formData.grade"
            :options="gradeOptions"
          />

          <QuestionDifficultyFormSelect
            v-model:model-value="formData.difficulty"
            :options="difficultyOptions"
          />

          <NFormItem :label="$t('question.property.knowledgePoints')">
            <NDynamicTags
              v-model:value="formData.knowledge_points"
              :placeholder="$t('question.placeholder.knowledgePoints')"
            />
          </NFormItem>
        </div>

        <!-- 题目内容 -->
        <div class="mb-6">
          <h3 class="mb-4 text-lg font-semibold">
            {{ $t('question.page.title.content') }}
          </h3>

          <!-- 内容块列表 -->
          <ContentsEdit
            :contents="formData.contents"
            :editable="true"
            :show-add-button="true"
            @update:contents="handleContentsUpdate"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-4">
          <NButton @click="handleReset">
            {{ $t('common.action.reset') }}
          </NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">
            {{
              loading
                ? $t('question.message.importing')
                : $t('question.action.import')
            }}
          </NButton>
        </div>
      </NForm>
    </NCard>
  </div>
</template>
