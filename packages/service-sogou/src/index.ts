import {
  Language,
  Translator,
  TranslateOptions,
  TranslateQueryResult
} from "@opentranslate/translator";
import qs from "qs";
import md5 from "md5";

const langMap: [Language, string][] = [
  ["auto", "auto"],
  ["zh-CN", "zh-CHS"],
  ["zh-TW", "zh-CHT"],
  ["en", "en"],

  ["af", "af"],
  ["ar", "ar"],
  ["bg", "bg"],
  ["bn", "bn"],
  ["bs", "bs-Latn"],
  ["ca", "ca"],
  ["cs", "cs"],
  ["cy", "cy"],
  ["da", "da"],
  ["de", "de"],
  ["el", "el"],
  ["es", "es"],
  ["et", "et"],
  ["fa", "fa"],
  ["fi", "fi"],
  ["fil", "fil"],
  ["fj", "fj"],
  ["fr", "fr"],
  ["he", "he"],
  ["hi", "hi"],
  ["hr", "hr"],
  ["ht", "ht"],
  ["hu", "hu"],
  ["id", "id"],
  ["it", "it"],
  ["ja", "ja"],
  ["ko", "ko"],
  ["lt", "lt"],
  ["lv", "lv"],
  ["mg", "mg"],
  ["ms", "ms"],
  ["mt", "mt"],
  ["mww", "mww"],
  ["nl", "nl"],
  ["no", "no"],
  ["otq", "otq"],
  ["pl", "pl"],
  ["pt", "pt"],
  ["ro", "ro"],
  ["ru", "ru"],
  ["sk", "sk"],
  ["sl", "sl"],
  ["sm", "sm"],
  ["sr-Cyrl", "sr-Cyrl"],
  ["sr-Latn", "sr-Latn"],
  ["sv", "sv"],
  ["sw", "sw"],
  ["th", "th"],
  ["tlh", "tlh"],
  ["tlh-Qaak", "tlh-Qaak"],
  ["to", "to"],
  ["tr", "tr"],
  ["ty", "ty"],
  ["uk", "uk"],
  ["ur", "ur"],
  ["vi", "vi"],
  ["yua", "yua"],
  ["yue", "yue"]
];

export class Sogou extends Translator {
  /** Translator lang to custom lang */
  private static readonly langMap = new Map(langMap);

  /** Custom lang to translator lang */
  private static readonly langMapReverse = new Map(
    langMap.map(([translatorLang, lang]) => [lang, translatorLang])
  );

  private static getUUID(): string {
    let uuid = "";
    for (let i = 0; i < 32; i++) {
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += "-";
      }
      const digit = (16 * Math.random()) | 0;
      uuid += (i === 12 ? 4 : i === 16 ? (3 & digit) | 8 : digit).toString(16);
    }
    return uuid;
  }

  private token = {
    value: "8511813095151",
    date: 0
  };

  private async getToken(): Promise<string> {
    // update token every six hours
    if (Date.now() - this.token.date > 6 * 3600000) {
      try {
        const response = await this.request<{ seccode: string }>(
          "https://raw.githubusercontent.com/OpenTranslate/OpenTranslate/master/packages/service-sogou/seccode.json"
        );
        if (response.data && response.data.seccode) {
          this.token.value = response.data.seccode;
          this.token.date = Date.now();
        }
      } catch (e) {
        console.warn(e);
      }
    }

    return this.token.value;
  }

  protected async query(
    text: string,
    options: TranslateOptions
  ): Promise<TranslateQueryResult> {
    type SogouTranslateResult =
      | undefined
      | {
          data?: {
            translate?: {
              errorCode: string; // "0"
              from: string;
              to: string;
              text: string;
              dit: string;
            };
          };
        };

    const from = Sogou.langMap.get(options.from);
    const to = Sogou.langMap.get(options.to);

    const response = await this.request<SogouTranslateResult>(
      "https://fanyi.sogou.com/reventondc/translateV2",
      {
        method: "post",
        headers: {
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Referer: "https://fanyi.sogou.com",
          Origin: "https://fanyi.sogou.com"
        },
        data: qs.stringify({
          from,
          to,
          text: text,
          client: "pc",
          fr: "browser_pc",
          pid: "sogou-dict-vr",
          dict: "true",
          // eslint-disable-next-line @typescript-eslint/camelcase
          word_group: "true",
          // eslint-disable-next-line @typescript-eslint/camelcase
          second_query: "true",
          uuid: Sogou.getUUID(),
          needQc: "1",
          s: md5("" + from + to + text + (await this.getToken()))
        })
      }
    ).catch(() => {});

    if (!response || !response.data || !response.data.data) {
      throw new Error("NETWORK_ERROR");
    }

    const { translate } = response.data.data;

    if (!translate || translate.errorCode !== "0") {
      throw new Error("API_SERVER_ERROR");
    }

    return {
      text: text,
      from: Sogou.langMapReverse.get(translate.from) || "auto",
      to: options.to,
      origin: {
        paragraphs: [translate.text],
        tts: (await this.textToSpeech(translate.text, options.from)) || ""
      },
      trans: {
        paragraphs: [translate.dit],
        tts: (await this.textToSpeech(translate.dit, options.to)) || ""
      }
    };
  }

  readonly name = "sogou";

  getSupportLanguages(): Language[] {
    return [...Sogou.langMap.keys()];
  }

  async detect(text: string): Promise<Language> {
    const result = await this.query(text, { from: "auto", to: "en" });
    return result.from;
  }

  async textToSpeech(text: string, lang: Language): Promise<string | null> {
    return lang === "zh-TW"
      ? `https://fanyi.sogou.com/reventondc/microsoftGetSpeakFile?${qs.stringify(
          {
            text,
            spokenDialect: "zh-CHT",
            from: "translateweb"
          }
        )}`
      : `https://fanyi.sogou.com/reventondc/synthesis?${qs.stringify({
          text,
          speed: "1",
          lang: Sogou.langMap.get(lang),
          from: "translateweb"
        })}`;
  }
}

export default Sogou;
