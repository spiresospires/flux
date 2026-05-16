import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SupportedLocale = 'en-US' | 'fr-FR';

type TranslationDictionary = {
  [key: string]: string | TranslationDictionary;
};

interface LocalizationContextValue {
  locale: SupportedLocale;
  t: (key: string, variables?: Record<string, string | number>) => string;
  isReady: boolean;
}

const FALLBACK_LOCALE: SupportedLocale = 'en-US';
const SUPPORTED_LOCALES: SupportedLocale[] = ['en-US', 'fr-FR'];

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

function resolveBrowserLocale(): SupportedLocale {
  if (typeof window === 'undefined') {
    return FALLBACK_LOCALE;
  }

  const primaryLocale = window.navigator.languages?.length
    ? window.navigator.languages[0]
    : window.navigator.language;

  const normalizedLocale = primaryLocale.toLowerCase();

  if (normalizedLocale.startsWith('fr')) {
    return 'fr-FR';
  }

  if (normalizedLocale.startsWith('en')) {
    return 'en-US';
  }

  return FALLBACK_LOCALE;
}

async function loadLocaleMessages(locale: SupportedLocale): Promise<TranslationDictionary> {
  const response = await fetch(`/locales/${locale}.json`, { cache: 'no-cache' });

  if (!response.ok) {
    throw new Error(`Failed to load locale pack: ${locale}`);
  }

  return response.json() as Promise<TranslationDictionary>;
}

function getTranslationValue(dictionary: TranslationDictionary, key: string): string | undefined {
  return key.split('.').reduce<string | TranslationDictionary | undefined>((currentValue, segment) => {
    if (!currentValue || typeof currentValue === 'string') {
      return undefined;
    }

    return currentValue[segment];
  }, dictionary) as string | undefined;
}

function interpolate(template: string, variables?: Record<string, string | number>) {
  if (!variables) {
    return template;
  }

  return template.replace(/{{\s*(\w+)\s*}}/g, (_, variableName: string) => {
    const value = variables[variableName];
    return value === undefined ? `{{${variableName}}}` : String(value);
  });
}

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>(FALLBACK_LOCALE);
  const [fallbackMessages, setFallbackMessages] = useState<TranslationDictionary>({});
  const [messages, setMessages] = useState<TranslationDictionary>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const syncLocaleWithBrowser = () => {
      const resolvedLocale = resolveBrowserLocale();
      setLocale(SUPPORTED_LOCALES.includes(resolvedLocale) ? resolvedLocale : FALLBACK_LOCALE);
    };

    syncLocaleWithBrowser();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncLocaleWithBrowser();
      }
    };

    window.addEventListener('focus', syncLocaleWithBrowser);
    window.addEventListener('pageshow', syncLocaleWithBrowser);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', syncLocaleWithBrowser);
      window.removeEventListener('pageshow', syncLocaleWithBrowser);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      setIsReady(false);

      try {
        const englishMessages = await loadLocaleMessages(FALLBACK_LOCALE);
        if (!isMounted) {
          return;
        }

        setFallbackMessages(englishMessages);

        if (locale === FALLBACK_LOCALE) {
          setMessages(englishMessages);
          setIsReady(true);
          return;
        }

        try {
          const localizedMessages = await loadLocaleMessages(locale);
          if (!isMounted) {
            return;
          }

          setMessages(localizedMessages);
        } catch {
          if (!isMounted) {
            return;
          }

          setMessages(englishMessages);
          setLocale(FALLBACK_LOCALE);
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setFallbackMessages({});
        setMessages({});
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [locale]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo<LocalizationContextValue>(() => ({
    locale,
    isReady,
    t: (key, variables) => {
      const translatedValue = getTranslationValue(messages, key) ?? getTranslationValue(fallbackMessages, key) ?? key;
      return interpolate(translatedValue, variables);
    },
  }), [fallbackMessages, isReady, locale, messages]);

  if (!isReady) {
    return <div className="min-h-screen bg-white" aria-hidden="true" />;
  }

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }

  return context;
}