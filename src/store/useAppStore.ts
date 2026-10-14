import { create } from 'zustand';
import { FileNode, AiHistoryItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  fileTree: FileNode[];
  currentPdf: FileNode | null;
  aiHistory: AiHistoryItem[];
  
  // Actions
  addPdf: (file: File) => void;
  setCurrentPdf: (pdf: FileNode | null) => void;
  addBookmark: (pdfId: string, name: string, pageNumber: number, boundingRect: unknown) => void;
  addAiHistoryItem: (item: Omit<AiHistoryItem, 'id' | 'timestamp'>) => void;
  clearAiHistory: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  fileTree: [
    {
      id: 'root-folder',
      name: 'My PDFs',
      type: 'folder',
      children: [],
    }
  ],
  currentPdf: null,
  aiHistory: [],

  addPdf: (file) => {
    const url = URL.createObjectURL(file);
    const newPdf: FileNode = {
      id: uuidv4(),
      name: file.name,
      type: 'pdf',
      url,
      children: [], // Bookmarks will be children of the PDF
    };

    set((state) => {
      const newTree = [...state.fileTree];
      // Assuming root folder is the first item for simplicity
      if (newTree[0].type === 'folder' && newTree[0].children) {
        newTree[0].children.push(newPdf);
      }
      return { fileTree: newTree, currentPdf: newPdf };
    });
  },

  setCurrentPdf: (pdf) => set({ currentPdf: pdf }),

  addBookmark: (pdfId, name, pageNumber, boundingRect) => {
    const newBookmark: FileNode = {
      id: uuidv4(),
      name,
      type: 'bookmark',
      pdfId,
      pageNumber,
      boundingRect,
    };

    set((state) => {
      const newTree = JSON.parse(JSON.stringify(state.fileTree)); // Deep copy

      // Find the PDF and add the bookmark as a child
      const findAndAdd = (nodes: FileNode[]) => {
        for (const node of nodes) {
          if (node.id === pdfId) {
            if (!node.children) node.children = [];
            node.children.push(newBookmark);
            return true;
          }
          if (node.children) {
            if (findAndAdd(node.children)) return true;
          }
        }
        return false;
      };

      findAndAdd(newTree);
      return { fileTree: newTree };
    });
  },

  addAiHistoryItem: (item) => {
    const newItem: AiHistoryItem = {
      ...item,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    set((state) => ({ aiHistory: [newItem, ...state.aiHistory] }));
  },

  clearAiHistory: () => set({ aiHistory: [] }),
}));
