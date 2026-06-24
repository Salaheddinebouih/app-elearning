import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { I18nManager, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en';
import ar from '../locales/ar';
import fr from '../locales/fr';

export const LANG_KEY = 'appLanguage';
const TRANSLATIONS = { en, ar, fr };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNestedValue(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  // Load persisted language on mount
  useEffect(() => {
    I18nManager.allowRTL(true);
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (saved && TRANSLATIONS[saved]) {
        setLanguageState(saved);
        const shouldBeRTL = saved === 'ar';
        if (I18nManager.isRTL !== shouldBeRTL) {
          I18nManager.forceRTL(shouldBeRTL);
        }
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang) => {
    if (!TRANSLATIONS[lang]) return;
    await AsyncStorage.setItem(LANG_KEY, lang);
    setLanguageState(lang);

    const isRTLNow = lang === 'ar';
    if (I18nManager.isRTL !== isRTLNow) {
      I18nManager.forceRTL(isRTLNow);
      Alert.alert(
        lang === 'ar' ? 'إعادة التشغيل مطلوبة' : 'Restart Required',
        lang === 'ar' ? 'يرجى إغلاق التطبيق وإعادة فتحه لتطبيق اللغة بالكامل.' : 'Please completely close and reopen the app to apply the language layout.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  /**
   * t(path, vars?)
   *
   * Resolves a dot-separated path against the active translation table.
   * Supports interpolation: t('home.streakDays', { n: 7 }) → '7 day streak'
   * Returns arrays as-is (e.g. retryMessages).
   * Falls back to English if the key is missing, then to the path itself.
   */
  const t = useCallback((path, vars = {}) => {
    let result = getNestedValue(TRANSLATIONS[language], path);
    if (result === undefined) {
      result = getNestedValue(TRANSLATIONS.en, path);
    }
    if (result === undefined) return path;
    if (typeof result !== 'string') return result;
    if (!Object.keys(vars).length) return result;
    return result.replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] !== undefined ? String(vars[k]) : `{${k}}`
    );
  }, [language]);

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
