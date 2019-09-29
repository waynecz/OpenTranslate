/* eslint-disable @typescript-eslint/camelcase */
import {
  Language,
  Translator,
  TranslateQueryResult
} from "@opentranslate/translator";
import qs from "qs";

type CaiyunTranslateResult = {
  confidence: number;
  target: string;
  rc: number;
};

const langMap: [Language, string][] = [
  ["auto", "auto"],
  ["zh-CN", "zh"],
  ["en", "en"],
  ["ja", "ja"]
];

export interface CaiyunConfig {
  token?: string;
}

export class Caiyun extends Translator<CaiyunConfig> {
  private token = { value: "token:cy4fgbil24jucmh8jfr5", date: 0 };

  async updateToken(): Promise<void> {
    try {
      const homepage = await this.request<string>(
        "https://fanyi.caiyunapp.com",
        {
          withCredentials: false,
          method: "GET"
        }
      ).then(r => r.data);
      const appjsPath = (homepage.match(/\/static\/js\/app\.\w+\.js/) || [
        ""
      ])[0];
      if (appjsPath) {
        const appjs = await this.request<string>(
          "https://fanyi.caiyunapp.com" + appjsPath
        ).then(r => r.data);
        const matchRes = appjs.match(/token:\w+/);
        if (matchRes) {
          this.token = {
            value: matchRes[0],
            date: Date.now()
          };
        }
      }
    } catch (e) {}
  }

  protected async getToken(): Promise<string> {
    if (Date.now() - this.token.date > 3600000) {
      await this.updateToken();
    }
    return this.token.value;
  }

  readonly name = "caiyun";

  /** Translator lang to custom lang */
  private static readonly langMap = new Map(langMap);

  /** Custom lang to translator lang */
  private static readonly langMapReverse = new Map(
    langMap.map(([translatorLang, lang]) => [lang, translatorLang])
  );

  getSupportLanguages(): Language[] {
    return [...Caiyun.langMap.keys()];
  }

  async textToSpeech(text: string, lang: Language): Promise<string> {
    return `http://tts.baidu.com/text2audio?${qs.stringify({
      lan: Caiyun.langMap.get(lang !== "auto" ? lang : "zh-CN") || "zh",
      ie: "UTF-8",
      spd: 5,
      text
    })}`;
  }

  protected async query(
    text: string,
    from: Language,
    to: Language,
    config: CaiyunConfig
  ): Promise<TranslateQueryResult> {
    if (from == "auto") {
      from = await this.detect(text);
    }
    const response = await this.request<CaiyunTranslateResult>(
      "https://api.interpreter.caiyunai.com/v1/translator",
      {
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json;charset=UTF-8",
          Origin: "https://fanyi.caiyunapp.com",
          Referer: "https://fanyi.caiyunapp.com/",
          "X-Authorization": config.token || (await this.getToken())
        },
        method: "POST",
        data: JSON.stringify({
          media: "text",
          os_type: "web",
          request_id: "web_fanyi",
          source: text,
          trans_type: `${Caiyun.langMap.get(from)}2${Caiyun.langMap.get(to)}`
        })
      }
    ).catch(() => {});
    if (!response || !response.data) {
      throw new Error("NETWORK_ERROR");
    }
    const result = response.data;
    return {
      text: text,
      from,
      to,
      origin: {
        paragraphs: [text],
        tts: await this.textToSpeech(text, from)
      },
      trans: {
        paragraphs: [result.target],
        tts: await this.textToSpeech(result.target, to)
      }
    };
  }
}

export default Caiyun;
