// Logseq PDF 查看器接口
export interface LogseqPDFViewer {
  viewer?: HTMLElement;
  $inSystemWindow?: boolean;
}

// 翻译器状态
export interface TranslatorState {
  isEnabled: boolean;
  panelPosition?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  lastContent?: string;
  fontSize?: number;
}

// 面板引用
export interface PanelRef {
  element: HTMLElement;
  document: Document;
}
