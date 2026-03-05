import "@logseq/libs";
import App from "./App";
import React from "react";
import { PANEL_STYLES } from "./styles";
import * as ReactDOM from "react-dom/client";
import { TRANSLATION_SERVICES, TranslationService } from "./translators/index";


const TARGET_LANGUAGE: Record<TranslationService, string> = {
  "Google": "zh-CN",
  "百度🔐": "zh",
  "有道🔐": "zh-CHS",
};

const TARGET_LANGUAGE_DESCRIPTION: Record<TranslationService, string> = {
  "Google": "目标语言代码，zh-CN等（见：https://docs.cloud.google.com/translate/docs/languages ）",
  "百度🔐": "目标语言代码，zh等（见：https://fanyi-api.baidu.com/product/113 ）\n\n目标语言代码&翻译领域类型（见：https://fanyi-api.baidu.com/product/123 ）",
  "有道🔐": "目标语言代码，zh-CHS等（见：https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html ）\n\n目标语言代码&翻译领域类型（见：https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html ）",
};

const API_KEY_DESCRIPTION: Record<TranslationService, string> = {
  "Google": "不需要",
  "百度🔐": "APP ID&密钥 （见：https://fanyi-api.baidu.com/manage/developer ）",
  "有道🔐": "应用ID&应用秘钥（见：https://ai.youdao.com/console ）",
};

// 动态生成设置架构
function getSettingsSchema(service: TranslationService) {
  return [
    {
      key: "translationService",
      type: "enum" as const,
      title: "翻译服务",
      description: "翻译服务商",
      enumChoices: [...TRANSLATION_SERVICES],
      default: "Google",
    },
    {
      key: "targetLanguage",
      type: "string" as const,
      title: "目标语言",
      description: TARGET_LANGUAGE_DESCRIPTION[service],
      default: "",
    },
    {
      key: "apiKey",
      type: "string" as const,
      title: "API Key",
      description: API_KEY_DESCRIPTION[service],
      default: "",
    },
    {
      key: "panelHorizontalPosition",
      type: "enum" as const,
      title: "翻译框水平位置",
      description: "翻译框的初始位置是在左侧还是右侧",
      enumChoices: ["左侧", "右侧"],
      default: "左侧",
    },
    {
      key: "panelVerticalPosition",
      type: "enum" as const,
      title: "翻译框垂直位置",
      description: "翻译框的初始位置是在顶部还是底部",
      enumChoices: ["顶部", "底部"],
      default: "底部",
    },
    {
      key: "panelHorizontalMargin",
      type: "number" as const,
      title: "翻译框水平边距",
      description: "翻译框距离 PDF 查看器左侧或右侧的距离",
      default: 0,
    },
    {
      key: "panelVerticalMargin",
      type: "number" as const,
      title: "翻译框垂直边距",
      description: "翻译框距离 PDF 查看器顶部或底部的距离",
      default: 0,
    },
    {
      key: "panelWidthRatio",
      type: "number" as const,
      title: "翻译框宽度比例",
      description: "翻译框宽度占 PDF 查看器宽度的比例（0.1-1.0）",
      default: 0.5,
    },
    {
      key: "panelHeightRatio",
      type: "number" as const,
      title: "翻译框高度比例",
      description: "翻译框高度占 PDF 查看器高度的比例（0.1-1.0）",
      default: 0.25,
    },
  ];
}

function main() {
  // 初始化设置架构
  const currentService = (logseq.settings?.translationService) as TranslationService;
  logseq.useSettingsSchema(getSettingsSchema(currentService));
  // 监听设置变化，动态更新架构
  logseq.onSettingsChanged((newSettings, oldSettings) => {
    const newService = newSettings.translationService as TranslationService;
    const oldService = oldSettings.translationService as TranslationService;
    // 服务商切换时，更新设置架构
    if (newService !== oldService) {
      logseq.useSettingsSchema(getSettingsSchema(newService));
      logseq.updateSettings({targetLanguage: TARGET_LANGUAGE[newService]})
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
    "翻译",
    async ({ content }) => {
      const event = new CustomEvent("pdf-translator-translate", {
        detail: { text: content?.text || "" },
      });
      window.dispatchEvent(event);
    },
    { clearSelection: false }
  );
}

logseq.ready(main).catch(console.error);
