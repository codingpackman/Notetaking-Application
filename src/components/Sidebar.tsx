'use client';

import { useAppStore } from '@/store/useAppStore';
import { FileNode } from '@/types';
import { Upload, Folder, File, Bookmark, ChevronRight, ChevronDown } from 'lucide-react';
import { useState, useRef } from 'react';
import { clsx } from 'clsx';

export default function Sidebar() {
  const fileTree = useAppStore((state) => state.fileTree);
  const addPdf = useAppStore((state) => state.addPdf);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.type === 'application/pdf') {
          addPdf(file);
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/80 border-r border-slate-200/80 backdrop-blur-sm">
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 flex justify-between items-center bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
            <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
          </div>
          <h2 className="font-bold text-base sm:text-lg lg:text-xl xl:text-2xl tracking-tight text-white">My Files</h2>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg transition-all shadow-sm text-xs sm:text-sm font-medium"
          title="Upload PDF"
        >
          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Upload</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="application/pdf"
          multiple
          onChange={handleFileUpload}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {fileTree.map((node) => (
          <TreeNode key={node.id} node={node} level={0} />
        ))}
      </div>
    </div>
  );
}

function TreeNode({ node, level }: { node: FileNode; level: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const setCurrentPdf = useAppStore((state) => state.setCurrentPdf);
  const currentPdf = useAppStore((state) => state.currentPdf);

  const isFolder = node.type === 'folder';
  const isPdf = node.type === 'pdf';
  const isBookmark = node.type === 'bookmark';

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else if (isPdf) {
      setIsOpen(!isOpen);
      setCurrentPdf(node);
    } else if (isBookmark) {
      // Find the parent PDF and set it
      // Also, we need a way to tell the PDF viewer to scroll to this bookmark
      const fileTree = useAppStore.getState().fileTree;
      
      const findPdf = (nodes: FileNode[], pdfId: string): FileNode | null => {
        for(const n of nodes) {
           if(n.id === pdfId) return n;
           if(n.children) {
             const found = findPdf(n.children, pdfId);
             if(found) return found;
           }
        }
        return null;
      };

      if (node.pdfId) {
        const parentPdf = findPdf(fileTree, node.pdfId);
        if (parentPdf) {
          setCurrentPdf(parentPdf);
          // Dispatch a custom event to tell the PDF viewer to scroll
          window.dispatchEvent(new CustomEvent('scrollToBookmark', { detail: node }));
        }
      }
    }
  };

  return (
    <div className="group/tree">
      <div
        className={clsx(
          "flex items-center py-2 px-2.5 my-0.5 rounded-lg transition-all cursor-pointer text-sm sm:text-base lg:text-lg xl:text-xl font-medium select-none border border-transparent",
          isPdf && currentPdf?.id === node.id
            ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-200/50"
            : "text-slate-700 hover:bg-white hover:border-slate-200/80 hover:shadow-xs"
        )}
        style={{ paddingLeft: `${level * 16 + 10}px` }}
        onClick={handleClick}
      >
        <div className="w-5 h-5 flex items-center justify-center mr-1 shrink-0">
          {(isFolder || isPdf) && node.children && node.children.length > 0 ? (
            isOpen ? (
              <ChevronDown className={clsx("w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5", isPdf && currentPdf?.id === node.id ? "text-indigo-200" : "text-slate-400")} />
            ) : (
              <ChevronRight className={clsx("w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5", isPdf && currentPdf?.id === node.id ? "text-indigo-200" : "text-slate-400")} />
            )
          ) : (
             <div className="w-4" />
          )}
        </div>
        
        {isFolder && <Folder className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-indigo-500 mr-2 shrink-0" />}
        {isPdf && <File className={clsx("w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 shrink-0", currentPdf?.id === node.id ? "text-indigo-200" : "text-rose-500")} />}
        {isBookmark && <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-amber-500 mr-2 shrink-0 fill-amber-400/20" />}
        
        <span className="truncate flex-1">{node.name}</span>
      </div>

      {isOpen && node.children && node.children.length > 0 && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}