import { MD5 } from "./md5";


// 百度翻译 API 响应接口
interface BaiduTranslateResponse {
  from: string;
  to: string;
  trans_result: Array<{
    src: string;
    dst: string;
  }>;
  error_code?: string;
  error_msg?: string;
}

/**
 * 百度翻译
 * @param text 待翻译文本
 * @param appid 百度翻译 APPID
 * @param secretKey 百度翻译密钥
 * @param targetLang 翻译目标语言
 * @param domain 翻译文本的领域类型，默认为空
 * @param sourceLang 源语言，默认为 auto（自动检测）
 * @returns 翻译结果
 */
export async function baiduTranslator(
  text: string,
  appid: string,
  secretKey: string,
  targetLang: string,
  domain: string = "",
  sourceLang: string = "auto",
): Promise<string> {
  // 生成随机数（salt）
  const salt = Date.now().toString();
  // 生成签名：appid+q+salt+密钥
  const sign = domain ? MD5(appid + text + salt + domain + secretKey) : MD5(appid + text + salt + secretKey);
  // 设置请求地址
  const url = domain ? "https://fanyi-api.baidu.com/api/trans/vip/fieldtranslate" : "https://fanyi-api.baidu.com/api/trans/vip/translate";
  // 构建请求参数
  const params = new URLSearchParams({
    q: text, from: sourceLang, to: targetLang,
    appid: appid, salt: salt, sign: sign,
    ...(domain ? { domain } : {}),
  });
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    // 检查请求状态
    if (!response.ok) {
      throw new Error(`请求错误: ${response.status}`);
    }
    // 获取请求结果
    const result: BaiduTranslateResponse = await response.json();

    // 检查是否有错误码
    if (result.error_code) {
      throw new Error(`百度翻译错误 ${result.error_code}: ${result.error_msg || "未知错误"}`);
    }
    // 检查翻译结果
    if (!result.trans_result || !Array.isArray(result.trans_result) || result.trans_result.length === 0) {
      throw new Error("翻译结果为空");
    }
    // 拼接所有翻译结果
    const translation = result.trans_result.map((item) => item.dst).join("");
    
    if (!translation) {
      throw new Error("翻译结果为空");
    }
    return translation;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("网络请求失败，请检查网络连接");
    }
    throw error;
  }
}
