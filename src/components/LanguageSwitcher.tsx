"use client";

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-md">
      <button
        onClick={() => setLanguage('id')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          language === 'id'
            ? 'bg-[#89986D] text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        ID
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          language === 'en'
            ? 'bg-[#89986D] text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
    </div>
  );
}
