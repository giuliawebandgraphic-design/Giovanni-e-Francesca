import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'it' | 'en';
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void }>({ language: 'it', setLanguage: () => {} });
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try { return localStorage.getItem('registry-language') === 'en' ? 'en' : 'it'; } catch { return 'it'; }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem('registry-language', language); } catch { /* Storage may be unavailable in an embedded view. */ }
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  return { ...context, t: (it: string, en: string) => context.language === 'en' ? en : it };
}
export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  return <div className="flex items-center justify-center gap-2 py-3" role="group" aria-label="Language / Lingua">
    {([['it', '🇮🇹', 'Italiano'], ['en', '🇬🇧', 'English']] as const).map(([value, flag, label]) => <button key={value} type="button" onClick={() => setLanguage(value)} aria-label={label} aria-pressed={language === value} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${language === value ? 'border-[#636842] bg-[#BCBF97]/25 text-stone-900' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'}`}><span aria-hidden="true">{flag}</span> {value.toUpperCase()}</button>)}
  </div>;
}
