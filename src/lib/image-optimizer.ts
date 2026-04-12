export interface ImageOptimizationOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  quality: 80,
  format: "webp",
};

export function getOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  const params = new URLSearchParams();
  if (opts.width) params.set("w", opts.width.toString());
  if (opts.height) params.set("h", opts.height.toString());
  if (opts.quality) params.set("q", opts.quality.toString());
  if (opts.format) params.set("f", opts.format);

  const queryString = params.toString();
  return `/api/image?src=${encodeURIComponent(src)}${queryString ? `&${queryString}` : ""}`;
}

export function generateSrcSet(
  src: string,
  baseWidth: number,
  baseHeight?: number,
  sizes: number[] = [320, 480, 640, 768, 1024, 1280, 1536]
): string {
  return sizes
    .map((size) => {
      const width = Math.min(size, baseWidth);
      const height = baseHeight
        ? Math.round((baseHeight * width) / baseWidth)
        : undefined;
      return `${getOptimizedImageUrl(src, { width, height })} ${width}w`;
    })
    .join(", ");
}

export function generateSizes(
  breakpoints: { maxWidth?: string; size: string }[] = [
    { maxWidth: "640px", size: "100vw" },
    { maxWidth: "1024px", size: "75vw" },
    { maxWidth: "1280px", size: "60vw" },
    { size: "50vw" },
  ]
): string {
  return breakpoints
    .map((bp) => (bp.maxWidth ? `(max-width: ${bp.maxWidth}) ${bp.size}` : bp.size))
    .join(", ");
}

export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function preloadImages(
  sources: string[],
  concurrency: number = 3
): Promise<void> {
  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);
    await Promise.all(batch.map(preloadImage));
  }
}

export class ImageCache {
  private cache: Map<string, HTMLImageElement>;
  private maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  async get(src: string): Promise<HTMLImageElement> {
    const cached = this.cache.get(src);
    if (cached) return cached;

    const image = await preloadImage(src);
    
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(src, image);
    return image;
  }

  has(src: string): boolean {
    return this.cache.has(src);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const imageCache = new ImageCache();

export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

export function getPlaceholderColor(): string {
  const colors = [
    "#e5e7eb",
    "#d1d5db",
    "#f3f4f6",
    "#e2e8f0",
    "#cbd5e1",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
