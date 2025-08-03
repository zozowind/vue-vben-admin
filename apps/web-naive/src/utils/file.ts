/**
 * 将文件转换为base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = reader.result;
      if (typeof result === 'string') {
        // 移除 data:mime/type;base64, 前缀，只保留base64字符串
        const parts = result.split(',');
        if (parts.length > 1 && parts[1]) {
          const base64 = parts[1];
          resolve(base64);
        } else {
          reject(new Error('Invalid data URL format'));
        }
      } else {
        reject(new Error('Failed to read file as string'));
      }
    });
    reader.addEventListener('error', () => {
      reject(new Error('File reading failed'));
    });
    reader.readAsDataURL(file);
  });
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.slice(Math.max(0, lastDotIndex));
}

/**
 * 根据MIME类型获取文件扩展名
 */
export function getExtensionByMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      '.xlsx',
    'text/plain': '.txt',
    'text/html': '.html',
    'application/json': '.json',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
  };

  return mimeToExt[mimeType] || '.bin';
}

/**
 * 检测文件MIME类型
 */
export function detectMimeType(file: File): string {
  // 优先使用文件自带的type
  if (file.type) {
    return file.type;
  }

  // 根据文件扩展名推断
  const ext = getFileExtension(file.name).toLowerCase();
  const extToMime: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
  };

  return extToMime[ext] || 'application/octet-stream';
}

/**
 * 创建ContentItem
 */
export interface CreateContentItemOptions {
  file: File;
  base64Content: string;
}

export function createContentItem({
  file,
  base64Content,
}: CreateContentItemOptions) {
  const mimeType = detectMimeType(file);
  const ext = getFileExtension(file.name) || getExtensionByMimeType(mimeType);

  // 判断文件类型
  const isImage = mimeType.startsWith('image/');
  const type: 'file' | 'image' = isImage ? 'image' : 'file';

  return {
    type,
    content: base64Content,
    format: 'base64' as const,
    attributes: {
      filename: file.name,
      mime_type: mimeType,
      ext,
      size: file.size.toString(),
    },
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
