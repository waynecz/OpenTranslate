import { Language } from "@opentranslate/languages";

export type Languages = Array<Language>;

export type TranslatorEnv = "node" | "ext";

export type TranslateStatus =
  | "SUCCESS"
  | "NETWORK_ERROR"
  | "NETWORK_TIMEOUT"
  | "API_SERVER_ERROR"
  | "UNKNOWN";

/** 统一的查询结果的数据结构 */
export interface TranslateResult {
  text: string;
  from: Language;
  to: Language;
  status: TranslateStatus;
  result?: string;
  url?: string;
  engine?: string;
}

/** 统一的查询参数结构 */
export interface TranslateOptions {
  from: Language;
  to: Language;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
}
