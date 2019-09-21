/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Translator,
  TranslateOptions,
  TranslateResult,
  Languages
} from "../src";

jest.setTimeout(20000);

class TestTranslator extends Translator {
  name = "test";

  getSupportLanguages(): Languages {
    return ["en"];
  }
  query(text: string, options: TranslateOptions): Promise<TranslateResult> {
    return Promise.resolve({
      text: text,
      from: options.from,
      to: options.to,
      status: "SUCCESS"
    });
  }
}

class FailTranslator extends Translator {
  name = "FailTranslator";

  getSupportLanguages(): Languages {
    return ["en"];
  }
  query(text: string, options: TranslateOptions): Promise<TranslateResult> {
    return Promise.reject({ status: "UNKNOWN" });
  }
}

test("translator query", async () => {
  const translator: Translator = new TestTranslator();
  const options: TranslateOptions = {
    from: "en",
    to: "en"
  };
  await translator.translate("hello", options).then(res => {
    expect(res.status).toBe("SUCCESS");
  });
  await new FailTranslator().translate("hello", options).catch(res => {
    expect(res.status).toBe("UNKNOWN");
  });
});
