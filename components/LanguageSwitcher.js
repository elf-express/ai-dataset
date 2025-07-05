'use client';

import { useTranslation } from 'react-i18next';
import { IconButton, Tooltip, useTheme, Typography } from '@mui/material';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const theme = useTheme();

  const toggleLanguage = () => {
    let newLang;
    if (i18n.language === 'zh-CN') {
      newLang = 'zh-TW';
    } else if (i18n.language === 'zh-TW') {
      newLang = 'en';
    } else {
      newLang = 'zh-CN';
    }
    i18n.changeLanguage(newLang);
  };

  // 依據下一個語言動態顯示提示與按鈕文字
  let tooltipText, buttonText;
  if (i18n.language === 'zh-CN') {
    tooltipText = '切換到繁體';
    buttonText = '简';
  } else if (i18n.language === 'zh-TW') {
    tooltipText = 'Switch to English';
    buttonText = '繁';
  } else {
    tooltipText = '切换到简体';
    buttonText = 'EN';
  }

  return (
    <Tooltip title={tooltipText}>
      <IconButton
        onClick={toggleLanguage}
        size="small"
        sx={{
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
          color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
          p: 1,
          borderRadius: 1.5,
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)'
          }
        }}
      >
        <Typography variant="body2" fontWeight="medium">
          {buttonText}
        </Typography>
      </IconButton>
    </Tooltip>
  );
}
