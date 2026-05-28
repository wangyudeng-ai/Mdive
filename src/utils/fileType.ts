import { FileType } from '../types';

const MARKDOWN_EXTENSIONS = new Set([
  'md', 'markdown', 'mdown', 'mkd', 'mdx',
]);

const IMAGE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif', 'avif',
]);

const PDF_EXTENSIONS = new Set(['pdf']);

export function getFileType(path: string): FileType {
  const lower = path.toLowerCase();
  const dotIndex = lower.lastIndexOf('.');
  if (dotIndex === -1) return 'unsupported';

  const ext = lower.slice(dotIndex + 1);

  if (MARKDOWN_EXTENSIONS.has(ext)) return 'markdown';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (PDF_EXTENSIONS.has(ext)) return 'pdf';
  return 'unsupported';
}
