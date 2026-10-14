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
    <div className="flex flex-col h-full bg-white border-r">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="font-semibold text-lg">My Files</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
          title="Upload PDF"
        >
          <Upload size={18} />
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

      <div className="flex-1 overflow-y-auto p-2">
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
    <div>
      <div
        className={clsx(
          "flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer rounded-md text-base transition-colors",
          isPdf && currentPdf?.id === node.id && "bg-blue-50 text-blue-700"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        <div className="w-5 flex items-center justify-center mr-1">
          {(isFolder || isPdf) && node.children && node.children.length > 0 ? (
            isOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />
          ) : (
             <div className="w-4" /> // Placeholder to align
          )}
        </div>
        
        {isFolder && <Folder size={16} className="text-blue-500 mr-2 shrink-0" />}
        {isPdf && <File size={16} className="text-red-500 mr-2 shrink-0" />}
        {isBookmark && <Bookmark size={14} className="text-yellow-500 mr-2 shrink-0" />}
        
        <span className="truncate">{node.name}</span>
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