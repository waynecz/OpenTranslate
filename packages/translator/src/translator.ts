import {
  Languages,
  TranslatorEnv,
  TranslateOptions,
  TranslateResult,
  TranslateQueryResult,
  TextToSpeechOptions
} from "./type";
import { Language } from "@opentranslate/languages";
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosPromise } from "axios";
import { modifyExtraHeaders } from "./extra-headers";

export abstract class Translator {
  axios: AxiosInstance;

  private env: TranslatorEnv;

  /**
   * 翻译源标识符
   */
  abstract name: string;

  /**
   * 可选的axios实例
   * @param {TranslatorEnv} [env="node"]
   * @param {AxiosInstance} [axios=_axios]
   * @memberof Translator
   */
  constructor(env: TranslatorEnv = "node", axios: AxiosInstance = Axios) {
    this.env = env;
    this.axios = axios;
  }

  /**
   *
   * 获取翻译器所支持的语言列表： 语言标识符数组
   * @abstract
   * @returns {Languages}
   * @memberof Translator
   */
  abstract getSupportLanguages(): Languages;

  /**
   *
   * 下游应用调用的接口
   * @param {string} text
   * @param {TranslateOptions} options
   * @returns {Promise<TranslateResult>}
   * @memberof Translator
   */
  async translate(
    text: string,
    options: TranslateOptions
  ): Promise<TranslateResult> {
    const queryResult = await this.query(text, options);
    return {
      ...queryResult,
      engine: this.name
    };
  }

  /**
   * 翻译源需要实现的方法
   *
   * @protected
   * @abstract
   * @param {string} text
   * @param {TranslateOptions} options
   * @returns {Promise<TranslateQueryResult>}
   * @memberof Translator
   */
  protected abstract query(
    text: string,
    options: TranslateOptions
  ): Promise<TranslateQueryResult>;

  /**
   * 跨平台 xhr 请求方法。
   * 自动处理 `Origin` 和 `Referer`。
   * @param {string} url
   * @param {AxiosRequestConfig} config
   */
  protected request<R = {}>(
    url: string,
    config?: AxiosRequestConfig
  ): AxiosPromise<R> {
    if (this.env === "ext" && config && config.headers) {
      return this.axios(url, modifyExtraHeaders(url, config));
    }

    // node 无需处理
    return this.axios(url, config);
  }

  /**
   * 如果翻译源提供了单独的检测语言的功能，请实现此接口
   * @abstract
   * @param {string} text
   * @returns {Promise<Language>}
   * @memberof Translator
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  detect(text: string): Promise<Language> {
    return Promise.resolve("auto");
  }

  /**
   *
   *
   * @param {string} text
   * @param {Language} lang
   * @returns {Promise<string|undefined>}
   * @memberof Translator
   */
  textToSpeech(text: string, options:TextToSpeechOptions): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }
}
