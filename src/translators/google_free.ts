/**
 * 生成 Google 翻译 Token (TK)
 * @param text 待翻译文本
 * @returns token 字符串
 */
function generateToken(text: string): string {
  const b = 406644;
  const b1 = 3293161072;
  const jd = ".";
  const $b = "+-a^+6";
  const Zb = "+-3^+b+-f";

  function RL(a: number, b: string): number {
    const t = "a";
    const Yb = "+";
    let d: number;
    for (let c = 0; c < b.length - 2; c += 3) {
      const dChar = b.charAt(c + 2);
      d = dChar >= t ? dChar.charCodeAt(0) - 87 : Number(dChar);
      d = b.charAt(c + 1) === Yb ? a >>> d : a << d;
      a = b.charAt(c) === Yb ? (a + d) & 4294967295 : a ^ d;
    }
    return a;
  }

  const e: number[] = [];
  let f = 0;
  
  /* eslint-disable */
  for (let g = 0; g < text.length; g++) {
    let m = text.charCodeAt(g);
    if (128 > m) {
      e[f++] = m;
    } else {
      if (2048 > m) {
        e[f++] = (m >> 6) | 192;
      } else {
        if (55296 === (m & 64512) && g + 1 < text.length && 56320 === (text.charCodeAt(g + 1) & 64512)) {
          m = 65536 + ((m & 1023) << 10) + (text.charCodeAt(++g) & 1023);
          e[f++] = (m >> 18) | 240;
          e[f++] = ((m >> 12) & 63) | 128;
        } else {
          e[f++] = (m >> 12) | 224;
        }
        e[f++] = ((m >> 6) & 63) | 128;
      }
      e[f++] = (m & 63) | 128;
    }
  }

  let result = b;
  for (f = 0; f < e.length; f++) {
    result += e[f];
    result = RL(result, $b);
  }
  result = RL(result, Zb);
  result ^= b1 || 0;
  if (0 > result) {
    result = (result & 2147483647) + 2147483648;
  }
  result %= 1e6;
  /* eslint-enable */

  return result.toString() + jd + (result ^ b);
}

/**
 * Google 翻译（免费接口）
 * @param text 待翻译文本
 * @param targetLang 目标语言
 * @param sourceLang 源语言，默认为 auto（自动检测）
 * @returns 翻译结果
 */
export async function googleFreeTranslator(
  text: string,
  targetLang: string,
  sourceLang: string = "auto"
): Promise<string> {
  const baseUrl = "https://translate.googleapis.com";
  const param = `sl=${sourceLang}&tl=${targetLang}`;
  const tk = generateToken(text);
  const q = encodeURIComponent(text);
  const url = `${baseUrl}/translate_a/single?client=gtx&${param}&hl=en&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&source=bh&ssel=0&tsel=0&kc=1&tk=${tk}&q=${q}`;

  try {
    const response = await fetch(url, {
      method: "GET",
    });
    
    // 检查请求状态
    if (!response.ok) {
      throw new Error(`请求错误: ${response.status}`);
    }
    // 获取请求结果
    const result = await response.json();

    // 检查翻译结果
    if (!result || !Array.isArray(result) || !result[0] || !Array.isArray(result[0])) {
      throw new Error("翻译结果为空");
    }
    // 拼接所有翻译结果
    let translation = "";
    for (let i = 0; i < result[0].length; i++) {
      if (result[0][i] && result[0][i][0]) {
        translation += result[0][i][0];
      }
    }

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
