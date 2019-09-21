/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Translator,
  TranslateOptions,
  TranslateResult,
  TranslateQueryResult,
  Languages
} from "../src";

describe("Translator", () => {
  it("should successfully return result", async () => {
    class TestTranslator extends Translator {
      name = "test";

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
          origin: {
            text: "origin text",
            tts: "https://test.com/tts.mp3"
          },
          trans: {
            text: "origin text",
            tts: "https://test.com/tts.mp3"
          }
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
      origin: {
        text: "origin text",
        tts: "https://test.com/tts.mp3"
      },
      trans: {
        text: "origin text",
        tts: "https://test.com/tts.mp3"
      }
    });
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
