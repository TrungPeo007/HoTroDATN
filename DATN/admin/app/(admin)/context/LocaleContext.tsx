"use client";
import { createContext, useContext, useState } from "react";
import en from "../locales/en.json";
import vi from "../locales/vi.json";

type Locale = "en" | "vi";

// Khai báo kiểu cho từng file locale
type TranslationMap = Record<string, string>;

// Tập hợp tất cả bản dịch
const translations: Record<Locale, TranslationMap> = { en, vi };

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("vi");

  const t = (key: string): string => {
    return translations[locale][key] ?? key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
};