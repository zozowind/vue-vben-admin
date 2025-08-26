import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:book-open',
      order: 2,
      title: $t('page.question-sets.title'),
    },
    name: 'QuestionSets',
    path: '/question-sets',
    children: [
      {
        name: 'QuestionSetsList',
        path: '/question-sets/list',
        component: () => import('#/views/question-sets/list/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: $t('page.question-sets.list'),
        },
      },
      {
        name: 'QuestionSetsCreate',
        path: '/question-sets/create',
        component: () => import('#/views/question-sets/create/index.vue'),
        meta: {
          icon: 'lucide:plus',
          title: $t('page.question-sets.create'),
        },
      },
      {
        name: 'QuestionSetsDetail',
        path: '/question-sets/:id/detail',
        component: () => import('#/views/question-sets/detail/index.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.question-sets.detail'),
        },
      },
      {
        name: 'QuestionSetsEdit',
        path: '/question-sets/:id/edit',
        component: () => import('#/views/question-sets/edit/index.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.question-sets.edit'),
        },
      },
      {
        name: 'QuestionSetsPreview',
        path: '/question-sets/:id/preview',
        component: () => import('#/views/question-sets/preview/index.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.question-sets.preview'),
        },
      },
    ],
  },
];

export default routes;
