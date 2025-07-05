'use client';

import { useEffect } from 'react';
import i18n from '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';

export default function I18nProvider({ children }) {
  useEffect(() => {
    // 確保i18n只在用戶端初始化
    if (typeof window !== 'undefined') {
      // 這裡可以添加任何用戶端特定的i18n初始化邏輯
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
