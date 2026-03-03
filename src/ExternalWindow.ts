import { SELECTORS } from './configs';
import { 
  getActivePDFViewer, 
  resolveOwnDocument, 
  isSystemWindow,
  syncThemeAttributes,
  createThemeObserver
} from './utils';

export class ExternalWindow {
  private injectStyles: (doc: Document) => void;
  private addTranslationButton: (doc: Document) => void;
  private initialized = false;
  private externalWindowDoc: Document | null = null;
  private themeCleanup: (() => void) | null = null;

  constructor(
    injectStyles: (doc: Document) => void,
    addTranslationButton: (doc: Document) => void
  ) {
    this.injectStyles = injectStyles;
    this.addTranslationButton = addTranslationButton;
  }

  // 查找外部窗口文档
  private findExternalWindowDocument(): Document | null {
    // 1. 检查当前文档
    if (isSystemWindow(document)) return document;
    // 2. 从活动查看器获取
    const viewer = getActivePDFViewer();
    if (viewer?.$inSystemWindow) {
      const doc = resolveOwnDocument(viewer);
      if (doc && isSystemWindow(doc)) return doc;
    }
    // 3. 检查父窗口
    try {
      if (window.parent !== window && isSystemWindow(window.parent.document)) {
        return window.parent.document;
      }
    } catch {}
    return null;
  }

  //等待工具栏加载
  private waitForToolbar(doc: Document, timeout = 3000): Promise<Element> {
    const existing = doc.querySelector(SELECTORS.PDF_TOOLBAR_BUTTONS);
    if (existing) return Promise.resolve(existing);

    return new Promise((resolve, reject) => {
      const observer = new MutationObserver(() => {
        const toolbar = doc.querySelector(SELECTORS.PDF_TOOLBAR_BUTTONS);
        if (toolbar) {
          observer.disconnect();
          resolve(toolbar);
        }
      });

      observer.observe(doc.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        reject(new Error('等待工具栏超时'));
      }, timeout);
    });
  }

  //设置主题监听器
  private setupThemeObserver(targetDoc: Document): void {
    if (this.themeCleanup) {
      this.themeCleanup();
      this.themeCleanup = null;
    }
    
    this.themeCleanup = createThemeObserver(() => {
      syncThemeAttributes(targetDoc);
    });
  }

  // 初始化外部窗口
  async initialize(): Promise<boolean> {
    if (this.initialized) return false;

    const doc = this.findExternalWindowDocument();
    if (!doc) return false;

    try {
      syncThemeAttributes(doc);
      this.setupThemeObserver(doc);
      this.injectStyles(doc);
      await this.waitForToolbar(doc);
      this.addTranslationButton(doc);
      
      this.initialized = true;
      this.externalWindowDoc = doc;
      
      doc.defaultView?.addEventListener('beforeunload', () => this.destroy());
      return true;
    } catch {
      return false;
    }
  }

  // 检查并初始化外部窗口
  async checkAndInitialize(): Promise<void> {
    if (this.initialized) return;
    
    const doc = this.findExternalWindowDocument();
    if (doc) await this.initialize();
  }

  // 获取外部窗口文档
  getExternalWindowDocument(): Document | null {
    return this.externalWindowDoc;
  }

  //销毁
  destroy(): void {
    if (this.themeCleanup) {
      this.themeCleanup();
      this.themeCleanup = null;
    }
    this.initialized = false;
    this.externalWindowDoc = null;
  }
}
