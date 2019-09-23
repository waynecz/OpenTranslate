import { Sogou } from "../src";

describe("Dict Sogou", () => {
  it("should translate successfully", async () => {
    const sogou = new Sogou();
    const result = await sogou.translate("I love you", {
      from: "en",
      to: "zh-CN"
    });

    expect(result).toEqual({
      engine: "sogou",
      text: "I love you",
      from: "en",
      to: "zh-CN",
      /** 原文 */
      origin: {
        paragraphs: ["I love you"],
        tts: expect.any(String)
      },
      /** 译文 */
      trans: {
        paragraphs: [expect.stringContaining("爱")],
        tts: expect.any(String)
      }
    });
  }, 5000);

  it("should get supported languages", () => {
    const sogou = new Sogou();
    const result = sogou.getSupportLanguages();

    expect(result).toContain("auto");
    expect(result).toContain("zh-CN");
    expect(result).toContain("en");
  }, 5000);

  it("should detect language for a given text", async () => {
    const sogou = new Sogou();
    const lang = await sogou.detect("你好");

    expect(lang).toBe("zh-CN");
  });
});
