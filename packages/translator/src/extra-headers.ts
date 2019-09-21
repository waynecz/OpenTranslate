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

/**
 * Intercept and modify headers on browser extension
 * @param url
 */
function setupHeaderModifier(url: string): void {
  const { origin, pathname } = new URL(url);
  // ignore search params
  const pattern = origin + pathname + "*";

  if (!extGlobal || modifierSingleton[pattern]) {
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
          (header: any) => !/^(Origin|Referer)$/.test(header.name)
        );

        headers.push(
          { name: "Origin", value: origin },
          { name: "Referer", value: origin }
        );
        return { requestHeaders: headers };
      }

      return { requestHeaders: details.requestHeaders };
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

  const headers = Object.keys(config.headers);
  const normalHeaders = headers.filter(
    header => !/^(Origin|Referer)$/i.test(header)
  );

  if (normalHeaders.length === headers.length) {
    return config;
  }

  setupHeaderModifier(url);

  return {
    ...config,
    headers: normalHeaders
  };
};
