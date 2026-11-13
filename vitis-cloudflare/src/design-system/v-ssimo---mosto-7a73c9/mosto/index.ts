// Ponto de entrada do Mosto no código: `import { Button, ProductCard } from "@/design-system/v-ssimo---mosto-7a73c9/mosto";`
// Os componentes e os tipos vêm de ./generated (gerado por scripts/sync-mosto.mjs).

export * from "./generated/components";
export { GOOGLE_FONTS_URL } from "./generated/fonts";
export { MOSTO_BRAND_LOCK, MOSTO_DEFAULT_BRAND } from "./generated/brand";

export const MOSTO_BRANDS = [
  { id: "vissimo", name: "Víssimo" },
  { id: "grandcru", name: "Grand Cru" },
  { id: "evino", name: "Evino" },
] as const;

export const MOSTO_THEMES = [
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
] as const;

export type MostoBrand = (typeof MOSTO_BRANDS)[number]["id"];
export type MostoTheme = (typeof MOSTO_THEMES)[number]["id"];

/** Aplica marca e tema no elemento (por padrão o <html>): todo o resto herda. */
export function applyMostoTheme(
  brand: MostoBrand,
  theme: MostoTheme,
  el: HTMLElement = document.documentElement,
) {
  el.dataset["brand"] = brand;
  el.dataset["theme"] = theme;
}
