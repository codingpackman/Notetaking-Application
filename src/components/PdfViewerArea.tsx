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
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewerTo = useRef<((highlight: IHighlight) => void) | null>(null);

  useEffect(() => {
    if (currentPdf) {
      setHighlights(testHighlights[currentPdf.id] || []);
      setZoom(1);
    } else {
      setHighlights([]);
    }
  }, [currentPdf]);

  // Trackpad pinch zoom or ctrl + scroll wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY;
        setZoom((prev) => {
          const newZoom = prev - delta * 0.003;
          return Math.min(Math.max(0.6, newZoom), 3.0);
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Listen for scroll events from the Sidebar
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const customEvent = e as CustomEvent;
      const node = customEvent.detail;
      if (node && node.boundingRect && scrollViewerTo.current) {
        const highlightToScroll: IHighlight = {
          id: node.id || String(Date.now()),
          position: node.boundingRect,
          content: { text: node.name || '' },
          comment: { text: '', emoji: '' },
        };
        scrollViewerTo.current(highlightToScroll);
      }
    };
    window.addEventListener('scrollToBookmark', handleScroll);
    return () => window.removeEventListener('scrollToBookmark', handleScroll);
  }, []);

  const addHighlight = (highlight: NewHighlight) => {
    console.log('Saving highlight', highlight);
    // Replace previous highlights to unhighlight the previous box
    setHighlights([{ ...highlight, id: String(Date.now()) }]);
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
    <div ref={containerRef} className="flex-1 h-full relative overflow-auto bg-slate-200/60">
      {/* Floating Zoom Controls Bar */}
      <div className="absolute top-3 right-5 z-40 bg-white/95 backdrop-blur border border-slate-200 shadow-md rounded-full px-3 py-1 flex items-center gap-2 text-xs font-semibold text-slate-700">
        <button
          onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          title="Zoom Out"
        >
          -
        </button>
        <span className="w-12 text-center select-none text-slate-800">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(3.0, Math.round((z + 0.1) * 10) / 10))}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom(1)}
          className="ml-1 px-2 py-0.5 text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
          title="Reset Zoom"
        >
          Reset
        </button>
      </div>

      <div
        className="w-full h-full transition-transform duration-75 origin-top"
        style={{ transform: `scale(${zoom})` }}
      >
      <PdfLoader 
        url={currentPdf.url} 
        beforeLoad={<div className="p-4 text-slate-500 font-medium">Loading PDF...</div>}
      >
        {(pdfDocument) => (
          <PdfHighlighter
            pdfDocument={pdfDocument}
            enableAreaSelection={(event) => true}
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
                content={content}
                onOpen={transformSelection}
                onConfirm={(action, count, bookmarkTitle) => {
                  const newHighlight = { position, content, comment: { text: bookmarkTitle || "", emoji: "" } };
                  addHighlight(newHighlight);
                  
                  if (currentPdf) {
                    const textToProcess = content.text;
                    const imageToProcess = content.image;

                    if (action === 'bookmark') {
                      const finalBookmarkTitle = bookmarkTitle?.trim() || (content.text ? content.text.substring(0, 25) + '...' : 'Bookmark');
                      addBookmark(
                        currentPdf.id, 
                        finalBookmarkTitle,
                        position.pageNumber, 
                        position
                      );
                    } else if (['summary', 'question_hard', 'question_review', 'question_tricky', 'flashcards'].includes(action)) {
                      const tempId = String(Date.now());
                      const countText = count && count > 1 ? ` (${count})` : '';
                      addAiHistoryItem({
                        id: tempId,
                        type: action as any,
                        highlightedText: textToProcess || 'Area Highlight',
                        response: `Generating ${action}${countText}...`,
                      });

                      fetch('/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                           action,
                           text: textToProcess,
                           image: imageToProcess,
                           count: count || 1
                        }),
                      })
                        .then((res) => res.json())
                        .then((data) => {
                          if (data.result) {
                            useAppStore.getState().updateAiHistoryItem(tempId, { response: data.result });
                          } else if (data.error) {
                            useAppStore.getState().updateAiHistoryItem(tempId, { response: `Error: ${data.error}` });
                          }
                        })
                        .catch(() => {
                          useAppStore.getState().updateAiHistoryItem(tempId, { response: `Error: failed to fetch` });
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
    </div>
  );
}

// A custom tip component for the highlighter popup with Bookmark naming and Count Prompt
function CustomTip({
  content,
  onOpen,
  onConfirm,
  onUpdate,
}: {
  content: { text?: string; image?: string };
  onOpen: () => void;
  onConfirm: (action: string, count?: number, bookmarkTitle?: string) => void;
  onUpdate?: () => void;
}) {
  const [mode, setMode] = useState<'menu' | 'count_prompt' | 'bookmark_prompt'>('menu');
  const [selectedAction, setSelectedAction] = useState<string>('flashcards');
  const [countInput, setCountInput] = useState<number>(3);
  const [bookmarkTitle, setBookmarkTitle] = useState<string>(
    content.text ? content.text.substring(0, 30) : 'Bookmark'
  );

  useEffect(() => {
    if (onUpdate) {
      onUpdate();
    }
  }, [onUpdate]);

  if (mode === 'bookmark_prompt') {
    return (
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 w-72 space-y-2.5 animate-in fade-in zoom-in duration-100">
        <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
          <span>Name Bookmark</span>
          <button
            onClick={() => setMode('menu')}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            Cancel
          </button>
        </div>
        <input
          type="text"
          value={bookmarkTitle}
          onChange={(e) => setBookmarkTitle(e.target.value)}
          placeholder="Enter bookmark title..."
          autoFocus
          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onConfirm('bookmark', 1, bookmarkTitle);
            }
          }}
        />
        <button
          onClick={() => onConfirm('bookmark', 1, bookmarkTitle)}
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          Save Bookmark
        </button>
      </div>
    );
  }

  if (mode === 'count_prompt') {
    const actionLabel = selectedAction === 'flashcards' ? 'Flashcards' : 'Practice Questions';
    return (
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 w-72 space-y-3 animate-in fade-in zoom-in duration-100">
        <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
          <span>How many {actionLabel}?</span>
          <button
            onClick={() => setMode('menu')}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            Cancel
          </button>
        </div>

        <div className="flex gap-1.5 justify-between">
          {[1, 3, 5, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setCountInput(num)}
              className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-all ${
                countInput === num
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] text-slate-500 shrink-0">Custom quantity:</label>
          <input
            type="number"
            min={1}
            max={20}
            value={countInput}
            onChange={(e) => setCountInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-16 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={() => onConfirm(selectedAction, countInput)}
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          Generate {countInput} {actionLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-xl border border-slate-200 p-1 flex gap-1 z-50 text-xs font-medium">
      <button
        onClick={() => setMode('bookmark_prompt')}
        className="px-2.5 py-1.5 hover:bg-amber-50 rounded-lg text-amber-700 transition-colors"
      >
        Bookmark
      </button>
      <button
        onClick={() => onConfirm('summary', 1)}
        className="px-2.5 py-1.5 hover:bg-blue-50 rounded-lg text-blue-700 transition-colors"
      >
        Summarize
      </button>
      <div className="relative group">
        <button
          className="px-2.5 py-1.5 hover:bg-emerald-50 rounded-lg text-emerald-700 transition-colors"
        >
          Practice Q
        </button>
        <div className="absolute hidden group-hover:block bottom-full mb-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl w-32 p-1 z-50 space-y-0.5">
          <button
            onClick={() => {
              setSelectedAction('question_hard');
              setMode('count_prompt');
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            Hard
          </button>
          <button
            onClick={() => {
              setSelectedAction('question_review');
              setMode('count_prompt');
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            Review
          </button>
          <button
            onClick={() => {
              setSelectedAction('question_tricky');
              setMode('count_prompt');
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            Tricky
          </button>
        </div>
      </div>
      <button
        onClick={() => {
          setSelectedAction('flashcards');
          setMode('count_prompt');
        }}
        className="px-2.5 py-1.5 hover:bg-purple-50 rounded-lg text-purple-700 transition-colors"
      >
        Flashcards
      </button>
    </div>
  );
}