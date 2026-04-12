interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry>;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 100) {
    this.requests = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    setInterval(() => this.cleanup(), this.windowMs);
  }

  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.requests.set(key, newEntry);
      return { allowed: true, remaining: this.maxRequests - 1, resetTime: newEntry.resetTime };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    entry.count++;
    return { allowed: true, remaining: this.maxRequests - entry.count, resetTime: entry.resetTime };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

export const apiRateLimiter = new RateLimiter(60000, 100);
export const authRateLimiter = new RateLimiter(60000, 10);
export const uploadRateLimiter = new RateLimiter(60000, 5);

export interface SecurityHeaders {
  "X-Content-Type-Options": string;
  "X-Frame-Options": string;
  "X-XSS-Protection": string;
  "Referrer-Policy": string;
  "Permissions-Policy": string;
  "Strict-Transport-Security"?: string;
  "Content-Security-Policy"?: string;
}

export function getSecurityHeaders(isProduction = false): SecurityHeaders {
  const headers: SecurityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };

  if (isProduction) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    headers["Content-Security-Policy"] =
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:";
  }

  return headers;
}

export interface ApiSecurityConfig {
  requireAuth?: boolean;
  rateLimit?: boolean;
  validateInput?: boolean;
  maxSize?: number;
}

export function createApiHandler(
  handler: (request: Request, context?: any) => Promise<Response>,
  config: ApiSecurityConfig = {}
) {
  return async (request: Request, context?: any): Promise<Response> => {
    const startTime = Date.now();

    try {
      if (config.rateLimit !== false) {
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const rateLimitResult = apiRateLimiter.check(ip);

        if (!rateLimitResult.allowed) {
          return Response.json(
            { error: "Too many requests", retryAfter: rateLimitResult.resetTime },
            {
              status: 429,
              headers: {
                "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
                "X-RateLimit-Limit": "100",
                "X-RateLimit-Remaining": "0",
              },
            }
          );
        }
      }

      if (config.validateInput && request.method === "POST") {
        const contentType = request.headers.get("content-type");
        
        if (!contentType?.includes("application/json")) {
          return Response.json(
            { error: "Content-Type must be application/json" },
            { status: 415 }
          );
        }

        if (config.maxSize) {
          const contentLength = parseInt(request.headers.get("content-length") || "0");
          if (contentLength > config.maxSize) {
            return Response.json(
              { error: `Request body too large. Maximum size is ${config.maxSize} bytes` },
              { status: 413 }
            );
          }
        }
      }

      const response = await handler(request, context);

      const duration = Date.now() - startTime;
      const newResponse = new Response(response.body, {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          "X-Response-Time": `${duration}ms`,
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": apiRateLimiter.check("info").remaining.toString(),
        },
      });

      return newResponse;
    } catch (error) {
      console.error("API Error:", error);
      
      const duration = Date.now() - startTime;
      return Response.json(
        {
          error: "Internal server error",
          message: process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "An unexpected error occurred",
        },
        {
          status: 500,
          headers: {
            "X-Response-Time": `${duration}ms`,
          },
        }
      );
    }
  };
}
