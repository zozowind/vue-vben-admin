import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: 1,
      title: $t('page.questions.title'),
    },
    name: 'Questions',
    path: '/questions',
    children: [
      {
        name: 'QuestionList',
        path: '/questions/list',
        component: () => import('#/views/questions/list/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: $t('question.page.title.list'),
        },
      },
      {
        name: 'QuestionImport',
        path: '/questions/import',
        component: () => import('#/views/questions/import/index.vue'),
        meta: {
          icon: 'lucide:upload',
          title: $t('question.page.title.import'),
        },
      },
      {
        name: 'QuestionEdit',
        path: '/questions/:id/edit',
        component: () => import('#/views/questions/edit/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:edit',
          title: $t('question.page.title.edit'),
        },
      },
      {
        name: 'QuestionDetail',
        path: '/questions/:id/detail',
        component: () => import('#/views/questions/detail/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:eye',
          title: $t('question.page.title.detail'),
        },
      },
      {
        name: 'TestLaTeX',
        path: '/questions/test-latex',
        component: () => import('#/views/test-latex.vue'),
        meta: {
          icon: 'lucide:test-tube',
          title: 'LaTeX测试',
        },
      },
    ],
  },
];

export default routes;
