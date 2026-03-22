/**
 * useLanguage — manages EN/ES language state with localStorage persistence.
 * Default: "en". Persists across sessions via "pplx-lang" key.
 */

import { useState, useCallback } from "react";
import type { Lang } from "../config/i18n";

const STORAGE_KEY = "pplx-lang";

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {
    // localStorage unavailable (SSR / private mode)
  }
  return "en";
}

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write errors
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "es" : "en");
  }, [lang, setLang]);

  return { lang, toggleLang } as const;
}
