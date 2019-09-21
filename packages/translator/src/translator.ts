import {
  Languages,
  TranslatorEnv,
  TranslateOptions,
  TranslateResult
} from "./type";
import { Language } from "@opentranslate/languages";
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosPromise } from "axios";
import { modifyExtraHeaders } from "./extra-headers";

export abstract class Translator {
  axios: AxiosInstance;

  private env: TranslatorEnv;

  /**
   * 词典标识符
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
  translate(text: string, options: TranslateOptions): Promise<TranslateResult> {
    return this.postTranslate(this.query(text, options));
  }

  /**
   * 无需实现
   * 翻译后处理，添加翻译源信息
   * @private
   * @param {Promise<TranslateResult>} res
   * @returns {Promise<TranslateResult>}
   * @memberof Translator
   */
  private postTranslate(
    res: Promise<TranslateResult>
  ): Promise<TranslateResult> {
    return res.then(res => {
      res.engine = this.name;
      return Promise.resolve(res);
    });
  }

  /**
   * 翻译源需要实现的方法
   *
   * @protected
   * @abstract
   * @param {string} text
   * @param {TranslateOptions} options
   * @returns {Promise<TranslateResult>}
   * @memberof Translator
   */
  protected abstract query(
    text: string,
    options: TranslateOptions
  ): Promise<TranslateResult>;

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
}
