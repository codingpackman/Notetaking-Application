'use client';

import Sidebar from '@/components/Sidebar';
import PdfViewerArea from '@/components/PdfViewerArea';
import AiPanel from '@/components/AiPanel';

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 overflow-hidden font-sans">
      {/* Left Column: Files & Bookmarks */}
      <div className="w-[20%] min-w-[250px] border-r border-gray-200 bg-white flex flex-col shrink-0 shadow-sm z-10">
        <Sidebar />
      </div>

      {/* Center Column: PDF Viewer */}
      <div className="flex-1 flex flex-col bg-gray-100 min-w-0 shadow-inner">
        <PdfViewerArea />
      </div>

      {/* Right Column: AI Explanation & History */}
      <div className="w-[25%] min-w-[300px] border-l border-gray-200 bg-white flex flex-col shrink-0 shadow-sm z-10">
        <AiPanel />
      </div>
    </div>
  );
}
