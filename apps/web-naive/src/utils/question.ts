import type { ContentItem } from '#/api/questions';

import { $t } from '#/locales';

export const getQuestionContentsPreview = (contents: ContentItem[]) => {
  if (contents && contents.length > 0) {
    let preview = '';
    for (const content of contents) {
      if (content.type === 'text') {
        preview += content.content;
      }
      if (preview.length > 100) {
        return `${preview.slice(0, 100)}...`;
      }
    }
    return preview;
  }
  return $t('question.message.noPreview');
};
