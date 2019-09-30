import { Baidu } from "../src";

describe("Dict Baidu", () => {
  const baidu = new Baidu();

  it("should translate successfully", async () => {
    const En2Zh = await baidu.translate("I love you", "auto", "zh-CN");

    expect(En2Zh).toEqual({
      engine: "baidu",
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

    const Zh2En = await baidu.translate("我爱你", "zh-CN", "en");

    expect(Zh2En.trans.paragraphs[0]).toBe("I love you");
  }, 9000);

  it("should get supported languages", () => {
    const result = baidu.getSupportLanguages();

    expect(result).toContain("auto");
    expect(result).toContain("zh-CN");
    expect(result).toContain("en");
  }, 5000);

  it("should detect languages correctly", async () => {
    const jp = await baidu.translate("にほんご", "auto", "zh-CN");
    expect(jp.from).toBe("jp");

    const el = await baidu.translate("Ελληνικά", "auto", "zh-CN");
    expect(el.from).toBe("el");
  });
});
