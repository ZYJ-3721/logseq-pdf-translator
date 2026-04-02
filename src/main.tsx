import "@logseq/libs";
import App from "./App";
import React from "react";
import { PANEL_STYLES } from "./styles";
import * as ReactDOM from "react-dom/client";
import {
  getCurrentLocale,
  getHorizontalPositionLabel,
  getHorizontalPositionOptions,
  getLanguageLabel,
  getLanguageOptions,
  getLocaleDictionary,
  getVerticalPositionLabel,
  getVerticalPositionOptions,
  normalizeHorizontalPosition,
  normalizeLocale,
  normalizeVerticalPosition,
  t,
} from "./i18n";
import {
  getTranslationServiceLabel,
  getTranslationServiceOptions,
  normalizeTranslationService,
  TranslationService,
} from "./translators";

const TARGET_LANGUAGE_DEFAULTS: Record<TranslationService, string> = {
  google: "zh-CN",
  baidu: "zh",
  youdao: "zh-CHS",
};

function getSettingsSchema(locale = getCurrentLocale(), service = normalizeTranslationService((window as any).logseq?.settings?.translationService)) {
  const dict = getLocaleDictionary(locale);

  return [
    {
      key: "pluginLanguage",
      type: "enum" as const,
      title: dict.settings.language.title,
      description: dict.settings.language.description,
      enumChoices: getLanguageOptions(),
      default: getLanguageLabel(locale),
    },
    {
      key: "translationService",
      type: "enum" as const,
      title: dict.settings.translationService.title,
      description: dict.settings.translationService.description,
      enumChoices: getTranslationServiceOptions(locale),
      default: getTranslationServiceLabel(service, locale),
    },
    {
      key: "targetLanguage",
      type: "string" as const,
      title: dict.settings.targetLanguage.title,
      description: dict.targetLanguageDescriptions[service],
      default: "",
    },
    {
      key: "apiKey",
      type: "string" as const,
      title: dict.settings.apiKey.title,
      description: dict.apiKeyDescriptions[service],
      default: "",
    },
    {
      key: "panelHorizontalPosition",
      type: "enum" as const,
      title: dict.settings.panelHorizontalPosition.title,
      description: dict.settings.panelHorizontalPosition.description,
      enumChoices: getHorizontalPositionOptions(locale),
      default: getHorizontalPositionLabel("left", locale),
    },
    {
      key: "panelVerticalPosition",
      type: "enum" as const,
      title: dict.settings.panelVerticalPosition.title,
      description: dict.settings.panelVerticalPosition.description,
      enumChoices: getVerticalPositionOptions(locale),
      default: getVerticalPositionLabel("bottom", locale),
    },
    {
      key: "panelHorizontalMargin",
      type: "number" as const,
      title: dict.settings.panelHorizontalMargin.title,
      description: dict.settings.panelHorizontalMargin.description,
      default: 0,
    },
    {
      key: "panelVerticalMargin",
      type: "number" as const,
      title: dict.settings.panelVerticalMargin.title,
      description: dict.settings.panelVerticalMargin.description,
      default: 0,
    },
    {
      key: "panelWidthRatio",
      type: "number" as const,
      title: dict.settings.panelWidthRatio.title,
      description: dict.settings.panelWidthRatio.description,
      default: 0.5,
    },
    {
      key: "panelHeightRatio",
      type: "number" as const,
      title: dict.settings.panelHeightRatio.title,
      description: dict.settings.panelHeightRatio.description,
      default: 0.25,
    },
  ];
}

function applyLocalizedSettings() {
  const settings = (window as any).logseq?.settings ?? {};
  const locale = normalizeLocale(settings.pluginLanguage);
  const service = normalizeTranslationService(settings.translationService);
  const horizontalPosition = normalizeHorizontalPosition(settings.panelHorizontalPosition);
  const verticalPosition = normalizeVerticalPosition(settings.panelVerticalPosition);

  logseq.useSettingsSchema(getSettingsSchema(locale, service));

  const updates: Record<string, string> = {};
  const localizedLanguage = getLanguageLabel(locale);
  const localizedService = getTranslationServiceLabel(service, locale);
  const localizedHorizontalPosition = getHorizontalPositionLabel(horizontalPosition, locale);
  const localizedVerticalPosition = getVerticalPositionLabel(verticalPosition, locale);

  if (settings.pluginLanguage !== localizedLanguage) {
    updates.pluginLanguage = localizedLanguage;
  }
  if (settings.translationService !== localizedService) {
    updates.translationService = localizedService;
  }
  if (settings.panelHorizontalPosition !== localizedHorizontalPosition) {
    updates.panelHorizontalPosition = localizedHorizontalPosition;
  }
  if (settings.panelVerticalPosition !== localizedVerticalPosition) {
    updates.panelVerticalPosition = localizedVerticalPosition;
  }
  if (!settings.targetLanguage) {
    updates.targetLanguage = TARGET_LANGUAGE_DEFAULTS[service];
  }

  if (Object.keys(updates).length > 0) {
    logseq.updateSettings(updates);
  }
}

function main() {
  // 初始化设置架构
  applyLocalizedSettings();
  // 监听设置变化，动态更新架构
  logseq.onSettingsChanged((newSettings, oldSettings) => {
    const locale = normalizeLocale(newSettings.pluginLanguage);
    const previousLocale = normalizeLocale(oldSettings.pluginLanguage);
    const service = normalizeTranslationService(newSettings.translationService);
    const previousService = normalizeTranslationService(oldSettings.translationService);

    const updates: Record<string, string> = {};

    if (locale !== previousLocale || service !== previousService) {
      logseq.useSettingsSchema(getSettingsSchema(locale, service));
      updates.translationService = getTranslationServiceLabel(service, locale);
      updates.panelHorizontalPosition = getHorizontalPositionLabel(
        normalizeHorizontalPosition(newSettings.panelHorizontalPosition),
        locale,
      );
      updates.panelVerticalPosition = getVerticalPositionLabel(
        normalizeVerticalPosition(newSettings.panelVerticalPosition),
        locale,
      );
      updates.pluginLanguage = getLanguageLabel(locale);
    }
    // 服务商切换时，更新设置架构
    if (service !== previousService) {
      updates.targetLanguage = TARGET_LANGUAGE_DEFAULTS[service];
    }

    if (Object.keys(updates).some((key) => updates[key] !== newSettings[key])) {
      logseq.updateSettings(updates);
    }
  });

  logseq.provideUI({
    key: "pdf-translator-main",
    path: "body",
    template: `<div id="pdf-translator-app"></div>`,
  });

  const initializeApp = (retryCount = 0) => {
    const container = parent.document.getElementById("pdf-translator-app");
    if (!container) {
      if (retryCount < 10) setTimeout(() => initializeApp(retryCount + 1), 100);
      return;
    }
    ReactDOM.createRoot(container).render(<React.StrictMode><App /></React.StrictMode>);
  };

  setTimeout(initializeApp, 100);

  logseq.provideStyle(`
    #pdf-translator-app { display: none; }
    ${PANEL_STYLES}
  `);

  // 注册 PDF 高亮上下文菜单项
  logseq.Editor.registerHighlightContextMenuItem(
    t("menu.translate"),
    async ({ content }) => {
      const event = new CustomEvent("pdf-translator-translate", {
        detail: { text: content?.text || "" },
      });
      window.dispatchEvent(event);
    },
    { clearSelection: false },
  );
}

logseq.ready(main).catch(console.error);
