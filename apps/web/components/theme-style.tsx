import { buildThemeCss, type ThemeTokens } from "@timeup/core";

/**
 * Server-rendered inline <style> that sets the tenant's brand CSS variables on :root.
 * Rendered in the layout so colors are present in the initial HTML (no FOUC).
 */
export function ThemeStyle({ theme }: { theme: ThemeTokens }) {
  return <style id="tenant-theme" dangerouslySetInnerHTML={{ __html: buildThemeCss(theme) }} />;
}
