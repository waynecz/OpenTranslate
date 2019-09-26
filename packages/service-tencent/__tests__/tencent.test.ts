import { Tencent } from "../src";
import axios from "axios";

describe("Dict Tencent", () => {
  it("should translate successfully", async () => {
    const tencent = new Tencent();
    const result = await tencent.translate(
      "I love you. Who are you",
      "auto",
      "zh-CN"
    );
    expect(result).toEqual({
      engine: "tencent",
      text: "I love you. Who are you",
      from: "en",
      to: "zh-CN",
      /** 原文 */
      origin: {
        paragraphs: ["I love you.", "Who are you"],
        tts: expect.any(String)
      },
      /** 译文 */
      trans: {
        paragraphs: [
          expect.stringContaining("爱"),
          expect.stringContaining("谁")
        ],
        tts: expect.any(String)
      }
    });
    // 访问 TTS
    if (result.trans.tts) {
      const t = await axios(result.trans.tts, {
        headers: { Origin: "https://fanyi.qq.com" }
      });
      expect(t.status).toBe(200);
    }
  }, 10000);

  it("should get supported languages", () => {
    const tencent = new Tencent();
    const result = tencent.getSupportLanguages();

    expect(result).toContain("auto");
    expect(result).toContain("zh-CN");
    expect(result).toContain("en");
  }, 5000);

  // it("should detect language for a given text", async () => {
  //   const tencent = new Tencent();
  //   const lang = await tencent.detect("你好");
  //
  //   expect(lang).toBe("zh-CN");
  // });
});
