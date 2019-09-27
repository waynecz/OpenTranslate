/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosRequestConfig } from "axios";

declare const browser: any;
declare const chrome: any;

const extGlobal =
  typeof browser !== "undefined"
    ? browser
    : typeof chrome !== "undefined"
    ? chrome
    : null;

const modifierSingleton: { [pattern: string]: boolean } = {};

const extraHeaderMatcher = /^(Origin|Referer)$/i;

/**
 * Intercept and modify headers on browser extension
 * @param url
 */
function setupHeaderModifier(url: string, origin: string): void {
  // ignore search params
  const pattern = new URL(url).origin + "/*";

  if (modifierSingleton[pattern]) {
    return;
  }

  modifierSingleton[pattern] = true;

  const extraInfoSpec = ["blocking", "requestHeaders"];

  // For Chrome >= 72
  // https://developer.chrome.com/extensions/webRequest#life_cycle_footnote
  if (
    extGlobal.webRequest.OnBeforeSendHeadersOptions &&
    extGlobal.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty(
      "EXTRA_HEADERS"
    )
  ) {
    extraInfoSpec.push("extraHeaders");
  }

  extGlobal.webRequest.onBeforeSendHeaders.addListener(
    (details: any) => {
      if (details && details.requestHeaders) {
        const headers = details.requestHeaders.filter(
          (header: any) => !extraHeaderMatcher.test(header.name)
        );

        headers.push(
          { name: "Origin", value: origin },
          { name: "Referer", value: origin }
        );

        return { requestHeaders: headers };
      }

      return details;
    },
    { urls: [pattern] },
    extraInfoSpec
  );
}

/**
 * Modify `Origin` and `Referer` headers on browser extension.
 */
export const modifyExtraHeaders = (
  url: string,
  config: AxiosRequestConfig
): AxiosRequestConfig => {
  if (!config.headers) {
    return config;
  }

  const headerNames = Object.keys(config.headers);
  const normalHeaders: AxiosRequestConfig["headers"] = {};
  let origin: undefined | string;

  for (let i = 0; i < headerNames.length; i++) {
    const name = headerNames[i];
    if (extraHeaderMatcher.test(name)) {
      origin = config.headers[name];
    } else {
      normalHeaders[name] = config.headers[name];
    }
  }

  if (!origin) {
    return config;
  }

  if (extGlobal) {
    setupHeaderModifier(url, origin);
  } else {
    console.warn("Missing Browser Global");
  }

  return {
    ...config,
    headers: normalHeaders
  };
};
