export const PANEL_STYLES = `
  .pdf-translator-panel {
    position: fixed !important;
    z-index: 999999 !important;
    display: flex !important;
    flex-direction: column;
    overflow: hidden;
    transform: translateZ(0);
    will-change: transform;
    pointer-events: auto !important;
    min-width: 200px !important;
    min-height: 100px !important;
    box-sizing: border-box;
    background: var(--ls-primary-background-color, #ffffff);
    border: 2px solid var(--ls-border-color, #ccc);
    border-radius: var(--ls-border-radius-medium, 12px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    color: var(--ls-primary-text-color, #433f38);
  }

  .pdf-translator-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 48px;
    padding: 0 12px;
    cursor: move;
    user-select: none;
    flex-shrink: 0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    background: var(--ls-secondary-background-color, #f7f7f7);
    border-bottom: 1px solid var(--ls-border-color, #ccc);
  }
  
  .pdf-translator-panel-header:active {
    cursor: grabbing;
  }

  .pdf-translator-panel-title {
    font-size: 16px;
    font-weight: 700;
    opacity: 0.9;
    letter-spacing: 0.3px;
    line-height: 48px;
    color: var(--ls-primary-text-color, #433f38);
  }

  .pdf-translator-font-size-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    background: var(--ls-tertiary-background-color);
    border-radius: 6px;
    border: 1px solid var(--ls-border-color);
  }

  .pdf-translator-font-size-btn {
    background: var(--ls-secondary-background-color);
    border: 1px solid var(--ls-border-color);
    color: var(--ls-secondary-text-color);
    cursor: pointer;
    padding: 3px 7px;
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    border-radius: 4px;
    transition: all 0.15s ease;
    user-select: none;
    min-width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pdf-translator-font-size-btn:hover {
    background: var(--ls-primary-background-color);
    color: var(--ls-link-text-color);
    border-color: var(--ls-link-text-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .pdf-translator-font-size-btn:active {
    transform: scale(0.92);
    box-shadow: none;
  }

  .pdf-translator-font-size-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--ls-primary-text-color);
    opacity: 0.8;
    min-width: 32px;
    text-align: center;
  }

  .pdf-translator-panel-content {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.7;
    min-height: 0;
    background: var(--ls-primary-background-color, #ffffff);
    color: var(--ls-primary-text-color, #433f38);
  }
  
  .pdf-translator-panel-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .pdf-translator-panel-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .pdf-translator-panel-content::-webkit-scrollbar-thumb {
    background: var(--ls-scrollbar-foreground-color);
    border-radius: 3px;
  }

  .pdf-translator-panel-resizer {
    position: absolute;
    right: 0;
    top: 0;
    width: 12px;
    height: 12px;
    cursor: nesw-resize;
    opacity: 0.4;
    transition: all 0.2s ease;
    border-radius: 0 10px 0 6px;
    background: var(--ls-tertiary-background-color);
    border-left: 1px solid var(--ls-border-color);
    border-bottom: 1px solid var(--ls-border-color);
  }
  
  .pdf-translator-panel-resizer::after {
    content: '';
    position: absolute;
    right: 2px;
    top: 2px;
    width: 6px;
    height: 6px;
    border-right: 1.5px solid var(--ls-link-text-color);
    border-top: 1.5px solid var(--ls-link-text-color);
    opacity: 0.7;
    border-radius: 0.5px;
  }
  
  .pdf-translator-panel:hover .pdf-translator-panel-resizer {
    opacity: 0.9;
    background: var(--ls-secondary-background-color);
  }
  
  .pdf-translator-panel-resizer:hover::after {
    opacity: 1;
    border-color: var(--ls-link-text-color);
  }

  .pdf-translator-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ls-secondary-text-color);
    font-size: 12px;
    padding: 12px;
    background: var(--ls-tertiary-background-color);
    border-radius: 12px;
    border: 1px solid var(--ls-border-color);
  }

  .pdf-translator-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid var(--ls-border-color, #e5e7eb);
    border-top-color: var(--ls-link-text-color, #3b82f6);
    border-radius: 50%;
    animation: pdf-translator-spin 0.6s linear infinite;
  }

  @keyframes pdf-translator-spin {
    to { transform: rotate(360deg); }
  }

  .pdf-translator-text {
    color: var(--ls-primary-text-color);
    line-height: 1.8;
    word-wrap: break-word;
    white-space: pre-wrap;
    padding: 12px;
    background: var(--ls-tertiary-background-color);
    border-radius: 12px;
    border: 1px solid var(--ls-border-color);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.04), inset 0 1px 2px 0 rgba(255, 255, 255, 0.05);
  }

  .pdf-translator-error {
    color: var(--ls-error-text-color);
    font-size: 12px;
    padding: 12px;
    background: var(--ls-error-background-color, rgba(239, 68, 68, 0.05));
    border-radius: 12px;
    border: 1px solid var(--ls-error-text-color, #ef4444);
  }

  /* 翻译按钮样式 */
  .pdf-translator-toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    cursor: pointer;
    border-radius: var(--ls-border-radius-small, 4px);
    transition: all 0.2s ease;
    color: var(--ls-primary-text-color, #333);
  }
  
  .pdf-translator-toggle-btn:hover {
    background: var(--ls-quaternary-background-color, rgba(0, 0, 0, 0.05));
  }
  
  .pdf-translator-toggle-btn.is-active {
    background: var(--ls-link-text-color, #0066cc);
    color: #fff;
  }
  
  .pdf-translator-toggle-btn.is-active:hover {
    background: var(--ls-link-text-hover-color, #0052a3);
  }
`;
