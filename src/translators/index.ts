import { googleFreeTranslator } from './google_free';
import { baiduTranslator } from './baidu';
import { youdaoTranslator } from './youdao';

export const TRANSLATION_SERVICES = ["Google", "百度🔐", "有道🔐"] as const;

export type TranslationService = typeof TRANSLATION_SERVICES[number];


/**
 * 翻译文本
 * @param text 待翻译文本
 * @returns 翻译结果
 */
export async function translateText(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error('翻译文本不能为空');
  }

  // 获取用户设置
  const settings = (window as any).logseq?.settings;
  const service: TranslationService = settings.translationService;
  const targetLanguage = settings.targetLanguage;
  const apiKey = settings.apiKey;

  // 根据服务商选择翻译器
  switch (service) {

    case "Google": {
      return await googleFreeTranslator(
        text,
        targetLanguage,
      );
    }

    case "百度🔐": {
      if (!apiKey) {
        throw new Error('请在插件设置中配置百度翻译 API Key');
      }
      const credentials = apiKey.split('&');
      if (credentials.length !== 2) {
        throw new Error('API Key 格式错误，应为：APP ID&密钥');
      }
      const context = targetLanguage.split('&')

      return await baiduTranslator(
        text,
        credentials[0].trim(),
        credentials[1].trim(),
        context[0].trim(),
        context[1] || "",
      );
    }

    case '有道🔐': {
      if (!apiKey) {
        throw new Error('请在插件设置中配置有道翻译 API Key');
      }
      const credentials = apiKey.split('&');
      if (credentials.length !== 2) {
        throw new Error('API Key 格式错误，应为：应用ID&应用秘钥');
      }
      const context = targetLanguage.split('&')

      return await youdaoTranslator(
        text,
        credentials[0].trim(),
        credentials[1].trim(),
        context[0].trim(),
        context[1] || "",
      );
    }
  }
}
