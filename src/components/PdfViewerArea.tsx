'use client';

import { useAppStore } from '@/store/useAppStore';
import {
  PdfLoader,
  PdfHighlighter,
  Highlight,
  Popup,
  AreaHighlight,
} from 'react-pdf-highlighter';
import { useState, useRef, useEffect } from 'react';
import type { IHighlight, NewHighlight } from 'react-pdf-highlighter';

// We need to polyfill Promise.withResolvers for pdfjs-dist
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  } as any;
}

// Mock highlights for testing
const testHighlights: Record<string, Array<IHighlight>> = {};

const resetHash = () => {
  if (typeof window !== 'undefined') {
    window.location.hash = '';
  }
};

export default function PdfViewerArea() {
  const currentPdf = useAppStore((state) => state.currentPdf);
  const addBookmark = useAppStore((state) => state.addBookmark);
  const addAiHistoryItem = useAppStore((state) => state.addAiHistoryItem);

  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const scrollViewerTo = useRef<((highlight: IHighlight) => void) | null>(null);

  useEffect(() => {
    if (currentPdf) {
      setHighlights(testHighlights[currentPdf.id] || []);
    } else {
      setHighlights([]);
    }
  }, [currentPdf]);

  // Listen for scroll events from the Sidebar
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const customEvent = e as CustomEvent;
      const node = customEvent.detail;
      if (node && node.boundingRect && scrollViewerTo.current) {
        scrollViewerTo.current(node as unknown as IHighlight);
      }
    };
    window.addEventListener('scrollToBookmark', handleScroll);
    return () => window.removeEventListener('scrollToBookmark', handleScroll);
  }, []);

  const addHighlight = (highlight: NewHighlight) => {
    console.log('Saving highlight', highlight);
    setHighlights((prev) => [{ ...highlight, id: String(Date.now()) }, ...prev]);
  };

  const updateHighlight = (
    highlightId: string,
    position: object,
    content: object
  ) => {
    console.log('Updating highlight', highlightId, position, content);
    setHighlights((prev) =>
      prev.map((h) => {
        return h.id === highlightId
          ? {
              ...h,
              position: { ...h.position, ...position },
              content: { ...h.content, ...content },
            }
          : h;
      })
    );
  };

  if (!currentPdf || !currentPdf.url) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 h-full">
        <div className="text-center">
          <p className="text-xl mb-2">No PDF Selected</p>
          <p className="text-sm">Upload a PDF and select it from the sidebar to start studying.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full relative">
      <PdfLoader 
        url={currentPdf.url} 
        beforeLoad={<div className="p-4">Loading PDF...</div>}
      >
        {(pdfDocument) => (
          <PdfHighlighter
            pdfDocument={pdfDocument}
            enableAreaSelection={(event) => event.altKey}
            onScrollChange={resetHash}
            scrollRef={(scrollTo) => {
              scrollViewerTo.current = scrollTo;
            }}
            onSelectionFinished={(
              position,
              content,
              hideTipAndSelection,
              transformSelection
            ) => (
              <CustomTip
                onOpen={transformSelection}
                onConfirm={(action, comment) => {
                  const newHighlight = { position, content, comment: comment ? { text: comment, emoji: "" } : { text: "", emoji: "" } };
                  addHighlight(newHighlight);
                  
                  if (currentPdf) {
                    if (action === 'bookmark') {
                      addBookmark(
                        currentPdf.id, 
                        content.text ? content.text.substring(0, 20) + '...' : 'Area Highlight', 
                        position.pageNumber, 
                        position
                      );
                    } else if (['summary', 'question_hard', 'question_review', 'question_tricky', 'flashcards'].includes(action)) {
                      addAiHistoryItem({
                        type: action as any,
                        highlightedText: content.text || 'Area Highlight',
                        response: `Generating ${action}... (Mock AI Response for: "${content.text?.substring(0,30)}...")`,
                      });
                    }
                  }
                  hideTipAndSelection();
                }}
              />
            )}
            highlightTransform={(
              highlight,
              index,
              setTip,
              hideTip,
              viewportToScaled,
              screenshot,
              isScrolledTo
            ) => {
              const isTextHighlight = !Boolean(
                highlight.content && highlight.content.image
              );

              const component = isTextHighlight ? (
                <Highlight
                  isScrolledTo={isScrolledTo}
                  position={highlight.position}
                  comment={highlight.comment}
                />
              ) : (
                <AreaHighlight
                  isScrolledTo={isScrolledTo}
                  highlight={highlight}
                  onChange={(boundingRect) => {
                    updateHighlight(
                      highlight.id,
                      { boundingRect: viewportToScaled(boundingRect) },
                      { image: screenshot(boundingRect) }
                    );
                  }}
                />
              );

              return (
                <Popup
                  popupContent={<div className="bg-white p-2 rounded shadow text-sm">Highlight</div>}
                  onMouseOver={(popupContent) =>
                    setTip(highlight, (highlight) => popupContent)
                  }
                  onMouseOut={hideTip}
                  key={index}
                  children={component}
                />
              );
            }}
            highlights={highlights}
          />
        )}
      </PdfLoader>
    </div>
  );
}

// A custom tip component for the highlighter popup
function CustomTip({
  onOpen,
  onConfirm,
}: {
  onOpen: () => void;
  onConfirm: (action: string, comment?: string) => void;
}) {
  return (
    <div className="bg-white rounded-md shadow-lg border p-1 flex gap-1 z-50">
      <button
        onClick={() => onConfirm('bookmark')}
        className="px-3 py-1.5 text-sm hover:bg-gray-100 rounded text-gray-700"
      >
        Bookmark
      </button>
      <button
        onClick={() => onConfirm('summary')}
        className="px-3 py-1.5 text-sm hover:bg-blue-50 rounded text-blue-700"
      >
        Summarize
      </button>
      <div className="relative group">
        <button
          className="px-3 py-1.5 text-sm hover:bg-green-50 rounded text-green-700"
        >
          Practice Q
        </button>
        <div className="absolute hidden group-hover:block bottom-full mb-1 left-0 bg-white border rounded shadow-lg w-32 z-50">
          <button
            onClick={() => onConfirm('question_hard')}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 text-gray-700"
          >
            Hard
          </button>
          <button
            onClick={() => onConfirm('question_review')}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 text-gray-700"
          >
            Review
          </button>
          <button
            onClick={() => onConfirm('question_tricky')}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 text-gray-700"
          >
            Tricky
          </button>
        </div>
      </div>
      <button
        onClick={() => onConfirm('flashcards')}
        className="px-3 py-1.5 text-sm hover:bg-purple-50 rounded text-purple-700"
      >
        Flashcards
      </button>
    </div>
  );
}