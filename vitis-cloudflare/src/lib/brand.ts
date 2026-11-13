/** Brand colours chosen by the admin (app_settings) → CSS variables, with WCAG contrast checks. */
export type Brand = { primary?: string | null; secondary?: string | null; logo?: string | null };

export const DEFAULT_PRIMARY = "#593069";
export const DEFAULT_SECONDARY = "#ab668f";
export const LIGHT_TEXT = "#fbf9fc";
export const DARK_TEXT = "#1d1a20";
const STORAGE = "vitis-brand";

export const isHex = (h?: string | null): h is string => !!h && /^#([0-9a-f]{6})$/i.test(h.trim());

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (c: number[]) => "#" + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")).join("");

/** sRGB mix, p = share of a (0..1). Approximates the CSS color-mix used in styles.css. */
export function mix(a: string, b: string, p: number) {
  const A = rgb(a), B = rgb(b);
  return toHex(A.map((x, i) => x * p + B[i]! * (1 - p)));
}

export function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x! + 0.05) / (y! + 0.05);
}

/** Best of light/dark text over a background. */
export function bestText(bg: string) {
  return contrast(bg, LIGHT_TEXT) >= contrast(bg, DARK_TEXT) ? LIGHT_TEXT : DARK_TEXT;
}

export const AA = 4.5;

/** Derived surfaces (mirrors styles.css) and the text colour picked for each. */
export function derive(primaryIn?: string | null, secondaryIn?: string | null) {
  const primary = isHex(primaryIn) ? primaryIn : DEFAULT_PRIMARY;
  const secondary = isHex(secondaryIn) ? secondaryIn : DEFAULT_SECONDARY;
  const topbar = mix(primary, "#000000", 0.82);
  const coverBg = mix(primary, "#000000", 0.78);
  const primaryFg = bestText(primary);
  const topbarFg = bestText(topbar);
  const tinted = mix(secondary, "#ffffff", 0.45);
  const coverFg = contrast(coverBg, tinted) >= AA ? tinted : bestText(coverBg);
  const checks = [
    { label: "Texto sobre a cor primária (botões, item ativo do menu)", ratio: contrast(primary, primaryFg) },
    { label: "Texto da barra superior", ratio: contrast(topbar, topbarFg) },
    { label: "Título das capas geradas", ratio: contrast(coverBg, coverFg) },
    { label: "Cor primária como texto/link sobre fundo claro", ratio: contrast(primary, "#ffffff") },
  ];
  return { primary, secondary, primaryFg, topbarFg, coverFg, checks };
}

export function brandVars(b: Brand): Record<string, string> {
  const d = derive(b.primary, b.secondary);
  return {
    "--brand-primary": d.primary,
    "--brand-secondary": d.secondary,
    "--brand-primary-fg": d.primaryFg,
    "--brand-topbar-fg": d.topbarFg,
    "--brand-cover-fg": d.coverFg,
  };
}

export function applyBrand(b: Brand) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(brandVars(b))) root.style.setProperty(k, v);
  cacheVars(b);
  window.dispatchEvent(new CustomEvent("vitis-brand", { detail: b }));
}

export function cachedBrand(): Brand {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || "{}");
  } catch {
    return {};
  }
}

/** Inline script for <head>: re-applies cached brand variables before paint. */
export const BRAND_BOOT_SCRIPT = `try{var b=JSON.parse(localStorage.getItem('${STORAGE}')||'{}');var v=b.__vars;if(v)for(var k in v)document.documentElement.style.setProperty(k,v[k])}catch(e){}`;

export function cacheVars(b: Brand) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify({ ...b, __vars: brandVars(b) }));
  } catch {
    /* ignore */
  }
}
