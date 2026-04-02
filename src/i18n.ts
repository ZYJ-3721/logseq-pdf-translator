export const SUPPORTED_LOCALES = ["en", "zh-TW", "zh-CN"] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const UI_LANGUAGE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
};

export const HORIZONTAL_POSITION_KEYS = ["left", "right"] as const;
export const VERTICAL_POSITION_KEYS = ["top", "bottom"] as const;

export type HorizontalPosition = typeof HORIZONTAL_POSITION_KEYS[number];
export type VerticalPosition = typeof VERTICAL_POSITION_KEYS[number];

const UI_LANGUAGE_LABEL_TO_LOCALE: Record<string, SupportedLocale> = {
  en: "en",
  english: "en",
  English: "en",
  "zh_tw": "zh-TW",
  "zh-TW": "zh-TW",
  "zh-Hant": "zh-TW",
  "繁体中文": "zh-TW",
  "繁體中文": "zh-TW",
  "簡體中文": "zh-CN",
  "简体中文": "zh-CN",
  "zh-Hans": "zh-CN",
  "zh-CN": "zh-CN",
  "zh_cn": "zh-CN",
};

type Dictionary = {
  settings: {
    language: {
      title: string;
      description: string;
    };
    translationService: {
      title: string;
      description: string;
    };
    targetLanguage: {
      title: string;
    };
    apiKey: {
      title: string;
    };
    panelHorizontalPosition: {
      title: string;
      description: string;
    };
    panelVerticalPosition: {
      title: string;
      description: string;
    };
    panelHorizontalMargin: {
      title: string;
      description: string;
    };
    panelVerticalMargin: {
      title: string;
      description: string;
    };
    panelWidthRatio: {
      title: string;
      description: string;
    };
    panelHeightRatio: {
      title: string;
      description: string;
    };
  };
  translationServices: {
    google: string;
    baidu: string;
    youdao: string;
  };
  positions: {
    left: string;
    right: string;
    top: string;
    bottom: string;
  };
  targetLanguageDescriptions: {
    google: string;
    baidu: string;
    youdao: string;
  };
  apiKeyDescriptions: {
    google: string;
    baidu: string;
    youdao: string;
  };
  menu: {
    translate: string;
  };
  panel: {
    placeholder: string;
    title: string;
    decreaseFont: string;
    increaseFont: string;
    loading: string;
    buttonTitle: string;
  };
  notifications: {
    translatorEnabled: string;
    translatorDisabled: string;
    translatorEnableFailed: string;
    pdfViewerNotFound: string;
  };
  errors: {
    emptyText: string;
    baiduMissingApiKey: string;
    baiduInvalidApiKey: string;
    youdaoMissingApiKey: string;
    youdaoInvalidApiKey: string;
    unknownTranslationError: string;
    translationFailedPrefix: string;
    requestFailed: string;
    invalidTranslationResult: string;
    networkRequestFailed: string;
    baiduApiErrorPrefix: string;
    youdaoApiErrorPrefix: string;
  };
};

const DICTIONARIES: Record<SupportedLocale, Dictionary> = {
  en: {
    settings: {
      language: {
        title: "Interface Language",
        description: "Set the plugin UI and message language.",
      },
      translationService: {
        title: "Translation Service",
        description: "Choose the translation service to use.",
      },
      targetLanguage: {
        title: "Target Language",
      },
      apiKey: {
        title: "API Key",
      },
      panelHorizontalPosition: {
        title: "Panel Horizontal Position",
        description: "Choose whether the translation panel appears on the left or right side of the PDF viewer.",
      },
      panelVerticalPosition: {
        title: "Panel Vertical Position",
        description: "Choose whether the translation panel appears at the top or bottom of the PDF viewer.",
      },
      panelHorizontalMargin: {
        title: "Panel Horizontal Margin",
        description: "Set the distance between the translation panel and the left or right edge of the PDF viewer.",
      },
      panelVerticalMargin: {
        title: "Panel Vertical Margin",
        description: "Set the distance between the translation panel and the top or bottom edge of the PDF viewer.",
      },
      panelWidthRatio: {
        title: "Panel Width Ratio",
        description: "Set the panel width as a ratio of the PDF area width, from 0.1 to 1.0.",
      },
      panelHeightRatio: {
        title: "Panel Height Ratio",
        description: "Set the panel height as a ratio of the PDF area height, from 0.1 to 1.0.",
      },
    },
    translationServices: {
      google: "Google",
      baidu: "Baidu🔐",
      youdao: "Youdao🔐",
    },
    positions: {
      left: "Left",
      right: "Right",
      top: "Top",
      bottom: "Bottom",
    },
    targetLanguageDescriptions: {
      google: "Enter a target language code such as zh-CN. See https://docs.cloud.google.com/translate/docs/languages",
      baidu: "Enter a target language code such as zh. For domain translation, use \"languageCode&domain\".\n\nSee https://fanyi-api.baidu.com/product/113 and https://fanyi-api.baidu.com/product/123",
      youdao: "Enter a target language code such as zh-CHS. For domain translation, use \"languageCode&domain\".\n\nSee https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html",
    },
    apiKeyDescriptions: {
      google: "The Google free endpoint does not require an API key.",
      baidu: "Enter APP ID and secret in the format APP ID&secret. See https://fanyi-api.baidu.com/manage/developer",
      youdao: "Enter app ID and app secret in the format app ID&app secret. See https://ai.youdao.com/console",
    },
    menu: {
      translate: "Translate",
    },
    panel: {
      placeholder: "Select text in the PDF to show the translation here.",
      title: "Translation",
      decreaseFont: "Decrease font size",
      increaseFont: "Increase font size",
      loading: "Translating...",
      buttonTitle: "PDF Translator",
    },
    notifications: {
      translatorEnabled: "PDF translator enabled.",
      translatorDisabled: "PDF translator disabled.",
      translatorEnableFailed: "Failed to enable PDF translator.",
      pdfViewerNotFound: "PDF viewer not found.",
    },
    errors: {
      emptyText: "No text to translate.",
      baiduMissingApiKey: "Set the Baidu APP ID and secret in settings first.",
      baiduInvalidApiKey: "Invalid Baidu API key format. Use APP ID&secret.",
      youdaoMissingApiKey: "Set the Youdao app ID and app secret in settings first.",
      youdaoInvalidApiKey: "Invalid Youdao API key format. Use app ID&app secret.",
      unknownTranslationError: "Unknown translation error",
      translationFailedPrefix: "Translation failed: {message}",
      requestFailed: "Request failed: {status}",
      invalidTranslationResult: "Invalid translation result.",
      networkRequestFailed: "Network request failed. Check your connection and try again.",
      baiduApiErrorPrefix: "Baidu translation error {code}: {message}",
      youdaoApiErrorPrefix: "Youdao translation error {code}",
    },
  },
  "zh-TW": {
    settings: {
      language: {
        title: "介面語言",
        description: "設定外掛介面與訊息顯示語言。",
      },
      translationService: {
        title: "翻譯服務",
        description: "選擇要使用的翻譯服務。",
      },
      targetLanguage: {
        title: "目標語言",
      },
      apiKey: {
        title: "API Key",
      },
      panelHorizontalPosition: {
        title: "面板水平位置",
        description: "設定翻譯面板顯示在 PDF 檢視區的左側或右側。",
      },
      panelVerticalPosition: {
        title: "面板垂直位置",
        description: "設定翻譯面板顯示在 PDF 檢視區的頂部或底部。",
      },
      panelHorizontalMargin: {
        title: "面板水平邊距",
        description: "設定翻譯面板與 PDF 左右邊界之間的距離。",
      },
      panelVerticalMargin: {
        title: "面板垂直邊距",
        description: "設定翻譯面板與 PDF 上下邊界之間的距離。",
      },
      panelWidthRatio: {
        title: "面板寬度比例",
        description: "設定翻譯面板寬度相對於 PDF 區域寬度的比例，範圍 0.1 到 1.0。",
      },
      panelHeightRatio: {
        title: "面板高度比例",
        description: "設定翻譯面板高度相對於 PDF 區域高度的比例，範圍 0.1 到 1.0。",
      },
    },
    translationServices: {
      google: "Google",
      baidu: "百度🔐",
      youdao: "有道🔐",
    },
    positions: {
      left: "左側",
      right: "右側",
      top: "頂部",
      bottom: "底部",
    },
    targetLanguageDescriptions: {
      google: "請輸入目標語言代碼，例如 zh-CN。見：https://docs.cloud.google.com/translate/docs/languages",
      baidu: "請輸入目標語言代碼，例如 zh。若要使用領域翻譯，請輸入「語言代碼&領域」，\n\n見：https://fanyi-api.baidu.com/product/113 與 https://fanyi-api.baidu.com/product/123",
      youdao: "請輸入目標語言代碼，例如 zh-CHS。若要使用領域翻譯，請輸入「語言代碼&領域」，\n\n見：https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html",
    },
    apiKeyDescriptions: {
      google: "Google 免費介面不需要 API Key。",
      baidu: "請輸入 APP ID 與密鑰，格式為 APP ID&密鑰。見：https://fanyi-api.baidu.com/manage/developer",
      youdao: "請輸入應用 ID 與應用密鑰，格式為應用 ID&應用密鑰。見：https://ai.youdao.com/console",
    },
    menu: {
      translate: "翻譯",
    },
    panel: {
      placeholder: "選取 PDF 文字後會在這裡顯示翻譯結果。",
      title: "翻譯結果",
      decreaseFont: "縮小字體",
      increaseFont: "放大字體",
      loading: "翻譯中...",
      buttonTitle: "PDF 翻譯器",
    },
    notifications: {
      translatorEnabled: "已啟用 PDF 翻譯器。",
      translatorDisabled: "已停用 PDF 翻譯器。",
      translatorEnableFailed: "啟用 PDF 翻譯器失敗。",
      pdfViewerNotFound: "找不到 PDF 檢視器。",
    },
    errors: {
      emptyText: "沒有可翻譯的文字。",
      baiduMissingApiKey: "請先在設定中填入百度翻譯的 APP ID 與密鑰。",
      baiduInvalidApiKey: "百度翻譯 API Key 格式錯誤，請使用 APP ID&密鑰。",
      youdaoMissingApiKey: "請先在設定中填入有道翻譯的應用 ID 與應用密鑰。",
      youdaoInvalidApiKey: "有道翻譯 API Key 格式錯誤，請使用 應用 ID&應用密鑰。",
      unknownTranslationError: "未知翻譯錯誤",
      translationFailedPrefix: "翻譯失敗: {message}",
      requestFailed: "請求失敗: {status}",
      invalidTranslationResult: "翻譯結果格式不正確。",
      networkRequestFailed: "網路請求失敗，請檢查連線後再試。",
      baiduApiErrorPrefix: "百度翻譯錯誤 {code}: {message}",
      youdaoApiErrorPrefix: "有道翻譯錯誤 {code}",
    },
  },
  "zh-CN": {
    settings: {
      language: {
        title: "界面语言",
        description: "设置插件界面与消息的显示语言。",
      },
      translationService: {
        title: "翻译服务",
        description: "选择要使用的翻译服务。",
      },
      targetLanguage: {
        title: "目标语言",
      },
      apiKey: {
        title: "API Key",
      },
      panelHorizontalPosition: {
        title: "面板水平位置",
        description: "设置翻译面板显示在 PDF 视图区的左侧或右侧。",
      },
      panelVerticalPosition: {
        title: "面板垂直位置",
        description: "设置翻译面板显示在 PDF 视图区的顶部或底部。",
      },
      panelHorizontalMargin: {
        title: "面板水平边距",
        description: "设置翻译面板与 PDF 左右边界之间的距离。",
      },
      panelVerticalMargin: {
        title: "面板垂直边距",
        description: "设置翻译面板与 PDF 上下边界之间的距离。",
      },
      panelWidthRatio: {
        title: "面板宽度比例",
        description: "设置翻译面板宽度相对 PDF 区域宽度的比例，范围 0.1 到 1.0。",
      },
      panelHeightRatio: {
        title: "面板高度比例",
        description: "设置翻译面板高度相对 PDF 区域高度的比例，范围 0.1 到 1.0。",
      },
    },
    translationServices: {
      google: "Google",
      baidu: "百度🔐",
      youdao: "有道🔐",
    },
    positions: {
      left: "左侧",
      right: "右侧",
      top: "顶部",
      bottom: "底部",
    },
    targetLanguageDescriptions: {
      google: "请输入目标语言代码，例如 zh-CN。见：https://docs.cloud.google.com/translate/docs/languages",
      baidu: "请输入目标语言代码，例如 zh。若要使用领域翻译，请输入“语言代码&领域”，\n\n见：https://fanyi-api.baidu.com/product/113 与 https://fanyi-api.baidu.com/product/123",
      youdao: "请输入目标语言代码，例如 zh-CHS。若要使用领域翻译，请输入“语言代码&领域”，\n\n见：https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html",
    },
    apiKeyDescriptions: {
      google: "Google 免费接口不需要 API Key。",
      baidu: "请输入 APP ID 与密钥，格式为 APP ID&密钥。见：https://fanyi-api.baidu.com/manage/developer",
      youdao: "请输入应用 ID 与应用密钥，格式为应用 ID&应用密钥。见：https://ai.youdao.com/console",
    },
    menu: {
      translate: "翻译",
    },
    panel: {
      placeholder: "选中 PDF 文本后会在这里显示翻译结果。",
      title: "翻译结果",
      decreaseFont: "缩小字体",
      increaseFont: "放大字体",
      loading: "翻译中...",
      buttonTitle: "PDF 翻译器",
    },
    notifications: {
      translatorEnabled: "已启用 PDF 翻译器。",
      translatorDisabled: "已停用 PDF 翻译器。",
      translatorEnableFailed: "启用 PDF 翻译器失败。",
      pdfViewerNotFound: "找不到 PDF 查看器。",
    },
    errors: {
      emptyText: "没有可翻译的文本。",
      baiduMissingApiKey: "请先在设置中填写百度翻译的 APP ID 与密钥。",
      baiduInvalidApiKey: "百度翻译 API Key 格式错误，请使用 APP ID&密钥。",
      youdaoMissingApiKey: "请先在设置中填写有道翻译的应用 ID 与应用密钥。",
      youdaoInvalidApiKey: "有道翻译 API Key 格式错误，请使用 应用 ID&应用密钥。",
      unknownTranslationError: "未知翻译错误",
      translationFailedPrefix: "翻译失败: {message}",
      requestFailed: "请求失败: {status}",
      invalidTranslationResult: "翻译结果格式不正确。",
      networkRequestFailed: "网络请求失败，请检查连接后重试。",
      baiduApiErrorPrefix: "百度翻译错误 {code}: {message}",
      youdaoApiErrorPrefix: "有道翻译错误 {code}",
    },
  },
};

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

export function normalizeLocale(value?: string | null): SupportedLocale {
  if (!value) return detectLocale();
  return UI_LANGUAGE_LABEL_TO_LOCALE[value] ?? detectLocale(value);
}

export function detectLocale(input?: string | null): SupportedLocale {
  const source = input ?? (
    (window as any).logseq?.settings?.pluginLanguage ||
    navigator.language ||
    "en"
  );
  const normalized = String(source).toLowerCase();
  if (normalized.startsWith("zh-tw") || normalized.startsWith("zh-hk") || normalized.startsWith("zh-mo") || normalized.includes("hant")) {
    return "zh-TW";
  }
  if (normalized.startsWith("zh")) {
    return "zh-CN";
  }
  return "en";
}

export function getCurrentLocale(): SupportedLocale {
  return normalizeLocale((window as any).logseq?.settings?.pluginLanguage);
}

export function getLocaleDictionary(locale = getCurrentLocale()): Dictionary {
  return DICTIONARIES[locale];
}

export function getLanguageOptions(): string[] {
  return SUPPORTED_LOCALES.map((locale) => UI_LANGUAGE_LABELS[locale]);
}

export function getLanguageLabel(locale: SupportedLocale): string {
  return UI_LANGUAGE_LABELS[locale];
}

export function getHorizontalPositionLabel(
  position: HorizontalPosition,
  locale = getCurrentLocale(),
): string {
  return DICTIONARIES[locale].positions[position];
}

export function getVerticalPositionLabel(
  position: VerticalPosition,
  locale = getCurrentLocale(),
): string {
  return DICTIONARIES[locale].positions[position];
}

export function getHorizontalPositionOptions(locale = getCurrentLocale()): string[] {
  return HORIZONTAL_POSITION_KEYS.map((position) => getHorizontalPositionLabel(position, locale));
}

export function getVerticalPositionOptions(locale = getCurrentLocale()): string[] {
  return VERTICAL_POSITION_KEYS.map((position) => getVerticalPositionLabel(position, locale));
}

export function normalizeHorizontalPosition(value?: string | null): HorizontalPosition {
  if (!value) return "left";
  if (value === "left" || value === "right") return value;
  for (const locale of SUPPORTED_LOCALES) {
    if (DICTIONARIES[locale].positions.left === value) return "left";
    if (DICTIONARIES[locale].positions.right === value) return "right";
  }
  if (value === "撌虫儒") return "left";
  if (value === "?喃儒") return "right";
  return "left";
}

export function normalizeVerticalPosition(value?: string | null): VerticalPosition {
  if (!value) return "bottom";
  if (value === "top" || value === "bottom") return value;
  for (const locale of SUPPORTED_LOCALES) {
    if (DICTIONARIES[locale].positions.top === value) return "top";
    if (DICTIONARIES[locale].positions.bottom === value) return "bottom";
  }
  if (value === "憿園") return "top";
  if (value === "摨") return "bottom";
  return "bottom";
}

export function t(path: string, params?: Record<string, string | number>, locale = getCurrentLocale()): string {
  const segments = path.split(".");
  let current: any = DICTIONARIES[locale];
  for (const segment of segments) {
    current = current?.[segment];
  }
  return typeof current === "string" ? interpolate(current, params) : "";
}
