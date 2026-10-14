'use client';

import Sidebar from '@/components/Sidebar';
import PdfViewerArea from '@/components/PdfViewerArea';
import AiPanel from '@/components/AiPanel';

import { useState, useRef, useCallback } from 'react';
import { GripVertical, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function Home() {
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(360);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  const startResizingLeft = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isResizingLeft.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isResizingLeft.current) return;
      const newWidth = Math.max(180, Math.min(600, moveEvent.clientX));
      setLeftWidth(newWidth);
    };

    const onPointerUp = () => {
      isResizingLeft.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, []);

  const startResizingRight = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isResizingRight.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isResizingRight.current) return;
      const newWidth = Math.max(220, Math.min(700, window.innerWidth - moveEvent.clientX));
      setRightWidth(newWidth);
    };

    const onPointerUp = () => {
      isResizingRight.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-900 text-gray-900 overflow-hidden font-sans select-none">
      {/* Left Column: Files & Bookmarks */}
      <div
        className="relative bg-white flex flex-col shrink-0 shadow-lg z-20 transition-all duration-150"
        style={{ width: isLeftCollapsed ? 0 : `${leftWidth}px`, overflow: isLeftCollapsed ? 'hidden' : 'visible' }}
      >
        <Sidebar />
      </div>

      {/* Left Resize Handle */}
      <div className="relative z-30 flex items-center justify-center">
        <div
          onPointerDown={startResizingLeft}
          className="w-2 hover:w-3 bg-slate-200 hover:bg-indigo-400 cursor-col-resize h-full transition-all flex items-center justify-center group shadow-sm"
          title="Drag to resize My Files sidebar"
        >
          <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <button
          onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
          className="absolute top-3 left-1 z-40 p-1 bg-white border border-slate-200 shadow-md rounded-r-md text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
          title={isLeftCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isLeftCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Center Column: PDF Viewer */}
      <div className="flex-1 flex flex-col bg-slate-100 min-w-0 shadow-inner relative z-10 overflow-hidden">
        <PdfViewerArea />
      </div>

      {/* Right Resize Handle */}
      <div className="relative z-30 flex items-center justify-center">
        <button
          onClick={() => setIsRightCollapsed(!isRightCollapsed)}
          className="absolute top-3 right-1 z-40 p-1 bg-white border border-slate-200 shadow-md rounded-l-md text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
          title={isRightCollapsed ? "Expand AI Assistant" : "Collapse AI Assistant"}
        >
          {isRightCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
        </button>
        <div
          onPointerDown={startResizingRight}
          className="w-2 hover:w-3 bg-slate-200 hover:bg-indigo-400 cursor-col-resize h-full transition-all flex items-center justify-center group shadow-sm"
          title="Drag to resize AI Assistant sidebar"
        >
          <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Right Column: AI Explanation & History */}
      <div
        className="relative bg-white flex flex-col shrink-0 shadow-lg z-20 transition-all duration-150"
        style={{ width: isRightCollapsed ? 0 : `${rightWidth}px`, overflow: isRightCollapsed ? 'hidden' : 'visible' }}
      >
        <AiPanel />
      </div>
    </div>
  );
}
