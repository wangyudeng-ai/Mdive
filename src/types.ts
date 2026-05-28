export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  extension: string | null;
}

export type FileType = 'markdown' | 'image' | 'pdf' | 'unsupported';

export interface TabData {
  id: string;
  path: string | null;
  title: string;
  content: string | null;
  saved: boolean;
  fileType: FileType;
}

export interface SearchHit {
  path: string;
  name: string;
  line: number;
  text: string;
}
