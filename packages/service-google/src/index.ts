import {
  Language,
  Translator,
  TranslateQueryResult
} from "@opentranslate/translator";
import { getTK, fetchScheduled } from "./api";
import { AxiosRequestConfig } from "axios";
import qs from "qs";

const langMap: [Language, string][] = [
  ["auto", "auto"],
  ["zh-CN", "zh-CN"],
  ["zh-TW", "zh-TW"],
  ["en", "en"],
  ["af", "af"],
  ["am", "am"],
  ["ar", "ar"],
  ["az", "az"],
  ["be", "be"],
  ["bg", "bg"],
  ["bn", "bn"],
  ["bs", "bs"],
  ["ca", "ca"],
  ["ceb", "ceb"],
  ["co", "co"],
  ["cs", "cs"],
  ["cy", "cy"],
  ["da", "da"],
  ["de", "de"],
  ["el", "el"],
  ["eo", "eo"],
  ["es", "es"],
  ["et", "et"],
  ["eu", "eu"],
  ["fa", "fa"],
  ["fi", "fi"],
  ["fr", "fr"],
  ["fy", "fy"],
  ["ga", "ga"],
  ["gd", "gd"],
  ["gl", "gl"],
  ["gu", "gu"],
  ["ha", "ha"],
  ["haw", "haw"],
  ["he", "he"],
  ["hi", "hi"],
  ["hmn", "hmn"],
  ["hr", "hr"],
  ["ht", "ht"],
  ["hu", "hu"],
  ["hy", "hy"],
  ["id", "id"],
  ["ig", "ig"],
  ["is", "is"],
  ["it", "it"],
  ["ja", "ja"],
  ["jw", "jw"],
  ["ka", "ka"],
  ["kk", "kk"],
  ["km", "km"],
  ["kn", "kn"],
  ["ko", "ko"],
  ["ku", "ku"],
  ["ky", "ky"],
  ["la", "la"],
  ["lb", "lb"],
  ["lo", "lo"],
  ["lt", "lt"],
  ["lv", "lv"],
  ["mg", "mg"],
  ["mi", "mi"],
  ["mk", "mk"],
  ["ml", "ml"],
  ["mn", "mn"],
  ["mr", "mr"],
  ["ms", "ms"],
  ["mt", "mt"],
  ["my", "my"],
  ["ne", "ne"],
  ["nl", "nl"],
  ["no", "no"],
  ["ny", "ny"],
  ["pa", "pa"],
  ["pl", "pl"],
  ["ps", "ps"],
  ["pt", "pt"],
  ["ro", "ro"],
  ["ru", "ru"],
  ["sd", "sd"],
  ["si", "si"],
  ["sk", "sk"],
  ["sl", "sl"],
  ["sm", "sm"],
  ["sn", "sn"],
  ["so", "so"],
  ["sq", "sq"],
  ["sr", "sr"],
  ["st", "st"],
  ["su", "su"],
  ["sv", "sv"],
  ["sw", "sw"],
  ["ta", "ta"],
  ["te", "te"],
  ["tg", "tg"],
  ["th", "th"],
  ["fil", "tl"],
  ["tr", "tr"],
  ["uk", "uk"],
  ["ur", "ur"],
  ["uz", "uz"],
  ["vi", "vi"],
  ["xh", "xh"],
  ["yi", "yi"],
  ["yo", "yo"],
  ["zu", "zu"]
];

interface GoogleDataResult {
  base: string;
  data: [string[], null, string];
}

export interface GoogleConfig {
  /** Network request priority */
  order: Array<"cn" | "com" | "api">;
  concurrent: boolean;
  /** Only request API when others fail */
  apiAsFallback: boolean;
}

export class Google extends Translator<GoogleConfig> {
  /** Translator lang to custom lang */
  private static readonly langMap = new Map(langMap);

  /** Custom lang to translator lang */
  private static readonly langMapReverse = new Map(
    langMap.map(([translatorLang, lang]) => [lang, translatorLang])
  );

  private token: {
    value?: {
      tk1: number;
      tk2: number;
    };
    date: number;
  } = { date: 0 };

  private async fetchPlainText(
    url: string,
    config: AxiosRequestConfig = {}
  ): Promise<string> {
    const { data } = await this.axios(url, {
      withCredentials: false,
      ...config,
      // axios bug https://github.com/axios/axios/issues/907
      transformResponse: [(data: string): string => data],
      responseType: "text"
    });
    return data;
  }

  private async fetchWithToken(
    base: string,
    text: string,
    from: string,
    to: string
  ): Promise<GoogleDataResult> {
    if (!this.token.value) {
      throw new Error("API_SERVER_ERROR");
    }

    const { data } = await this.axios.get<GoogleDataResult["data"]>(
      `${base}/translate_a/single?` +
        qs.stringify(
          {
            client: "webapp",
            sl: from,
            tl: to,
            hl: "en",
            dt: ["at", "bd", "ex", "ld", "md", "qca", "rw", "rm", "ss", "t"],
            source: "bh",
            ssel: "0",
            tsel: "0",
            kc: "1",
            tk: getTK(text, this.token.value.tk1, this.token.value.tk2),
            q: text
          },
          { indices: false }
        )
    );

    return { base, data };
  }

  private async fetchWithoutToken(
    text: string,
    from: string,
    to: string
  ): Promise<GoogleDataResult> {
    const { data } = await this.axios.get<GoogleDataResult["data"]>(
      "https://translate.googleapis.com/translate_a/single?" +
        qs.stringify({
          client: "gtx",
          dt: "t",
          sl: from,
          tl: to,
          q: text
        })
    );
    return { base: "https://translate.google.cn", data };
  }

  config: GoogleConfig = {
    order: ["cn", "com"],
    concurrent: true,
    apiAsFallback: true
  };

  protected async query(
    text: string,
    from: Language,
    to: Language,
    config: GoogleConfig
  ): Promise<TranslateQueryResult> {
    if (Date.now() - this.token.date > 5 * 60000) {
      try {
        await this.updateToken(config);
      } catch (e) {}
    }

    let result = await fetchScheduled(
      config.order.map(value => (): Promise<GoogleDataResult> =>
        value === "api"
          ? this.fetchWithoutToken(text, from, to)
          : this.fetchWithToken(
              `https://translate.google.${value}`,
              text,
              from,
              to
            )
      ),
      config.concurrent
    ).catch(() => {});

    if (!result && config.apiAsFallback) {
      result = await this.fetchWithoutToken(text, from, to);
    }

    if (!result) {
      throw new Error("NETWORK_ERROR");
    }

    if (!result.data[0] || result.data[0].length <= 0) {
      throw new Error("API_SERVER_ERROR");
    }

    const transParagraphs = result.data[0].map(item => item[0]).filter(Boolean);

    return {
      text: text,
      from: Google.langMapReverse.get(result.data[2]) || "auto",
      to,
      origin: {
        paragraphs: text.split(/\n+/),
        tts:
          (await this.textToSpeech(text, from, {
            base: result.base,
            token: this.token.value
          })) || ""
      },
      trans: {
        paragraphs: transParagraphs,
        tts:
          (await this.textToSpeech(transParagraphs.join(" "), to, {
            base: result.base,
            token: this.token.value
          })) || ""
      }
    };
  }

  readonly name = "google";

  async updateToken(config: GoogleConfig = this.config): Promise<void> {
    const homepage = await fetchScheduled(
      config.order.map(value => (): Promise<string> =>
        value === "api"
          ? Promise.reject()
          : this.fetchPlainText(`https://translate.google.${value}`)
      ),
      config.concurrent
    );

    if (!homepage) {
      throw new Error("API_SERVER_ERROR");
    }

    const tkk = homepage.match(/TKK[=:]['"](\d+?)\.(\d+?)['"]/i);
    if (tkk) {
      // with number
      this.token.value = {
        tk1: Number(tkk[1]),
        tk2: Number(tkk[2])
      };
      this.token.date = Date.now();
    } else {
      const tkk = (homepage.match(/TKK=(.*?)\(\)\)'\);/i) || [""])[0]
        .replace(/\\x([0-9A-Fa-f]{2})/g, "") // remove hex chars
        .match(/[+-]?\d+/g);
      if (tkk) {
        // with eval
        this.token.value = {
          tk1: Number(tkk[2]),
          tk2: Number(tkk[0]) + Number(tkk[1])
        };
        this.token.date = Date.now();
      }
    }
  }

  getSupportLanguages(): Language[] {
    return [...Google.langMap.keys()];
  }

  async detect(text: string): Promise<Language> {
    try {
      return (await this.translate(text, "auto", "zh-CN")).from;
    } catch (e) {
      return "auto";
    }
  }

  async textToSpeech(
    text: string,
    lang: Language,
    meta: {
      base: string;
      token?: {
        tk1: number;
        tk2: number;
      };
    }
  ): Promise<string | null> {
    return meta.token
      ? `${meta.base}/translate_tts?ie=UTF-8&total=1&idx=0&client=t` +
          qs.stringify({
            q: text,
            tl: Google.langMapReverse.get(lang) || "en",
            tk: getTK(text, meta.token.tk1, meta.token.tk2)
          })
      : null;
  }
}

export default Google;
