export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:\s*text\/html/gi,
];

const SQL_INJECTION_PATTERNS = [
  /('|")\s*(OR|AND)\s*('|")/gi,
  /;\s*DROP\s+/gi,
  /;\s*DELETE\s+/gi,
  /UNION\s+SELECT/gi,
  /--$/g,
  /\/\*/g,
];

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  return sanitized;
}

export function validateString(
  input: unknown,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowEmpty?: boolean;
  } = {}
): ValidationResult {
  const { required = false, minLength, maxLength, pattern, allowEmpty = true } =
    options;
  const errors: string[] = [];

  if (input === undefined || input === null) {
    if (required) {
      errors.push("This field is required");
    }
    return { isValid: errors.length === 0, errors };
  }

  const strValue = String(input);

  if (!allowEmpty && strValue.length === 0) {
    errors.push("Field cannot be empty");
  }

  if (minLength !== undefined && strValue.length < minLength) {
    errors.push(`Minimum length is ${minLength} characters`);
  }

  if (maxLength !== undefined && strValue.length > maxLength) {
    errors.push(`Maximum length is ${maxLength} characters`);
  }

  if (pattern && !pattern.test(strValue)) {
    errors.push("Invalid format");
  }

  return { isValid: errors.length === 0, errors };
}

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errors: string[] = [];

  if (!email) {
    errors.push("Email is required");
    return { isValid: false, errors };
  }

  if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  return { isValid: errors.length === 0, errors };
}

export function validateUrl(url: string): ValidationResult {
  try {
    new URL(url);
    
    const allowedProtocols = ["http:", "https:"];
    const parsedUrl = new URL(url);
    
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return {
        isValid: false,
        errors: ["URL protocol not allowed"],
      };
    }

    return { isValid: true, errors: [] };
  } catch {
    return { isValid: false, errors: ["Invalid URL format"] };
  }
}

export function containsXSS(input: string): boolean {
  return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

export function containsSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

export function validateAndSanitize(input: string): ValidationResult {
  const hasXSS = containsXSS(input);
  const hasSQLInjection = containsSQLInjection(input);
  const errors: string[] = [];

  if (hasXSS) {
    errors.push("Input contains potentially dangerous content (XSS)");
  }

  if (hasSQLInjection) {
    errors.push("Input contains potentially dangerous content (SQL Injection)");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitizeInput(input),
  };
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
    "/": "&#x2F;",
  };

  return String(str).replace(
    /[&<>"'/]/g,
    (char) => htmlEntities[char] || char
  );
}
