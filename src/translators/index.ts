import { googleFreeTranslator } from "./google_free";
import { baiduTranslator } from "./baidu";
import { youdaoTranslator } from "./youdao";
import { getCurrentLocale, getLocaleDictionary, SupportedLocale, t } from "../i18n";

export const TRANSLATION_SERVICE_IDS = ["google", "baidu", "youdao"] as const;

export type TranslationService = typeof TRANSLATION_SERVICE_IDS[number];

const LEGACY_SERVICE_VALUE_MAP: Record<string, TranslationService> = {
  Google: "google",
  百度翻譯: "baidu",
  百度翻译: "baidu",
  百度: "baidu",
  有道翻譯: "youdao",
  有道翻译: "youdao",
  有道: "youdao",
  '有道🔐': "youdao",
  "百度🔐": "baidu",
};

function getServices(locale: SupportedLocale) {
  return getLocaleDictionary(locale).translationServices;
}

export function normalizeTranslationService(value?: string | null): TranslationService {
  if (!value) return "google";
  if (TRANSLATION_SERVICE_IDS.includes(value as TranslationService)) {
    return value as TranslationService;
  }
  if (LEGACY_SERVICE_VALUE_MAP[value]) {
    return LEGACY_SERVICE_VALUE_MAP[value];
  }

  for (const locale of ["zh-TW", "zh-CN", "en"] as const) {
    const services = getServices(locale);
    const match = (Object.entries(services) as Array<[TranslationService, string]>)
      .find(([, label]) => label === value);
    if (match) return match[0];
  }

  return "google";
}

export function getTranslationServiceLabel(
  service: TranslationService,
  locale = getCurrentLocale(),
): string {
  return getServices(locale)[service];
}

export function getTranslationServiceOptions(locale = getCurrentLocale()): string[] {
  return TRANSLATION_SERVICE_IDS.map((service) => getTranslationServiceLabel(service, locale));
}

export function translateServiceLabelToId(label?: string | null): TranslationService {
  return normalizeTranslationService(label);
}

/**
 * 翻译文本
 * @param text 待翻译文本
 * @returns 翻译结果
 */
export async function translateText(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error(t("errors.emptyText"));
  }

  // 获取用户设置
  const settings = (window as any).logseq?.settings;
  const service = normalizeTranslationService(settings?.translationService);
  const targetLanguage = settings?.targetLanguage;
  const apiKey = settings?.apiKey;

  // 根据服务商选择翻译器
  switch (service) {
    case "google": {
      return await googleFreeTranslator(
        text, 
        targetLanguage
      );
      }
    case "baidu": {
      if (!apiKey) {
        throw new Error(t("errors.baiduMissingApiKey"));
      }
      const credentials = apiKey.split('&');
      if (credentials.length !== 2) {
        throw new Error(t("errors.baiduInvalidApiKey"));
      }
      const context = String(targetLanguage || "").split("&");

      return await baiduTranslator(
        text,
        credentials[0].trim(),
        credentials[1].trim(),
        context[0].trim(),
        context[1] || "",
      );
    }
    
    case "youdao": {
      if (!apiKey) {
        throw new Error(t("errors.youdaoMissingApiKey"));
      }
      const credentials = apiKey.split("&");
      if (credentials.length !== 2) {
        throw new Error(t("errors.youdaoInvalidApiKey"));
      }
      const context = String(targetLanguage || "").split("&");

      return youdaoTranslator(
        text,
        credentials[0].trim(),
        credentials[1].trim(),
        context[0].trim(),
        context[1] || "",
      );
    }
  }
}
