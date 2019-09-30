import {
  Language,
  Translator,
  TranslateError,
  TranslateQueryResult
} from "@opentranslate/translator";
import md5 from "md5";
import qs from "qs";

const langMap: [Language, string][] = [
  ["auto", "auto"],
  ["zh-CN", "zh"],
  ["zh-TW", "zh"],
  ["en", "en"]
];

export interface BaiduConfig {
  placeholder?: string;
}

export class Baidu extends Translator<BaiduConfig> {
  readonly name = "baidu";

  // [endpoint, appid, key] are all from official fanyi.baidu.com chrome extension
  // 🤔 yep, these things are hard-coded inside background JS
  // 🧩 extension src: https://chrome.google.com/webstore/detail/%E7%99%BE%E5%BA%A6%E7%BF%BB%E8%AF%91%EF%BC%9A%E7%BD%91%E9%A1%B5%E7%BF%BB%E8%AF%91%E3%80%81%E6%B5%B7%E6%B7%98%E7%A5%9E%E5%99%A8/edhchknefojhifoiebpcbkhcjlkkklci?hl=zh-CN
  // 📚 API doc: http://api.fanyi.baidu.com/api/trans/product/apidoc#joinFile
  readonly endpoint = "http://api.fanyi.baidu.com/api/trans/vip/translate";
  readonly appid = "20151211000007653";
  readonly key = "IFJB6jBORFuMmVGDRude";

  protected async query(
    text: string,
    from: Language,
    to: Language,
    config: BaiduConfig
  ): Promise<TranslateQueryResult> {
    type BaiduTranslateError = {
      error_code: "54001" | string;
      error_msg: "Invalid Sign" | string;
    };

    type BaiduTranslateResult = {
      from: Language;
      to: Language;
      trans_result: Array<{
        dst: string;
        src: string;
      }>;
    };

    const salt = Date.now();
    const { endpoint, appid, key } = this;

    const res = await this.request<BaiduTranslateResult | BaiduTranslateError>(
      endpoint,
      {
        params: {
          from: Baidu.langMap.get(from),
          to: Baidu.langMap.get(to),
          q: text,
          salt,
          appid,
          sign: md5(appid + text + salt + key)
        }
      }
    ).catch(() => {
      throw new TranslateError("NETWORK_ERROR");
    });

    const { data } = res;

    if ((data as BaiduTranslateError).error_code) {
      console.error(
        new Error("[Baidu service]" + (data as BaiduTranslateError).error_msg)
      );

      throw new TranslateError("API_SERVER_ERROR");
    }

    const {
      trans_result: transResult,
      from: langDetected
    } = data as BaiduTranslateResult;

    return {
      text,
      from: langDetected,
      to,
      origin: {
        paragraphs: [...transResult.map(({ src }) => src)],
        tts: await this.textToSpeech(text, langDetected)
      },
      trans: {
        paragraphs: [...transResult.map(({ dst }) => dst)],
        tts: await this.textToSpeech(transResult[0].dst, to)
      }
    };
  }

  async textToSpeech(text: string, lang: Language): Promise<string> {
    return `http://tts.baidu.com/text2audio?${qs.stringify({
      lan: Baidu.langMap.get(lang !== "auto" ? lang : "zh-CN") || "zh",
      ie: "UTF-8",
      spd: 5,
      text
    })}`;
  }

  /** Translator lang to custom lang */
  private static readonly langMap = new Map(langMap);

  /** Custom lang to translator lang */
  private static readonly langMapReverse = new Map(
    langMap.map(([translatorLang, lang]) => [lang, translatorLang])
  );

  getSupportLanguages(): Language[] {
    return [...Baidu.langMap.keys()];
  }
}

export default Baidu;
