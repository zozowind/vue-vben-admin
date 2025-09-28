import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:test-tube',
      order: 1,
      title: $t('page.test.title'),
    },
    name: 'Test',
    path: '/test',
    children: [
      {
        name: 'ContentRendererTest',
        path: '/test/content-renderer',
        component: () => import('#/views/test/content-renderer-test.vue'),
        meta: {
          icon: 'lucide:type',
          title: $t('page.test.contentRenderer'),
          order: 98,
        },
      },
      {
        name: 'LatexTest',
        path: '/test/latex',
        component: () => import('#/views/test/test-latex.vue'),
        meta: {
          icon: 'lucide:sigma',
          title: $t('page.test.latex'),
          order: 99,
        },
      },
      {
        name: 'PdfExportTest',
        path: '/test/pdf-export',
        component: () => import('#/views/test/pdf-export-test.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: $t('page.test.pdfExport'),
          order: 100,
        },
      },
      {
        name: 'CanvasDebug',
        path: '/test/canvas-debug',
        component: () => import('#/views/test/canvas-debug.vue'),
        meta: {
          icon: 'lucide:bug',
          title: $t('page.test.canvasDebug'),
          order: 101,
        },
      },
    ],
  },
];

export default routes;
