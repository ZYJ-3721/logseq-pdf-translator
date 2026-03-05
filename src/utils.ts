import { SELECTORS, SYSTEM_WINDOW_CLASS } from './configs';
import type { LogseqPDFViewer } from './types';

// 获取活动的 PDF 查看器
export function getActivePDFViewer(): LogseqPDFViewer | null {
  try {
    return (window as any).lsActivePdfViewer || 
           (window.parent as any)?.lsActivePdfViewer || 
           null;
  } catch {
    return null;
  }
}

// 获取查看器所属的文档
export function resolveOwnDocument(viewer: LogseqPDFViewer | null): Document | null {
  return viewer?.viewer?.ownerDocument || null;
}

// 检查文档是否是系统窗口
export function isSystemWindow(doc: Document): boolean {
  return doc.documentElement.classList.contains(SYSTEM_WINDOW_CLASS);
}

// 获取所有相关文档（去重）
export function getAllDocuments(): Document[] {
  const docs: Document[] = [document];
  
  try {
    const parentDoc = window.parent?.document;
    if (parentDoc && window.parent !== window && !docs.includes(parentDoc)) {
      docs.push(parentDoc);
    }
  } catch {}
  
  try {
    const viewerDoc = resolveOwnDocument(getActivePDFViewer());
    if (viewerDoc && !docs.includes(viewerDoc)) {
      docs.push(viewerDoc);
    }
  } catch {}
  
  return docs;
}

// 获取目标文档，优先级: 活动查看器文档 > 父窗口文档 > 当前文档
export function getTargetDocument(): Document {
  // 1. 从活动查看器获取
  const viewerDoc = resolveOwnDocument(getActivePDFViewer());
  if (viewerDoc) return viewerDoc;
  
  // 2. 检查父窗口
  try {
    const parentDoc = window.parent?.document;
    if (parentDoc && parentDoc !== document && parentDoc.querySelector(SELECTORS.PDF_VIEWER)) {
      return parentDoc;
    }
  } catch {}
  
  // 3. 使用当前文档
  return document;
}

// 预处理 PDF 文本，处理 PDF 文本中的换行和连字符
export function preprocessPDFText(text: string): string {
  if (!text?.trim()) return '';
  
  const separator = '|#|';
  return text
    .replace(/[\r\n]+/g, separator)
    .replace(new RegExp(`-${separator}`, 'g'), '')
    .replace(/\|#\|([a-zA-Z_])/g, ' $1')
    .replace(/\|#\|/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// HTML 转义
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// 显示通知
export function showNotification(message: string, type: 'success' | 'error' = 'success'): void {
  try {
    (window as any).logseq?.UI?.showMsg?.(message, type);
  } catch {}
}

// 获取主窗口文档，优先级: opener > parent > current
export function getMainDocument(): Document {
  try {
    if (window.opener && window.opener !== window) {
      return window.opener.document;
    }
  } catch {}
  
  try {
    if (window.parent && window.parent !== window) {
      return window.parent.document;
    }
  } catch {}
  
  return document;
}

// 同步主题属性到目标文档
export function syncThemeAttributes(targetDoc: Document): void {
  try {
    const mainDoc = getMainDocument();
    const mainRoot = mainDoc.documentElement;
    const targetRoot = targetDoc.documentElement;

    // 同步 data-theme 和 data-color
    ['data-theme', 'data-color'].forEach(attr => {
      const value = mainRoot.getAttribute(attr);
      if (value) {
        targetRoot.setAttribute(attr, value);
      }
    });

    // 清除旧的主题相关 class
    const targetClasses = Array.from(targetRoot.classList) as string[];
    targetClasses
      .filter(cls => cls.includes('theme') || cls.includes('dark') || cls.includes('light'))
      .forEach(cls => targetRoot.classList.remove(cls));

    // 同步主题相关的 class
    const mainClasses = Array.from(mainRoot.classList) as string[];
    mainClasses
      .filter(cls => cls.includes('theme') || cls.includes('dark') || cls.includes('light'))
      .forEach(cls => targetRoot.classList.add(cls));
  } catch {}
}

/**
 * 创建主题监听器
 * @param callback 主题变化时的回调函数
 * @returns 清理函数
 */
export function createThemeObserver(callback: () => void): () => void {
  try {
    const mainDoc = getMainDocument();
    const observer = new MutationObserver(callback);
    observer.observe(mainDoc.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-color', 'class']
    });
    return () => observer.disconnect();
  } catch {
    return () => {};
  }
}

// 检测节点是否包含 PDF 容器
export function containsPDFContainer(node: Node, selector: string): boolean {
  if (!(node instanceof HTMLElement)) return false;
  return node.matches?.(selector) || !!node.querySelector?.(selector);
}
