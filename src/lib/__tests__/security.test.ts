import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  validateString,
  validateEmail,
  validateUrl,
  containsXSS,
  containsSQLInjection,
  validateAndSanitize,
  escapeHtml,
  truncateString,
} from "@/lib/security";

describe("sanitizeInput", () => {
  it("should sanitize HTML tags", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).not.toContain("<script>");
  });

  it("should handle empty input", () => {
    expect(sanitizeInput("")).toBe("");
    expect(sanitizeInput(null as any)).toBe("");
    expect(sanitizeInput(undefined as any)).toBe("");
  });

  it("should preserve safe text", () => {
    expect(sanitizeInput("Hello World")).toBe("Hello World");
  });
});

describe("validateString", () => {
  it("should validate required field", () => {
    const result = validateString("", { required: true });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("This field is required");
  });

  it("should validate min length", () => {
    const result = validateString("ab", { minLength: 3 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Minimum length is 3 characters");
  });

  it("should validate max length", () => {
    const result = validateString("abcdef", { maxLength: 5 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Maximum length is 5 characters");
  });

  it("should validate pattern", () => {
    const result = validateString("abc", { pattern: /^\d+$/ });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid format");
  });

  it("should pass valid string", () => {
    const result = validateString("hello", { minLength: 1, maxLength: 100 });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("validateEmail", () => {
  it("should accept valid email", () => {
    const result = validateEmail("test@example.com");
    expect(result.isValid).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = validateEmail("invalid-email");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid email format");
  });

  it("should reject empty email", () => {
    const result = validateEmail("");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Email is required");
  });
});

describe("validateUrl", () => {
  it("should accept valid http URL", () => {
    const result = validateUrl("http://example.com");
    expect(result.isValid).toBe(true);
  });

  it("should accept valid https URL", () => {
    const result = validateUrl("https://example.com/path?query=1");
    expect(result.isValid).toBe(true);
  });

  it("should reject invalid URL", () => {
    const result = validateUrl("not-a-url");
    expect(result.isValid).toBe(false);
  });

  it("should reject javascript protocol", () => {
    const result = validateUrl("javascript:alert('xss')");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("URL protocol not allowed");
  });
});

describe("containsXSS", () => {
  it("should detect script tag", () => {
    expect(containsXSS("<script>alert('xss')</script>")).toBe(true);
  });

  it("should detect javascript: protocol", () => {
    expect(containsXSS("javascript:alert(1)")).toBe(true);
  });

  it("should detect event handlers", () => {
    expect(containsXSS('<img onerror="alert(1)" src="x">')).toBe(true);
  });

  it("should allow safe content", () => {
    expect(containsXSS("Hello World <3")).toBe(false);
  });
});

describe("containsSQLInjection", () => {
  it("should detect OR injection", () => {
    expect(containsSQLInjection("' OR '1'='1")).toBe(true);
  });

  it("should detect UNION SELECT", () => {
    expect(containsSQLInjection("UNION SELECT * FROM users")).toBe(true);
  });

  it("should detect DROP statement", () => {
    expect(containsSQLInjection("; DROP TABLE users;--")).toBe(true);
  });

  it("should allow safe SQL-like strings", () => {
    expect(containsSQLInjection("Order #12345-67890")).toBe(false);
  });
});

describe("validateAndSanitize", () => {
  it("should sanitize and report XSS", () => {
    const result = validateAndSanitize("<script>xss</script>");
    expect(result.isValid).toBe(false);
    expect(result.sanitized).not.toContain("<script>");
  });

  it("should pass clean input", () => {
    const result = validateAndSanitize("safe text");
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("escapeHtml", () => {
  it("should escape HTML entities", () => {
    expect(escapeHtml("<div>Test</div>")).toBe("&lt;div&gt;Test&lt;/div&gt;");
  });

  it("should escape quotes", () => {
    expect(escapeHtml('"test" & \'test\'')).toBe(
      "&quot;test&quot; &amp; &#039;test&#039;"
    );
  });
});

describe("truncateString", () => {
  it("should truncate long strings", () => {
    const longStr = "a".repeat(100);
    const truncated = truncateString(longStr, 10);
    expect(truncated.length).toBe(10);
    expect(truncated.endsWith("...")).toBe(true);
  });

  it("should return short strings unchanged", () => {
    expect(truncateString("short", 10)).toBe("short");
  });
});
