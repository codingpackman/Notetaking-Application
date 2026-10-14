export type FileType = 'folder' | 'pdf' | 'bookmark';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  children?: FileNode[]; // For folders
  url?: string; // For PDFs (Blob URL)
  pdfId?: string; // For bookmarks to link to a PDF
  pageNumber?: number; // For bookmarks
  boundingRect?: unknown; // For scrolling to the highlight
}

export type AiActionType = 'summary' | 'question_hard' | 'question_review' | 'question_tricky' | 'flashcards' | 'chat';

export interface AiHistoryItem {
  id: string;
  type: AiActionType;
  highlightedText: string;
  response: string;
  timestamp: number;
}
