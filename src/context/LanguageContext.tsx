import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from '../i18n';

type Language = 'es' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, defaultEnglishVal?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to resolve dot-notation path on object
function getNestedValue(obj: any, path: string): string | null {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return null;
    current = current[part];
  }
  return typeof current === 'string' ? current : null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('es');

  const t = (key: string, defaultEnglishVal?: string) => {
    // 1. Try to find the key in the active language dictionary
    const langDict = translations[lang];
    const val = getNestedValue(langDict, key);
    if (val != null) return val;

    // 2. Fallback to Spanish dictionary
    const esDict = translations['es'];
    const esVal = getNestedValue(esDict, key);
    if (esVal != null) return esVal;

    // 3. Fallback to inline english value if provided (backward compatibility)
    if (lang === 'en' && defaultEnglishVal != null) return defaultEnglishVal;
    
    // 4. Return the key itself as last resort
    return defaultEnglishVal != null ? defaultEnglishVal : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
