'use client';

import Sidebar from '@/components/Sidebar';
import PdfViewerArea from '@/components/PdfViewerArea';
import AiPanel from '@/components/AiPanel';

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      {/* Left Column: Files & Bookmarks */}
      <div className="w-64 border-r bg-white flex flex-col shrink-0">
        <Sidebar />
      </div>

      {/* Center Column: PDF Viewer */}
      <div className="flex-1 flex flex-col bg-gray-100 min-w-0">
        <PdfViewerArea />
      </div>

      {/* Right Column: AI Explanation & History */}
      <div className="w-80 border-l bg-white flex flex-col shrink-0">
        <AiPanel />
      </div>
    </div>
  );
}
