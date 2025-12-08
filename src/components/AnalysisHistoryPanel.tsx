"use client";

import { useState } from "react";
import { AnalysisHistoryItem } from "@/hooks/useAIAnalysis";

interface AnalysisHistoryPanelProps {
  history: AnalysisHistoryItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function AnalysisHistoryPanel({ history, isLoading, onRefresh }: AnalysisHistoryPanelProps) {
  const [selectedItem, setSelectedItem] = useState<AnalysisHistoryItem | null>(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  // Format analysis text with elegant styling (same as AIAnalysisPanel)
  const formatAnalysis = (text: string | undefined): JSX.Element[] => {
    if (!text) {
      return [<p key="no-data" className="text-gray-500 italic">Tidak ada analisis tersedia.</p>];
    }

    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2 my-4">
            {listItems.map((item, idx) => {
              // Process bold text in list items
              const processedItem = item.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
              return (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1 font-bold">•</span>
                  <span className="flex-1" dangerouslySetInnerHTML={{ __html: processedItem }} />
                </li>
              );
            })}
          </ul>
        );
        listItems = [];
      }
    };

    // Helper to process inline markdown (bold, italic)
    const processInlineMarkdown = (text: string): string => {
      let processed = text;
      // Bold text: **text**
      processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
      // Italic text: *text* or _text_
      processed = processed.replace(/\*(.+?)\*/g, '<em class="italic text-gray-800">$1</em>');
      processed = processed.replace(/_(.+?)_/g, '<em class="italic text-gray-800">$1</em>');
      return processed;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        flushList();
        return;
      }

      // Headers - support #### (h4), ### (h3), ## (h2), # (h1)
      if (trimmed.startsWith('#### ')) {
        flushList();
        const text = processInlineMarkdown(trimmed.substring(5));
        elements.push(
          <h4 key={`h4-${index}`} className="text-base font-bold text-gray-800 mt-3 mb-2 flex items-center space-x-2">
            <span className="text-green-500">▸</span>
            <span dangerouslySetInnerHTML={{ __html: text }} />
          </h4>
        );
      } else if (trimmed.startsWith('### ')) {
        flushList();
        const text = processInlineMarkdown(trimmed.substring(4));
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg font-bold text-gray-800 mt-4 mb-2 flex items-center space-x-2">
            <span className="text-blue-500">▸</span>
            <span dangerouslySetInnerHTML={{ __html: text }} />
          </h3>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList();
        const text = processInlineMarkdown(trimmed.substring(3));
        elements.push(
          <h2 key={`h2-${index}`} className="text-xl font-bold text-gray-900 mt-5 mb-3 pb-2 border-b-2 border-green-200">
            <span dangerouslySetInnerHTML={{ __html: text }} />
          </h2>
        );
      } else if (trimmed.startsWith('# ')) {
        flushList();
        const text = processInlineMarkdown(trimmed.substring(2));
        elements.push(
          <h1 key={`h1-${index}`} className="text-2xl font-bold text-green-700 mt-6 mb-4">
            <span dangerouslySetInnerHTML={{ __html: text }} />
          </h1>
        );
      }
      // List items - support both - and • and *
      else if (trimmed.match(/^[-•*]\s/)) {
        const itemText = trimmed.substring(2);
        listItems.push(itemText);
      }
      // Regular paragraph
      else {
        flushList();
        const content = processInlineMarkdown(trimmed);
        
        elements.push(
          <p key={`p-${index}`} className="text-gray-700 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: content }} />
        );
      }
    });

    flushList();
    return elements;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return timestamp;
    }
  };

  const getTrendColor = (tren: string) => {
    if (tren?.toLowerCase().includes('naik')) return 'text-red-600 bg-red-50';
    if (tren?.toLowerCase().includes('turun')) return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getTrendIcon = (tren: string) => {
    if (tren?.toLowerCase().includes('naik')) return '📈';
    if (tren?.toLowerCase().includes('turun')) return '📉';
    return '➡️';
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-full">
        {/* Header - Minimalist White with Green Border */}
        <div className="bg-white border-b-4 border-green-500 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                📚
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Riwayat Analisis</h2>
                <p className="text-sm text-gray-600">History analisis AI yang tersimpan</p>
              </div>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl border-2 border-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
              <span className="font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Content - Flex-1 for equal height */}
        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Memuat riwayat analisis...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 text-lg">Belum ada riwayat analisis</p>
              <p className="text-sm text-gray-500 mt-2">Jalankan analisis pertama untuk melihat riwayat</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group bg-gradient-to-br from-green-50/30 to-white rounded-2xl border-2 border-gray-200 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">
                          🧠
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.timeRange}</p>
                          <p className="text-sm text-gray-500">{formatTimestamp(item.timestamp)}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getTrendColor(item.statistics?.tren || '')}`}>
                        {getTrendIcon(item.statistics?.tren || '')} {item.statistics?.tren || 'N/A'}
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium mb-1">Rata-rata</p>
                        <p className="text-xl font-bold text-blue-700">{item.statistics?.rata_rata || 0}%</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                        <p className="text-xs text-green-600 font-medium mb-1">Maksimum</p>
                        <p className="text-xl font-bold text-green-700">{item.statistics?.maksimum || 0}%</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                        <p className="text-xs text-orange-600 font-medium mb-1">Minimum</p>
                        <p className="text-xl font-bold text-orange-700">{item.statistics?.minimum || 0}%</p>
                      </div>
                    </div>

                    {/* Pump Usage */}
                    <div className="flex items-center justify-between bg-amber-50 rounded-xl p-3 border border-amber-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">⚙️</span>
                        <span className="text-sm text-gray-700">Pompa: <span className="font-bold text-orange-700">{item.pumpUsage?.aktivasi || 0}x</span></span>
                      </div>
                      <span className="text-sm font-bold text-orange-700">{item.pumpUsage?.persentase || 0}%</span>
                    </div>

                    {/* View Detail Button */}
                    <button className="w-full mt-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all group-hover:shadow-md">
                      Lihat Detail Analisis →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-4 " onClick={(e) => e.stopPropagation()}>
            {/* Modal Header - Minimalist White with Green Border */}
            <div className="bg-white border-b-4  px-6 py-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                  🧠
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedItem.timeRange}</h3>
                  <p className="text-sm text-gray-600">{formatTimestamp(selectedItem.timestamp)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-10 h-10 bg-red-100 hover:bg-red-200 rounded-xl flex items-center justify-center text-red-600 text-xl transition-all shadow-sm hover:shadow-md"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-2xl border border-blue-200/50">
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">Rata-rata</div>
                  <div className="text-3xl font-bold text-blue-700">{selectedItem.statistics?.rata_rata || 0}<span className="text-xl">%</span></div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-2xl border border-green-200/50">
                  <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-2">Maksimum</div>
                  <div className="text-3xl font-bold text-green-700">{selectedItem.statistics?.maksimum || 0}<span className="text-xl">%</span></div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-2xl border border-orange-200/50">
                  <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-2">Minimum</div>
                  <div className="text-3xl font-bold text-orange-700">{selectedItem.statistics?.minimum || 0}<span className="text-xl">%</span></div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-2xl border border-purple-200/50">
                  <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-2">Tren</div>
                  <div className="text-3xl font-bold text-purple-700 capitalize">{selectedItem.statistics?.tren || 'N/A'}</div>
                </div>
              </div>

              {/* Pump Usage */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 mb-6 border border-orange-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-xl">⚙️</div>
                    <div>
                      <h4 className="font-bold text-gray-900">Penggunaan Pompa</h4>
                      <p className="text-sm text-gray-600">Aktivasi: <span className="font-bold text-orange-700">{selectedItem.pumpUsage?.aktivasi || 0} kali</span></p>
                    </div>
                  </div>
                  <div className="px-5 py-2.5 bg-orange-100 border-2 border-orange-200 rounded-xl">
                    <span className="text-xs text-orange-600 font-medium block mb-0.5">Persentase Waktu</span>
                    <span className="text-2xl font-bold text-orange-700">{selectedItem.pumpUsage?.persentase || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Analysis Content */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">🧠</div>
                    <h4 className="font-bold text-xl text-gray-900">Analisis & Rekomendasi AI</h4>
                  </div>
                  <button
                    onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                    className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
                  >
                    {showFullAnalysis ? '📖 Tampilkan Ringkas' : '📄 Tampilkan Semua'}
                  </button>
                </div>
                <div className={`text-gray-700 leading-relaxed space-y-1 ${!showFullAnalysis ? 'max-h-96 overflow-hidden relative' : ''}`}>
                  {formatAnalysis(selectedItem?.analysis)}
                  {!showFullAnalysis && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-100 to-transparent"></div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-6 flex items-center justify-between text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                <span>📊 {selectedItem.metadata?.dataPoints || 0} data points</span>
                <span>📅 {selectedItem.metadata?.analyzedAt || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
