import { Language } from "@opentranslate/languages";

export type Languages = Array<Language>;

export type TranslatorEnv = "node" | "ext";

export type TranslateError =
  | "NETWORK_ERROR"
  | "NETWORK_TIMEOUT"
  | "API_SERVER_ERROR"
  | "UNKNOWN";

/** 统一的查询结果的数据结构 */
export interface TranslateResult {
  engine: string;
  text: string;
  from: Language;
  to: Language;
  /** 原文 */
  origin: {
    text: string;
    tts?: string;
  };
  /** 译文 */
  trans: {
    text: string;
    tts?: string;
  };
}

export type TranslateQueryResult = Omit<TranslateResult, "engine">;

/** 统一的查询参数结构 */
export interface TranslateOptions {
  from: Language;
  to: Language;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
}
