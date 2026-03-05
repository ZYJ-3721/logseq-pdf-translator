import { useEffect, useRef } from "react";
import type { TranslatorState, PanelRef } from "./types";
import { SELECTORS, PANEL_CONFIG, GLOBAL_STATE_KEY } from "./configs";
import { ExternalWindow } from "./ExternalWindow";
import { PANEL_STYLES } from "./styles";
import { 
  getTargetDocument, 
  getAllDocuments, 
  preprocessPDFText, 
  escapeHtml, 
  debounce, 
  showNotification,
  isSystemWindow,
  getMainDocument,
  createThemeObserver,
  containsPDFContainer
} from "./utils";
import { translateText } from "./translators/index";

// ============ 样式注入 ============

function injectSystemWindowStyles(doc: Document): void {
  const existingStyle = doc.getElementById('pdf-translator-system-window-styles');
  if (existingStyle) return;
  
  const style = doc.createElement('style');
  style.id = 'pdf-translator-system-window-styles';
  style.textContent = PANEL_STYLES;
  doc.head.appendChild(style);
}

// ============ 状态管理 ============

function getGlobalState(): TranslatorState {
  try {
    const openerState = (window.opener as any)?.[GLOBAL_STATE_KEY];
    if (openerState) return openerState;
    
    const parentState = (window.parent as any)?.[GLOBAL_STATE_KEY];
    if (parentState) return parentState;
    
    const currentState = (window as any)[GLOBAL_STATE_KEY];
    if (currentState) return currentState;
    
    return { isEnabled: false };
  } catch {
    return { isEnabled: false };
  }
}

function setGlobalState(state: TranslatorState): void {
  try {
    (window as any)[GLOBAL_STATE_KEY] = state;
    if (window.opener && window.opener !== window) {
      (window.opener as any)[GLOBAL_STATE_KEY] = state;
    }
    if (window.parent && window.parent !== window) {
      (window.parent as any)[GLOBAL_STATE_KEY] = state;
    }
  } catch {
    (window as any)[GLOBAL_STATE_KEY] = state;
  }
}

function clearGlobalState(): void {
  try {
    delete (window as any)[GLOBAL_STATE_KEY];
    if (window.opener && window.opener !== window) {
      delete (window.opener as any)[GLOBAL_STATE_KEY];
    }
    if (window.parent && window.parent !== window) {
      delete (window.parent as any)[GLOBAL_STATE_KEY];
    }
  } catch {
    delete (window as any)[GLOBAL_STATE_KEY];
  }
}

// ============ 主组件 ============

function App() {
  const panelRef = useRef<PanelRef | null>(null);
  const stateRef = useRef<TranslatorState>({ isEnabled: false });
  const mouseUpHandlerRef = useRef<((e: Event) => void) | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const systemWindowCheckIntervalRef = useRef<number | null>(null);
  const themeWatcherRef = useRef<(() => void) | null>(null);
  const translateAndDisplayRef = useRef<((text: string) => Promise<void>) | null>(null);
  const enableTranslatorRef = useRef<((restoreFromState: boolean, explicitDoc?: Document) => boolean) | null>(null);
  const syncButtonStatesRef = useRef<((isEnabled: boolean) => void) | null>(null);

  useEffect(() => {
    // 初始化状态
    const initState = () => {
      // 尝试从全局状态恢复
      const globalState = getGlobalState();
      // 如果全局状态显示翻译器已启用，则恢复状态
      if (globalState.isEnabled) {
        stateRef.current = { ...globalState };
        return;
      }
      stateRef.current = { isEnabled: false };
    };
    initState();

    // 监听来自高亮菜单的翻译请求
    const handleTranslateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string }>;
      const text = customEvent.detail?.text;
      
      if (!text || text.length < 2) return;
      
      // 如果翻译器未启用，先启用它
      if (!stateRef.current.isEnabled) {
        const targetDoc = getTargetDocument();
        const success = enableTranslatorRef.current?.(false, targetDoc);
        if (!success) {
          showNotification("启用翻译失败", "error");
          return;
        }
        syncButtonStatesRef.current?.(true);
      }
      
      // 翻译文本
      const processedText = preprocessPDFText(text);
      translateAndDisplayRef.current?.(processedText);
    };
    
    window.addEventListener('pdf-translator-translate', handleTranslateEvent);

    // 保存状态
    const saveState = () => {
      if (!panelRef.current) {
        return;
      }
      
      const panel = panelRef.current.element;
      const contentElement = panel.querySelector('.pdf-translator-panel-content');
      const panelPosition: any = {};
      
      ['left', 'right', 'top', 'bottom'].forEach(prop => {
        const value = panel.style[prop as any];
        if (value && value !== 'auto') {
          panelPosition[prop] = parseInt(value);
        }
      });
      
      // 限制保存的内容长度，避免占用过多内存
      const content = contentElement?.innerHTML || '';
      const truncatedContent =
        content.length > PANEL_CONFIG.MAX_CONTENT_LENGTH
          ? content.substring(0, PANEL_CONFIG.MAX_CONTENT_LENGTH) + '...'
          : content;
      
      const state: TranslatorState = {
        isEnabled: true,
        panelPosition,
        lastContent: truncatedContent,
        fontSize: parseInt(panel.getAttribute('data-font-size') || String(PANEL_CONFIG.DEFAULT_FONT_SIZE)),
      };
      
      stateRef.current = state;
      setGlobalState(state);
    };
    
    const debouncedSaveState = debounce(saveState, 200);
    
    // 应用主题到面板
    const applyThemeToPanel = (panel: HTMLElement) => {
      const mainDoc = getMainDocument();
      const mainRoot = mainDoc.documentElement;
      
      // 同步 data-theme 和 data-color 属性
      ['data-theme', 'data-color'].forEach(attr => {
        const value = mainRoot.getAttribute(attr);
        if (value) {
          panel.setAttribute(attr, value);
        }
      });
      
      // 清除旧的主题相关 class
      const panelClasses = Array.from(panel.classList);
      panelClasses
        .filter(cls => cls.includes('theme') || cls.includes('dark') || cls.includes('light'))
        .forEach(cls => panel.classList.remove(cls));
      
      // 同步主题相关的 class
      const mainClasses = Array.from(mainRoot.classList);
      mainClasses
        .filter(cls => cls.includes('theme') || cls.includes('dark') || cls.includes('light'))
        .forEach(cls => panel.classList.add(cls));
    };

    // 创建翻译面板
    const createPanel = (targetDoc: Document, initialContent?: string): PanelRef | null => {
      const pdfViewer = targetDoc.querySelector(SELECTORS.PDF_VIEWER) as HTMLElement;
      if (!pdfViewer) return null;

      // 清理旧面板
      if (panelRef.current) {
        panelRef.current.element.remove();
        panelRef.current = null;
      }
      targetDoc.querySelectorAll(SELECTORS.PANEL).forEach(panel => panel.remove());

      const panel = targetDoc.createElement('div');
      panel.className = 'pdf-translator-panel';
      panel.setAttribute('data-font-size', String(PANEL_CONFIG.DEFAULT_FONT_SIZE));
      
      // 应用主窗口主题
      applyThemeToPanel(panel);

      // 确保 PDF 查看器有相对定位
      const viewerPosition = targetDoc.defaultView?.getComputedStyle(pdfViewer)?.position;
      if (viewerPosition === 'static') {
        pdfViewer.style.position = 'relative';
      }
      
      // 计算面板位置和大小
      const viewerRect = pdfViewer.getBoundingClientRect();
      const settings = (window as any).logseq?.settings || {};
      const widthRatio = Math.max(0.1, Math.min(1.0, parseFloat(settings.panelWidthRatio) || 0.5));
      const heightRatio = Math.max(0.1, Math.min(1.0, parseFloat(settings.panelHeightRatio) || 0.25));
      
      const horizontalPosition = settings.panelHorizontalPosition ?? "左侧";
      const horizontalMargin = parseInt(settings.panelHorizontalMargin) || 0;
      const verticalPosition = settings.panelVerticalPosition ?? "底部";
      const verticalMargin = parseInt(settings.panelVerticalMargin) || 0;
      
      const defaultWidth = Math.floor(viewerRect.width * widthRatio);
      const defaultHeight = Math.floor(viewerRect.height * heightRatio);

      const panelStyle: any = {
        width: `${defaultWidth}px`,
        height: `${defaultHeight}px`,
        display: 'flex !important',
        position: 'fixed !important',
        minWidth: `${PANEL_CONFIG.MIN_WIDTH}px`,
        minHeight: `${PANEL_CONFIG.MIN_HEIGHT}px`
      };
      
      if (horizontalPosition === "左侧") {
        panelStyle.left = `${horizontalMargin}px`;
        panelStyle.right = 'auto';
      } else {
        panelStyle.right = `${horizontalMargin}px`;
        panelStyle.left = 'auto';
      }
      
      if (verticalPosition === "底部") {
        panelStyle.bottom = `${verticalMargin}px`;
        panelStyle.top = 'auto';
      } else {
        panelStyle.top = `${verticalMargin}px`;
        panelStyle.bottom = 'auto';
      }

      Object.assign(panel.style, panelStyle);
      
      const content = initialContent || '选中文本以查看翻译';
      const fontSize = PANEL_CONFIG.DEFAULT_FONT_SIZE;
      
      panel.innerHTML = `
        <div class="pdf-translator-panel-header">
          <span class="pdf-translator-panel-title">翻译结果</span>
          <div class="pdf-translator-font-size-controls">
            <button class="pdf-translator-font-size-btn" data-action="decrease" title="减小字体">A-</button>
            <span class="pdf-translator-font-size-label">${fontSize}px</span>
            <button class="pdf-translator-font-size-btn" data-action="increase" title="增大字体">A+</button>
          </div>
        </div>
        <div class="pdf-translator-panel-content" style="font-size: ${fontSize}px;">${content}</div>
        <div class="pdf-translator-panel-resizer"></div>
      `;

      pdfViewer.appendChild(panel);

      return { element: panel, document: targetDoc };
    };

    // 设置主题监听器
    const setupThemeWatcher = () => {
      return createThemeObserver(() => {
        if (panelRef.current) {
          applyThemeToPanel(panelRef.current.element);
        }
      });
    };

    // 恢复面板
    const restorePanel = (targetDoc: Document, state: TranslatorState): PanelRef | null => {
      const panelRefObj = createPanel(targetDoc, state.lastContent);
      if (!panelRefObj) return null;
      
      const panel = panelRefObj.element;

      // 恢复位置
      if (state.panelPosition) {
        const positionStyle: any = {};
        
        if (state.panelPosition.left !== undefined) {
          positionStyle.left = `${state.panelPosition.left}px`;
          positionStyle.right = 'auto';
        } else if (state.panelPosition.right !== undefined) {
          positionStyle.right = `${state.panelPosition.right}px`;
          positionStyle.left = 'auto';
        }
        
        if (state.panelPosition.top !== undefined) {
          positionStyle.top = `${state.panelPosition.top}px`;
          positionStyle.bottom = 'auto';
        } else if (state.panelPosition.bottom !== undefined) {
          positionStyle.bottom = `${state.panelPosition.bottom}px`;
          positionStyle.top = 'auto';
        }
        
        Object.assign(panel.style, positionStyle);
      }
      
      // 恢复字体大小
      if (state.fontSize) {
        const contentDiv = panel.querySelector('.pdf-translator-panel-content') as HTMLElement;
        const label = panel.querySelector('.pdf-translator-font-size-label') as HTMLElement;
        
        panel.setAttribute('data-font-size', state.fontSize.toString());
        if (contentDiv) contentDiv.style.fontSize = `${state.fontSize}px`;
        if (label) label.textContent = `${state.fontSize}px`;
      }

      return panelRefObj;
    };

    // 设置面板交互
    const setupPanelInteractions = (panelRefObj: PanelRef, container: HTMLElement) => {
      const panel = panelRefObj.element;
      const panelDoc = panelRefObj.document;
      const header = panel.querySelector('.pdf-translator-panel-header') as HTMLElement;
      
      // 拖拽功能
      let isDragging = false;
      let startX = 0, startY = 0;
      let initialLeft = 0, initialRight = 0, initialTop = 0, initialBottom = 0;
      let usingLeft = true, usingTop = false;

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging || !panelRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        
        const panel = panelRef.current.element;
        const containerRect = container.getBoundingClientRect();
        const { offsetWidth: panelWidth, offsetHeight: panelHeight } = panel;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        if (usingLeft) {
          let newLeft = initialLeft + deltaX;
          newLeft = Math.max(0, Math.min(newLeft, containerRect.width - panelWidth));
          panel.style.left = `${newLeft}px`;
        } else {
          let newRight = initialRight - deltaX;
          newRight = Math.max(0, Math.min(newRight, containerRect.width - panelWidth));
          panel.style.right = `${newRight}px`;
        }
        
        if (usingTop) {
          let newTop = initialTop + deltaY;
          newTop = Math.max(0, Math.min(newTop, containerRect.height - panelHeight));
          panel.style.top = `${newTop}px`;
        } else {
          let newBottom = initialBottom - deltaY;
          newBottom = Math.max(0, Math.min(newBottom, containerRect.height - panelHeight));
          panel.style.bottom = `${newBottom}px`;
        }
      };

      const onMouseUp = (e: MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        
        isDragging = false;
        panelDoc.removeEventListener('mousemove', onMouseMove);
        panelDoc.removeEventListener('mouseup', onMouseUp);
        header.style.cursor = 'move';
        panelDoc.body.style.userSelect = '';
        debouncedSaveState();
      };

      header.onmousedown = (e) => {
        if ((e.target as HTMLElement).closest('.pdf-translator-font-size-controls') || !panelRef.current) return;
        
        const panel = panelRef.current.element;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        usingLeft = panel.style.left !== 'auto' && panel.style.left !== '';
        usingTop = panel.style.top !== 'auto' && panel.style.top !== '';
        
        initialLeft = parseInt(panel.style.left) || 0;
        initialRight = parseInt(panel.style.right) || 0;
        initialTop = parseInt(panel.style.top) || 0;
        initialBottom = parseInt(panel.style.bottom) || 0;
        
        header.style.cursor = 'grabbing';
        panelDoc.body.style.userSelect = 'none';
        
        panelDoc.addEventListener('mousemove', onMouseMove);
        panelDoc.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
        e.stopPropagation();
      };

      // 调整大小功能
      const resizer = panel.querySelector('.pdf-translator-panel-resizer') as HTMLElement;
      let isResizing = false;
      let resizeStartX = 0, resizeStartY = 0, startWidth = 0, startHeight = 0;

      const onResizeMove = (e: MouseEvent) => {
        if (!isResizing || !panelRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        
        const panel = panelRef.current.element;
        const containerRect = container.getBoundingClientRect();
        const maxWidth = containerRect.width - 20;
        const maxHeight = containerRect.height - 20;
        
        const newWidth = Math.max(PANEL_CONFIG.MIN_WIDTH, Math.min(startWidth + (e.clientX - resizeStartX), maxWidth));
        const newHeight = Math.max(PANEL_CONFIG.MIN_HEIGHT, Math.min(startHeight + (resizeStartY - e.clientY), maxHeight));
        
        panel.style.width = `${newWidth}px`;
        panel.style.height = `${newHeight}px`;
      };

      const onResizeUp = (e: MouseEvent) => {
        if (!isResizing) return;
        e.preventDefault();
        e.stopPropagation();
        
        isResizing = false;
        panelDoc.removeEventListener('mousemove', onResizeMove);
        panelDoc.removeEventListener('mouseup', onResizeUp);
        resizer.style.cursor = 'nesw-resize';
        panelDoc.body.style.userSelect = '';
        debouncedSaveState();
      };

      resizer.onmousedown = (e) => {
        if (!panelRef.current) return;
        
        const panel = panelRef.current.element;
        isResizing = true;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        startWidth = panel.offsetWidth;
        startHeight = panel.offsetHeight;
        resizer.style.cursor = 'nesw-resize';
        panelDoc.body.style.userSelect = 'none';
        
        panelDoc.addEventListener('mousemove', onResizeMove);
        panelDoc.addEventListener('mouseup', onResizeUp);
        e.preventDefault();
        e.stopPropagation();
      };
      
      // 字体大小控制
      const decreaseBtn = panel.querySelector('[data-action="decrease"]') as HTMLElement;
      const increaseBtn = panel.querySelector('[data-action="increase"]') as HTMLElement;
      const label = panel.querySelector('.pdf-translator-font-size-label') as HTMLElement;
      const contentDiv = panel.querySelector('.pdf-translator-panel-content') as HTMLElement;
      
      const updateFontSize = (delta: number) => {
        if (!panelRef.current) return;
        
        const panel = panelRef.current.element;
        const currentSize = parseInt(panel.getAttribute('data-font-size') || String(PANEL_CONFIG.DEFAULT_FONT_SIZE));
        const newSize = Math.max(PANEL_CONFIG.MIN_FONT_SIZE, Math.min(PANEL_CONFIG.MAX_FONT_SIZE, currentSize + delta));
        
        panel.setAttribute('data-font-size', newSize.toString());
        contentDiv.style.fontSize = `${newSize}px`;
        label.textContent = `${newSize}px`;
        debouncedSaveState();
      };
      
      decreaseBtn.onclick = (e) => {
        e.stopPropagation();
        updateFontSize(-PANEL_CONFIG.FONT_STEP);
      };
      
      increaseBtn.onclick = (e) => {
        e.stopPropagation();
        updateFontSize(PANEL_CONFIG.FONT_STEP);
      };
    };

    // 翻译并显示
    const translateAndDisplay = async (text: string) => {
      if (!panelRef.current) return;
      
      const panel = panelRef.current.element;
      const contentDiv = panel.querySelector('.pdf-translator-panel-content') as HTMLElement;
      if (!contentDiv) return;
      
      contentDiv.innerHTML = `
        <div class="pdf-translator-loading">
          <div class="pdf-translator-spinner"></div>
          <span>翻译中...</span>
        </div>
      `;

      try {
        const translation = await translateText(text);
        contentDiv.innerHTML = `
          <div class="pdf-translator-text">${escapeHtml(translation)}</div>
        `;
        saveState();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "未知错误";
        contentDiv.innerHTML = `
          <div class="pdf-translator-error">❌ 翻译失败: ${errorMsg}</div>
        `;
        saveState();
      }
    };
    translateAndDisplayRef.current = translateAndDisplay;
    
    // 处理文本选择
    const handleTextSelection = (e: MouseEvent) => {
      if (!stateRef.current.isEnabled) return;
      
      const target = e.target as HTMLElement;
      if (target.closest('.pdf-translator-panel')) return;
      
      const targetDoc = getTargetDocument();
      const selection = targetDoc.getSelection?.();
      if (!selection || selection.rangeCount === 0) return;
      
      const selectedText = preprocessPDFText(selection.toString() || "");
      if (selectedText.length >= 2) {
        translateAndDisplay(selectedText);
      }
    };

    // 启用翻译器
    const enableTranslator = (restoreFromState = false, explicitDoc?: Document): boolean => {
      const targetDoc = explicitDoc || getTargetDocument();
      const pdfViewer = targetDoc.querySelector(SELECTORS.PDF_VIEWER) as HTMLElement;
      const pdfContainer = targetDoc.querySelector(SELECTORS.PDF_CONTAINER) as HTMLElement;
      
      if (!pdfViewer || !pdfContainer) return false;

      // 注入样式（如果是系统窗口）
      if (isSystemWindow(targetDoc)) {
        injectSystemWindowStyles(targetDoc);
      }
      
      // 创建或恢复面板
      const savedState = stateRef.current;
      const newPanelRef = (restoreFromState && savedState.isEnabled)
        ? restorePanel(targetDoc, savedState)
        : createPanel(targetDoc);
      
      if (!newPanelRef) return false;

      panelRef.current = newPanelRef;
      stateRef.current.isEnabled = true;
      
      setupPanelInteractions(newPanelRef, pdfContainer);
      
      // 设置主题监听器
      if (themeWatcherRef.current) {
        try {
          themeWatcherRef.current();
        } catch {}
      }
      themeWatcherRef.current = setupThemeWatcher();
      
      // 设置事件监听
      mouseUpHandlerRef.current = (e: Event) => handleTextSelection(e as MouseEvent);
      targetDoc.addEventListener('mouseup', mouseUpHandlerRef.current);
      
      // 约束面板位置
      const constrainPanelToBounds = () => {
        if (!panelRef.current) return;
        
        const panel = panelRef.current.element;
        const containerRect = pdfContainer.getBoundingClientRect();
        
        let panelWidth = panel.offsetWidth;
        let panelHeight = panel.offsetHeight;
        
        const maxWidth = containerRect.width - 20;
        const maxHeight = containerRect.height - 20;
        
        if (panelWidth > maxWidth) {
          panelWidth = Math.max(PANEL_CONFIG.MIN_WIDTH, maxWidth);
          panel.style.width = `${panelWidth}px`;
        }
        
        if (panelHeight > maxHeight) {
          panelHeight = Math.max(PANEL_CONFIG.MIN_HEIGHT, maxHeight);
          panel.style.height = `${panelHeight}px`;
        }
        
        if (panel.style.left && panel.style.left !== 'auto') {
          let left = parseInt(panel.style.left);
          left = Math.max(0, Math.min(left, containerRect.width - panelWidth));
          panel.style.left = `${left}px`;
        }
        
        if (panel.style.right && panel.style.right !== 'auto') {
          let right = parseInt(panel.style.right);
          right = Math.max(0, Math.min(right, containerRect.width - panelWidth));
          panel.style.right = `${right}px`;
        }
        
        if (panel.style.top && panel.style.top !== 'auto') {
          let top = parseInt(panel.style.top);
          top = Math.max(0, Math.min(top, containerRect.height - panelHeight));
          panel.style.top = `${top}px`;
        }
        
        if (panel.style.bottom && panel.style.bottom !== 'auto') {
          let bottom = parseInt(panel.style.bottom);
          bottom = Math.max(0, Math.min(bottom, containerRect.height - panelHeight));
          panel.style.bottom = `${bottom}px`;
        }
      };
      
      const updatePanelPosition = () => {
        if (!panelRef.current) return;
        requestAnimationFrame(() => {
          constrainPanelToBounds();
          debouncedSaveState();
        });
      };
      
      resizeHandlerRef.current = updatePanelPosition;
      const targetWindow = targetDoc.defaultView || window;
      targetWindow.addEventListener('resize', resizeHandlerRef.current);
      
      resizeObserverRef.current = new ResizeObserver(updatePanelPosition);
      resizeObserverRef.current.observe(pdfContainer);
      
      saveState();

      return true;
    };
    enableTranslatorRef.current = enableTranslator;

    // 禁用翻译器
    const disableTranslator = (keepState = false) => {
      const wasEnabled = stateRef.current.isEnabled;
      
      if (keepState && wasEnabled) {
        saveState();
      } else {
        stateRef.current = { isEnabled: false };
        clearGlobalState();
      }
      
      // 清理当前窗口的面板和事件监听器
      if (panelRef.current) {
        panelRef.current.element.remove();
        panelRef.current = null;
      }
      
      if (resizeHandlerRef.current) {
        [window, window.parent].forEach(win => {
          try {
            win?.removeEventListener('resize', resizeHandlerRef.current!);
          } catch {}
        });
        resizeHandlerRef.current = null;
      }
      
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch {}
        resizeObserverRef.current = null;
      }
      
      if (themeWatcherRef.current) {
        try {
          themeWatcherRef.current();
        } catch {}
        themeWatcherRef.current = null;
      }
    };

    // 创建翻译按钮
    const createButton = (doc: Document, onClick: (willEnable: boolean) => void, isActive: boolean = false): HTMLElement => {
      const button = doc.createElement("a");
      button.className = "button pdf-translator-toggle-btn";
      button.title = "Text Translator";
      
      button.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        <path d="M2 12h20"></path>
      </svg>`;

      button.classList.toggle("is-active", isActive);
      
      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const currentState = stateRef.current.isEnabled;
        const willEnable = !currentState;

        onClick(willEnable);
      };

      return button;
    };
    
    // 同步按钮状态
    const syncButtonStates = (isEnabled: boolean) => {
      const selector = SELECTORS.TRANSLATOR_BUTTON;
      getAllDocuments().forEach(doc => {
        doc.querySelectorAll<HTMLElement>(selector).forEach(btn => {
          btn.classList.toggle("is-active", isEnabled);
        });
      });
    };
    syncButtonStatesRef.current = syncButtonStates;

    // 添加翻译按钮
    const addTranslationButton = (doc: Document) => {
      if (doc.querySelector(SELECTORS.TRANSLATOR_BUTTON)) return false;

      const savedState = stateRef.current;
      // 默认不启用，只有在有保存的状态时才自动恢复
      const shouldEnable = savedState.isEnabled && savedState.panelPosition !== undefined;
      
      const toolbar = doc.querySelector(SELECTORS.PDF_TOOLBAR_BUTTONS);
      if (!toolbar) return false;
      
      const button = createButton(doc, (willEnable) => {
        if (willEnable) {
          let targetDoc: Document = doc;
          let pdfContainer = doc.querySelector(SELECTORS.PDF_VIEWER);
          
          if (!pdfContainer) {
            targetDoc = getTargetDocument();
            pdfContainer = targetDoc.querySelector(SELECTORS.PDF_VIEWER);
            
            if (!pdfContainer) {
              showNotification("PDF 未加载或已关闭", "error");
              syncButtonStates(false);
              return;
            }
          }

          const restoreFromState = savedState.isEnabled && savedState.panelPosition !== undefined;
          const success = enableTranslator(restoreFromState, targetDoc);
          
          if (success) {
            showNotification("划词翻译已启用");
            syncButtonStates(true);
          } else {
            showNotification("启用翻译失败", "error");
            syncButtonStates(false);
          }
        } else {
          disableTranslator(false);
          showNotification("划词翻译已关闭");
          syncButtonStates(false);
        }
      }, shouldEnable);
      
      toolbar.insertBefore(button, toolbar.firstChild);
      
      // 只有在有保存的状态时才自动恢复
      if (shouldEnable) {
        const delay = isSystemWindow(doc) ? 1000 : 200;

        setTimeout(() => {
          const pdfViewer = doc.querySelector(SELECTORS.PDF_VIEWER);
          const existingPanel = doc.querySelector('.pdf-translator-panel');

          if (existingPanel) {
            syncButtonStates(true);
            return;
          }

          if (!pdfViewer) {
            // 单次重试
            setTimeout(() => {
              const restoreFromState = savedState.isEnabled && savedState.panelPosition !== undefined;
              if (enableTranslator(restoreFromState, doc)) {
                syncButtonStates(true);
              } else {
                syncButtonStates(false);
              }
            }, 500);
            return;
          }

          const restoreFromState = savedState.isEnabled && savedState.panelPosition !== undefined;
          if (enableTranslator(restoreFromState, doc)) {
            syncButtonStates(true);
          } else {
            syncButtonStates(false);
          }
        }, delay);
      }
      
      return true;
    };

    // 初始化外部窗口管理器
    const initExternalWindow = () => {
      const externalWindowManager = new ExternalWindow(
        (doc: Document) => {
          injectSystemWindowStyles(doc);
        },
        (doc: Document) => {
          if (!doc.querySelector(SELECTORS.TRANSLATOR_BUTTON)) {
            addTranslationButton(doc);
          }
        }
      );

      const checkExternalWindow = () => {
        externalWindowManager.checkAndInitialize().catch(() => {});
      };
      
      checkExternalWindow();
      const interval = setInterval(checkExternalWindow, 500);
      systemWindowCheckIntervalRef.current = interval;
    };
    
    initExternalWindow();
    
    const checkAndInitialize = () => {
      const allDocs = getAllDocuments();
      const docsWithPDF = allDocs.filter(doc => doc.querySelector(SELECTORS.PDF_VIEWER));
      
      docsWithPDF.forEach(doc => {
        if (!doc.querySelector(SELECTORS.TRANSLATOR_BUTTON)) {
          if (isSystemWindow(doc)) injectSystemWindowStyles(doc);
          addTranslationButton(doc);
        }
      });
      
      if (docsWithPDF.length === 0) {
        syncButtonStates(false);
      }
    };

    // 检测 PDF 查看器是否被移除
    const checkPDFViewerRemoved = (mutations: MutationRecord[]): boolean => {
      return mutations.some(mutation => {
        if (mutation.type === 'childList') {
          return Array.from(mutation.removedNodes).some(node => 
            containsPDFContainer(node, SELECTORS.PDF_CONTAINER)
          );
        }
        return false;
      });
    };

    // 创建文档观察器
    const debouncedCheckAndInitialize = debounce(checkAndInitialize, 200);
    
    const createDocumentObserver = (doc: Document): MutationObserver => {
      return new MutationObserver((mutations) => {
        const pdfViewerRemoved = checkPDFViewerRemoved(mutations);
        
        if (pdfViewerRemoved) {
          if (stateRef.current.isEnabled) {
            saveState();
          }
          setTimeout(() => disableTranslator(true), 100);
          return;
        }
        
        // 使用防抖，避免频繁触发
        debouncedCheckAndInitialize();
      });
    };

    // 设置观察器
    const setupObserver = () => {
      const observers: MutationObserver[] = [];
      const observerConfig = { 
        attributes: true, 
        attributeFilter: ["class"],
        childList: true,
        subtree: true
      };
      
      if (document.body) {
        const observer = createDocumentObserver(document);
        observer.observe(document.body, observerConfig);
        observers.push(observer);
      }
      
      try {
        if (window.parent !== window && window.parent.document.body) {
          const observer = createDocumentObserver(window.parent.document);
          observer.observe(window.parent.document.body, observerConfig);
          observers.push(observer);
        }
      } catch {}
      
      observerRef.current = {
        disconnect: () => observers.forEach(obs => obs.disconnect())
      } as MutationObserver;
      
      window.addEventListener('beforeunload', () => {
        if (stateRef.current.isEnabled) saveState();
      });
      
      checkAndInitialize();
    };

    const timeoutId = setTimeout(setupObserver, 200);
    
    checkAndInitialize();

    // 清理函数
    return () => {
      clearTimeout(timeoutId);
      if (systemWindowCheckIntervalRef.current) {
        clearInterval(systemWindowCheckIntervalRef.current);
      }
      observerRef.current?.disconnect();
      disableTranslator(false);
      window.removeEventListener('pdf-translator-translate', handleTranslateEvent);
      try {
        const targetDoc = getTargetDocument();
        targetDoc.querySelector(SELECTORS.TRANSLATOR_BUTTON)?.remove();
      } catch {}
    };
  }, []);

  return null;
}

export default App;
