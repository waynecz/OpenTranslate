/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Translator,
  TranslateOptions,
  TranslateResult,
  TranslateQueryResult,
  Languages,
  TextToSpeechOptions
} from "../src";

describe("Translator", () => {
  it("should successfully return result", async () => {
    class TestTranslator extends Translator {
      name = "test";

      textToSpeech(
        text: string,
        options: TextToSpeechOptions
      ): Promise<string> {
        return Promise.resolve("https://hello.com/a.mp3");
      }

      getSupportLanguages(): Languages {
        return ["en"];
      }

      query(
        text: string,
        options: TranslateOptions
      ): Promise<TranslateQueryResult> {
        return Promise.resolve({
          text: text,
          from: options.from,
          to: options.to,
          origin: ["origin text"],
          trans: ["origin text"]
        });
      }
    }

    const translator: Translator = new TestTranslator();

    const options: TranslateOptions = {
      from: "en",
      to: "zh-CN"
    };

    const result = await translator.translate("hello", options);

    expect(result).toEqual({
      engine: "test",
      text: "hello",
      from: options.from,
      to: options.to,
      origin: ["origin text"],
      trans: ["origin text"]
    });

    const tts = await translator.textToSpeech("hello", { lang: "en" });
    if (tts != undefined) {
      expect(tts).toBe("https://hello.com/a.mp3");
    }
  }, 20000);

  it("should throw error when failed", async () => {
    class FailTranslator extends Translator {
      name = "FailTranslator";

      getSupportLanguages(): Languages {
        return ["en"];
      }

      query(text: string, options: TranslateOptions): Promise<TranslateResult> {
        return Promise.reject(new Error("UNKNOWN"));
      }
    }

    const options: TranslateOptions = {
      from: "en",
      to: "zh-CN"
    };

    try {
      await new FailTranslator().translate("hello", options);
    } catch (e) {
      expect(e.message).toBe("UNKNOWN");
    }
  }, 20000);
});
