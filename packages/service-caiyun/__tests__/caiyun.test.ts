import { Caiyun } from "../src";

describe("Dict Caiyun", () => {
  const caiyun = new Caiyun();

  it("should translate successfully", async () => {
    const result = await caiyun
      .translate("I love you", "auto", "zh-CN")
      .catch(e => console.log(e));
    expect(result).toEqual({
      engine: "caiyun",
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
        paragraphs: [expect.stringContaining("月色很美")],
        tts: expect.any(String)
      }
    });
  }, 5000);
});
