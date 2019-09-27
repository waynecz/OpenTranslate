import { Sogou } from "../src";
import MockAdapter from "axios-mock-adapter";

describe("Dict Sogou", () => {
  const sogou = new Sogou();

  it("should translate successfully", async () => {
    const result = await sogou.translate("I love you", "en", "zh-CN");

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
    const result = sogou.getSupportLanguages();

    expect(result).toContain("auto");
    expect(result).toContain("zh-CN");
    expect(result).toContain("en");
  }, 5000);

  it("should detect language for a given text", async () => {
    const lang = await sogou.detect("你好");

    expect(lang).toBe("zh-CN");
  });

  it("should use custom token", async () => {
    const sogou = new Sogou({ config: { token: "1234" } });

    expect(sogou.config.token).toBe("1234");

    const mock = new MockAdapter(sogou.axios);

    mock.onAny().reply(200);

    await sogou.translate("text", "en", "zh-CN").catch(() => {});
    // did not request token
    expect(mock.history.get.length).toBe(0);

    await sogou
      .translate("text", "en", "zh-CN", { token: "2345" })
      .catch(() => {});
    // did not request token
    expect(mock.history.get.length).toBe(0);

    expect(mock.history.post[0].data).not.toBe(mock.history.post[1].data);

    sogou.config.token = void 0;
    await sogou.translate("text", "en", "zh-CN").catch(() => {});
    // did request token
    expect(mock.history.get.length).toBeGreaterThan(0);

    mock.restore();
  });
});
