"use client";

import { useState } from "react";
import { initializeHistoryIfNeeded, cleanupOldHistory } from "@/utils/historyManager";

export default function HistoryManagerButton() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [message, setMessage] = useState("");

  const handleInitialize = async () => {
    setIsInitializing(true);
    setMessage("");
    
    try {
      const success = await initializeHistoryIfNeeded();
      if (success) {
        setMessage("✅ Historical data berhasil di-initialize!");
      } else {
        setMessage("⚠️ Data history sudah ada atau tidak ada data latest");
      }
    } catch (error) {
      setMessage("❌ Error: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCleanup = async () => {
    setIsCleaning(true);
    setMessage("");
    
    try {
      await cleanupOldHistory();
      setMessage("✅ Data lama berhasil dibersihkan!");
    } catch (error) {
      setMessage("❌ Error: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <span className="text-2xl mr-3">🔧</span>
        Data History Manager
      </h3>
      
      <div className="space-y-3">
        <button
          onClick={handleInitialize}
          disabled={isInitializing}
          className={`
            w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all
            ${isInitializing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-cream0 text-white hover:bg-olive shadow-md hover:shadow-lg'
            }
          `}
        >
          {isInitializing ? '⏳ Initializing...' : '🚀 Initialize Historical Data'}
        </button>
        
        <button
          onClick={handleCleanup}
          disabled={isCleaning}
          className={`
            w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all
            ${isCleaning
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg'
            }
          `}
        >
          {isCleaning ? '⏳ Cleaning...' : '🧹 Cleanup Old Data'}
        </button>
      </div>

      {message && (
        <div className={`
          mt-4 p-3 rounded-xl text-sm font-medium
          ${message.includes('✅') ? 'bg-cream text-olive-dark border border-sage-light' : ''}
          ${message.includes('⚠️') ? 'bg-cream text-yellow-800 border border-yellow-200' : ''}
          ${message.includes('❌') ? 'bg-red-50 text-red-800 border border-red-200' : ''}
        `}>
          {message}
        </div>
      )}

      <div className="mt-4 p-3 bg-cream/50 rounded-xl border border-sage-light">
        <p className="text-xs text-olive-dark">
          💡 <strong>Tip:</strong> Gunakan &quot;Initialize&quot; jika analisis AI error karena tidak ada data history.
          Sistem akan generate 24 jam sample data untuk testing.
        </p>
      </div>
    </div>
  );
}
