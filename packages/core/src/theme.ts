/**
 * Per-tenant theme tokens. Stored as JSON on the tenant row and applied as CSS
 * custom properties, server-rendered into the document head to avoid FOUC.
 *
 * Colors are hex strings so the admin color pickers map 1:1 to what is stored and
 * what is rendered. The neutral base palette lives statically in globals.css; these
 * tokens override the brand-driven variables.
 */

export type ThemeMode = "light" | "dark";

export interface ThemeTokens {
  mode: ThemeMode;
  /** Primary brand color — primary buttons, active nav, progress fills. */
  brand: string;
  /** Text/icon color rendered on top of `brand`. */
  brandForeground: string;
  /** Secondary accent for highlights/links. */
  accent: string;
  /** Sidebar background. */
  sidebar: string;
  /** Border radius, e.g. "0.625rem". */
  radius: string;
  /** Uploaded logo (light bg). */
  logoUrl: string | null;
  /** Uploaded logo (dark bg / sidebar). */
  logoDarkUrl: string | null;
}

export const DEFAULT_THEME: ThemeTokens = {
  mode: "light",
  brand: "#6D5DD3", // course-dashboard violet
  brandForeground: "#FFFFFF",
  accent: "#EC4899", // pink accent
  sidebar: "#FFFFFF", // light sidebar
  radius: "1rem",
  logoUrl: null,
  logoDarkUrl: null,
};

/** A few non-generic presets the master can start from when creating a tenant. */
export const THEME_PRESETS: { name: string; brand: string; accent: string; sidebar: string }[] = [
  { name: "Índigo", brand: "#4F46E5", accent: "#10B981", sidebar: "#0B1220" },
  { name: "Esmeralda", brand: "#059669", accent: "#6366F1", sidebar: "#0A1512" },
  { name: "Âmbar", brand: "#D97706", accent: "#2563EB", sidebar: "#1A1206" },
  { name: "Rosa", brand: "#E11D48", accent: "#0EA5E9", sidebar: "#1A0A10" },
  { name: "Azul", brand: "#2563EB", accent: "#F59E0B", sidebar: "#0A1020" },
  { name: "Violeta", brand: "#7C3AED", accent: "#14B8A6", sidebar: "#130A1F" },
];

const HEX = /^#([0-9a-fA-F]{6})$/;
const ALLOWED_RADII = ["0rem", "0.25rem", "0.5rem", "0.625rem", "0.75rem", "1rem"];

function safeHex(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX.test(value) ? value : fallback;
}

/** Merge partial/untrusted theme input with defaults, sanitizing every field. */
export function normalizeTheme(input: Partial<ThemeTokens> | null | undefined): ThemeTokens {
  const t = input ?? {};
  return {
    mode: t.mode === "dark" ? "dark" : "light",
    brand: safeHex(t.brand, DEFAULT_THEME.brand),
    brandForeground: safeHex(t.brandForeground, DEFAULT_THEME.brandForeground),
    accent: safeHex(t.accent, DEFAULT_THEME.accent),
    sidebar: safeHex(t.sidebar, DEFAULT_THEME.sidebar),
    radius: typeof t.radius === "string" && ALLOWED_RADII.includes(t.radius) ? t.radius : DEFAULT_THEME.radius,
    logoUrl: typeof t.logoUrl === "string" && t.logoUrl.length > 0 ? t.logoUrl : null,
    logoDarkUrl: typeof t.logoDarkUrl === "string" && t.logoDarkUrl.length > 0 ? t.logoDarkUrl : null,
  };
}

/**
 * Build the CSS custom-property declarations for a tenant theme. Rendered inline in
 * the server HTML (inside a <style> on :root) so colors are present before any JS.
 */
export function buildThemeVars(theme: ThemeTokens): Record<string, string> {
  return {
    "--brand": theme.brand,
    "--brand-foreground": theme.brandForeground,
    "--brand-strong": `color-mix(in srgb, ${theme.brand} 78%, #000)`,
    "--accent-brand": theme.accent,
    "--sidebar": theme.sidebar,
    "--radius": theme.radius,
    // shadcn primary tokens follow the brand:
    "--primary": theme.brand,
    "--primary-foreground": theme.brandForeground,
    "--ring": theme.brand,
  };
}

/** Serialize theme vars into an inline style string for a <style> tag. */
export function buildThemeCss(theme: ThemeTokens, selector = ":root"): string {
  const decls = Object.entries(buildThemeVars(theme))
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  return `${selector}{${decls}}`;
}

export { HEX as HEX_COLOR_REGEX, ALLOWED_RADII };
