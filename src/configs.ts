// DOM 选择器
export const SELECTORS = {
  PDF_CONTAINER: '.extensions__pdf-container',
  PDF_VIEWER: '.extensions__pdf-viewer',
  PDF_VIEWER_CONTAINER: '.extensions__pdf-viewer-cnt',
  PDF_TOOLBAR_BUTTONS: '.extensions__pdf-toolbar .buttons',
  TRANSLATOR_BUTTON: '.pdf-translator-toggle-btn',
  PANEL: '.pdf-translator-panel',
} as const;

// 窗口状态
export const SYSTEM_WINDOW_CLASS = 'is-system-window';

// 面板配置
export const PANEL_CONFIG = {
  FONT_STEP: 2,
  MIN_WIDTH: 200,
  MIN_HEIGHT: 100,
  MIN_FONT_SIZE: 12,
  MAX_FONT_SIZE: 24,
  DEFAULT_FONT_SIZE: 14,
  MAX_CONTENT_LENGTH: 1000, // 状态保存时的最大内容长度（字符）
} as const;

// 全局状态
export const GLOBAL_STATE_KEY = '__PDF_TRANSLATOR_STATE__';
