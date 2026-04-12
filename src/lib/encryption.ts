const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-change-in-production";

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_KEY);
  
  const hash = await crypto.subtle.digest("SHA-256", keyData);
  
  return crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(text: string): Promise<string> {
  try {
    const key = await getKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

export async function decrypt(encryptedText: string): Promise<string> {
  try {
    const key = await getKey();
    
    const combined = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (process.env.PASSWORD_SALT || "default-salt"));
  
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateToken(length = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  
  return result;
}

export function generateCSRFToken(): string {
  return generateToken(64);
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  
  return token === sessionToken && token.length >= 32;
}

export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars * 2) {
    return "*".repeat(data.length);
  }
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const maskedLength = Math.max(0, data.length - visibleChars * 2);
  
  return start + "*".repeat(maskedLength) + end;
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  
  if (!domain) return "***@***.***";
  
  const maskedLocal =
    localPart.length > 2
      ? localPart[0] + "*".repeat(localPart.length - 2) + localPart[localPart.length - 1]
      : "*";
  
  const [domainName, domainExt] = domain.split(".");
  const maskedDomain =
    domainName?.length > 2
      ? domainName[0] + "*".repeat(domainName.length - 2) + domainName[domainName!.length - 1]
      : "*";
  
  return `${maskedLocal}@${maskedDomain}.${domainExt || "*"}`;
}
