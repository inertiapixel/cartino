// cartino/src/utils/cookieManager.ts
const isProd = process.env.NODE_ENV === "production";

export interface CookieOptions {
  maxAgeDays?: number;
  httpOnly?: boolean;
  secure?: boolean;
  path?: string;
  sameSite?: "Strict" | "Lax" | "None";
}

/**
 * Apply Cartino namespace to cookies
 */
function withPrefix(name: string): string {
  return `cartino.${name}`;
}

/**
 * Minimal request/response interfaces
 * (compatible with Node http and Express)
 */
export interface CookieRequest {
  headers: Record<string, string | string[] | undefined>;
}

export interface CookieResponse {
  getHeader(name: string): number | string | string[] | undefined;
  setHeader(name: string, value: string | string[]): void;
}

export const CookieManager = {
  /**
   * Get all cookies from request
   */
  getAllCookies(req: CookieRequest): Record<string, string> {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return {};

    // If cookie is array, merge into a single string
    const cookieStr = Array.isArray(cookieHeader)
      ? cookieHeader.join("; ")
      : cookieHeader;

    return cookieStr.split(";").reduce<Record<string, string>>((cookies, pair) => {
      const [key, value] = pair.trim().split("=");
      if (key) {
        cookies[key] = decodeURIComponent(value || "");
      }
      return cookies;
    }, {});
  },

  /**
   * Get single cookie
   */
  getCookie(req: CookieRequest, name: string): string | undefined {
    return this.getAllCookies(req)[withPrefix(name)];
  },

  /**
   * Set cookie
   */
  setCookie(
    res: CookieResponse,
    name: string,
    value: string,
    options: CookieOptions = {}
  ): void {
    const opts: Required<CookieOptions> = {
      maxAgeDays: options.maxAgeDays ?? 7,
      httpOnly: options.httpOnly ?? true,
      secure: options.secure ?? isProd,
      path: options.path ?? "/",
      sameSite: options.sameSite ?? "Lax",
    };

    const parts: string[] = [];
    parts.push(`${withPrefix(name)}=${encodeURIComponent(value)}`);

    if (opts.maxAgeDays) {
      const expires = new Date();
      expires.setDate(expires.getDate() + opts.maxAgeDays);
      parts.push(`Expires=${expires.toUTCString()}`);
      parts.push(`Max-Age=${opts.maxAgeDays * 24 * 60 * 60}`);
    }

    parts.push(`Path=${opts.path}`);
    if (opts.httpOnly) parts.push("HttpOnly");
    if (opts.secure) parts.push("Secure");
    if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);

    const cookie = parts.join("; ");

    const prev = res.getHeader("Set-Cookie");
    if (prev) {
      if (Array.isArray(prev)) {
        res.setHeader("Set-Cookie", [...prev, cookie]);
      } else {
        res.setHeader("Set-Cookie", [prev.toString(), cookie]);
      }
    } else {
      res.setHeader("Set-Cookie", cookie);
    }
  },

  /**
   * Delete cookie
   */
  deleteCookie(res: CookieResponse, name: string): void {
    res.setHeader("Set-Cookie", `${withPrefix(name)}=; Path=/; Max-Age=0`);
  },
};
