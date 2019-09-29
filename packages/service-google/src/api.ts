/* eslint-disable */
// prettier-ignore
export function getTK (a: any, b: any, c: any): string {
  b = Number(b) || 0
  let e: any = []
  let f = 0
  let g = 0
  for (; g < a.length; g++) {
    let l = a.charCodeAt(g)
    128 > l ? e[f++] = l : (2048 > l ? e[f++] = l >> 6 | 192 : (55296 == (l & 64512) && g + 1 < a.length && 56320 == (a.charCodeAt(g + 1) & 64512) ? (l = 65536 + ((l & 1023) << 10) + (a.charCodeAt(++g) & 1023),
      e[f++] = l >> 18 | 240,
      e[f++] = l >> 12 & 63 | 128) : e[f++] = l >> 12 | 224,
      e[f++] = l >> 6 & 63 | 128),
      e[f++] = l & 63 | 128)
  }
  a = b
  for (f = 0; f < e.length; f++) {
    a += e[f], a = _magic(a, '+-a^+6')
  }
  a = _magic(a, '+-3^+b+-f')
  a ^= Number(c) || 0;
  0 > a && (a = (a & 2147483647) + 2147483648)
  a %= 1E6
  return (a.toString() + '.' + (a ^ b))
}

// prettier-ignore
function _magic (a: any, b: any) {
  for (var c = 0; c < b.length - 2; c += 3) {
    // @ts-ignore
    var d = b.charAt(c + 2), d = "a" <= d ? d.charCodeAt(0) - 87 : Number(d), d = "+" == b.charAt(c + 1) ? a >>> d : a << d;
    a = "+" == b.charAt(c) ? a + d & 4294967295 : a ^ d
  }
  return a
}

/* eslint-enable */

/**
 * Fetch series of requests
 */
export async function fetchScheduled<R>(
  requests: Array<() => Promise<R>>,
  concurrent: boolean
): Promise<R> {
  if (concurrent) {
    return new Promise((resolve, reject): void => {
      let rejectCount = 0;
      for (let i = 0; i < requests.length; i++) {
        requests[i]()
          .then(resolve)
          .catch(() => {
            if (++rejectCount === requests.length) {
              reject(new Error("All rejected"));
            }
          });
      }
    });
  } else {
    for (let i = 0; i < requests.length; i++) {
      try {
        return await requests[i]();
      } catch (e) {}
    }

    return Promise.reject(new Error("All rejected"));
  }
}
