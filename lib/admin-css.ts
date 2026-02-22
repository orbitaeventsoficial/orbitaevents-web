const GRADIENT_PATTERN = /\b(linear-gradient|radial-gradient|conic-gradient)\s*\(/i;

export function hasForbiddenAdminCss(input: string): boolean {
  return GRADIENT_PATTERN.test(input);
}

export function sanitizeAdminCss(input: string): string {
  if (!input) return '';
  let css = input;

  // Neutralize any gradient functions in custom admin css.
  css = css.replace(
    /\b(linear-gradient|radial-gradient|conic-gradient)\s*\([^;{}]+/gi,
    'none'
  );

  // Tailwind-like gradient utility classes inside custom css.
  css = css.replace(/--tw-gradient-from:[^;]+;/gi, '--tw-gradient-from: transparent;');
  css = css.replace(/--tw-gradient-to:[^;]+;/gi, '--tw-gradient-to: transparent;');
  css = css.replace(/--tw-gradient-stops:[^;]+;/gi, '--tw-gradient-stops: transparent;');

  return css;
}
