import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../i18n/translations';
import { supabase } from '../lib/supabase';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  availableLanguages: { code: Language; name: string; nativeName: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es' as Language, name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr' as Language, name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de' as Language, name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt' as Language, name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh' as Language, name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja' as Language, name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ar' as Language, name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi' as Language, name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn' as Language, name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'ru' as Language, name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' }
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  useEffect(() => {
    if (language === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', language);
    }
  }, [language]);

  const loadLanguagePreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('language')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.language) {
          setLanguageState(profile.language as Language);
        }
      } else {
        const savedLang = localStorage.getItem('language');
        if (savedLang && savedLang in translations) {
          setLanguageState(savedLang as Language);
        } else {
          const browserLang = navigator.language.split('-')[0];
          if (browserLang in translations) {
            setLanguageState(browserLang as Language);
          }
        }
      }
    } catch (error) {
      console.error('Error loading language preference:', error);

      const savedLang = localStorage.getItem('language');
      if (savedLang && savedLang in translations) {
        setLanguageState(savedLang as Language);
      }
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('user_profiles')
          .update({ language: lang })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
