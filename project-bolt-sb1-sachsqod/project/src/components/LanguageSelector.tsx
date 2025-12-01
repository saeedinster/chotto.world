import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageSelector() {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
      >
        <Globe size={20} className="text-purple-600" />
        <span className="text-2xl">{currentLanguage?.flag}</span>
        <span className="font-medium text-gray-700">{currentLanguage?.nativeName}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl z-50 overflow-hidden min-w-[200px]">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors ${
                  language === lang.code ? 'bg-purple-100' : ''
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left flex-1">
                  <div className="font-medium text-gray-800">{lang.nativeName}</div>
                  <div className="text-xs text-gray-600">{lang.name}</div>
                </div>
                {language === lang.code && (
                  <span className="text-purple-600 font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
