import {
  Language,
  Translator,
  TranslateQueryResult
} from "@opentranslate/translator";
import qs from "qs";

const langMap: [Language, string][] = [
  ["auto", "auto"],
  ["zh-CN", "zh"],
  ["zh-TW", "zh-TW"],
  ["en", "en"],
  ["ko", "kr"],
  ["ja", "jp"],
  ["de", "de"],
  ["fr", "fr"],
  ["es", "es"],
  ["it", "it"],
  ["tr", "tr"],
  ["ru", "ru"],
  ["pt", "pt"],
  ["vi", "vi"],
  ["id", "id"],
  ["ms", "ms"],
  ["th", "th"]
];

export interface TencentToken {
  qtv: string;
  qtk: string;
}

export interface TencentConfig {
  value: TencentToken;
  date: number;
}

const defaultToken: TencentToken = {
  qtv: "1f287950babc6f41",
  qtk:
    "7ZL+2Pxljmav9j1z8Q7RuhmVeN5nkYZrLJH0kfWZ8rin6SYxcu62TsMramShwVod/uNYNIKWAu7I4x09lVkCEou4pIVE5E1GuDDrHuNjLUHQCSPssTaFUOOiIomtcwFYQAxap7Kp9beMz+rxnUL9pg=="
};

interface Record {
  sourceText: string;
  targetText: string;
  traceId: string;
}
interface TencentTranslateResult {
  sessionUuid: string;
  translate: {
    errCode: number;
    errMsg: string;
    sessionUuid: string;
    source: string;
    target: string;
    records: Array<Record>;
    full: boolean;
    options: {};
  };
  dict: {
    data: Array<Record>;
    errCode: number;
    errMsg: string;
    type: string;
    map: { [key: string]: Record };
  };
  suggest: { data: []; errCode: number; errMsg: string };
  errCode: number;
  errMsg: string;
}

export class Tencent extends Translator<TencentConfig> {
  private token: TencentConfig = {
    value: defaultToken,
    date: 0
  };
  /** Translator lang to custom lang */
  private static readonly langMap = new Map(langMap);

  /** Custom lang to translator lang */
  private static readonly langMapReverse = new Map(
    langMap.map(([translatorLang, lang]) => [lang, translatorLang])
  );
  async updateToken(): Promise<void> {
    const token: TencentToken = defaultToken;
    try {
      const homepage = (await this.request<string>("https://fanyi.qq.com"))
        .data;

      const qtv = homepage.match(/"qtv=([^"]+)/);

      if (qtv) {
        token.qtv = qtv[1];
      }

      const qtk = homepage.match(/"qtk=([^"]+)/);
      if (qtk) {
        token.qtk = qtk[1];
      }
    } catch (e) {
      /* nothing */
    }
    this.token = {
      value: token,
      date: Date.now()
    };
  }

  async getToken(): Promise<TencentToken> {
    if (Date.now() - this.token.date > 360000) {
      await this.updateToken();
    }
    return this.token.value;
  }

  protected async query(
    text: string,
    from: Language,
    to: Language,
    config: TencentConfig
  ): Promise<TranslateQueryResult> {
    const { qtv, qtk } = await this.getToken();
    const data = qs.stringify({
      source: Tencent.langMap.get(from),
      target: Tencent.langMap.get(to),
      sourceText: text,
      qtv,
      qtk,
      sessionUuid: `translate_uuid${Date.now()}`
    });

    const response = await this.request<TencentTranslateResult>(
      "https://fanyi.qq.com/api/translate",
      {
        method: "post",
        withCredentials: false,
        headers: {
          Host: "fanyi.qq.com",
          Origin: "https://fanyi.qq.com",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest"
        },
        data: data
      }
    );
    if (!response || !response.data) {
      throw new Error("NETWORK_ERROR");
    }
    const result = response.data;
    const trans = result.translate.records.map(r => r.targetText);
    const origin = result.translate.records.map(r => r.sourceText);
    return {
      text,
      from:
        Tencent.langMapReverse.get(result.translate.source) ||
        (from !== "auto" ? from : await this.detect(text)),
      to,
      /** 原文 */
      origin: {
        paragraphs: origin,
        tts: await this.textToSpeech(
          origin.join(""),
          Tencent.langMapReverse.get(result.translate.source) || from
        )
      },
      /** 译文 */
      trans: {
        paragraphs: trans,
        tts: await this.textToSpeech(
          trans.join(""),
          Tencent.langMapReverse.get(result.translate.target) || to
        )
      }
    };
  }

  readonly name = "tencent";

  getSupportLanguages(): Language[] {
    return [...Tencent.langMap.keys()];
  }

  // async detect(text: string): Promise<Language> {
  // }

  async textToSpeech(text: string, lang: Language): Promise<string> {
    return `https://fanyi.qq.com/api/tts?${qs.stringify({
      lang: Tencent.langMap.get(lang !== "auto" ? lang : "zh-CN") || "zh",
      text
    })}`;
  }
}

export default Tencent;
