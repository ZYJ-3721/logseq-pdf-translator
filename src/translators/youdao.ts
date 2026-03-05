// 生成 SHA256 签名
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 有道翻译 API 响应接口
interface YoudaoTranslateResponse {
  errorCode: string;
  query?: string;
  translation?: string[];
  l?: string;
  dict?: {
    url: string;
  };
  webdict?: {
    url: string;
  };
  tSpeakUrl?: string;
  speakUrl?: string;
  isDomainSupport?: string;
}

/**
 * 有道翻译
 * @param text 待翻译文本
 * @param appid 有道翻译应用ID
 * @param secretKey 有道翻译密钥
 * @param targetLang 翻译目标语言
 * @param domain 翻译文本的领域类型，默认为空
 * @param sourceLang 源语言，默认为 auto（自动检测）
 * @returns 翻译结果
 */
export async function youdaoTranslator(
  text: string,
  appid: string,
  secretKey: string,
  targetLang: string,
  domain: string = "",
  sourceLang: string = "auto",
): Promise<string> {
  // 生成随机数（salt）
  const salt = crypto.randomUUID();
  // 获取当前时间戳（秒）
  const curtime = Math.floor(Date.now()/1000).toString();
  // 生成 input 参数
  const input = (text.length <= 20) ? text : text.slice(0, 10) + text.length + text.slice(-10);
  // 生成签名：sha256(应用ID+input+salt+curtime+应用密钥)
  const sign = await sha256(appid + input + salt + curtime + secretKey);
  // 设置请求地址
  const url = "https://openapi.youdao.com/api";
  // 构建请求参数
  const params = new URLSearchParams({
    q: text, from: sourceLang, to: targetLang,
    appKey: appid, salt: salt, sign: sign,
    signType: "v3", curtime: curtime,
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
    const result: YoudaoTranslateResponse = await response.json();

    // 检查是否有错误码
    if (result.errorCode !== "0") {
      throw new Error(`有道翻译错误 ${result.errorCode}`);
    }
    // 检查翻译结果
    if (!result.translation || !Array.isArray(result.translation) || result.translation.length === 0) {
      throw new Error("翻译结果为空");
    }
    // 拼接所有翻译结果
    const translation = result.translation.join("");

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
