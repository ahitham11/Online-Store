const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;
const ALEF = /[\u0622\u0623\u0625\u0671]/g;
const ALEF_MAKSURA = /\u0649/g;
const HAMZA_YEH = /\u0626/g;
const HAMZA_WAW = /\u0624/g;
const TEH_MARBUTA = /\u0629/g;
const ARABIC_INDIC_DIGITS = /[\u0660-\u0669]/g;
const EXTENDED_ARABIC_INDIC_DIGITS = /[\u06F0-\u06F9]/g;

function toLatinDigits(value: string) {
  return value
    .replace(ARABIC_INDIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(EXTENDED_ARABIC_INDIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

/**
 * Normalizes Arabic for forgiving search. It intentionally does not stem
 * words; it only removes the differences users do not expect to type.
 */
export function normalizeArabic(input: string): string {
  if (!input) return '';
  return toLatinDigits(input)
    .normalize('NFC')
    .toLowerCase()
    .replace(DIACRITICS, '')
    .replace(TATWEEL, '')
    .replace(ALEF, 'ا')
    .replace(ALEF_MAKSURA, 'ي')
    .replace(HAMZA_YEH, 'ي')
    .replace(HAMZA_WAW, 'و')
    .replace(TEH_MARBUTA, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function createSearchIndex(...values: (string | null | undefined)[]) {
  return normalizeArabic(values.filter(Boolean).join(' '));
}

export function includesNormalized(haystack: string, needle: string) {
  const normalizedNeedle = normalizeArabic(needle);
  if (!normalizedNeedle) return true;
  return normalizeArabic(haystack).includes(normalizedNeedle);
}

/**
 * Accepts 01012345678, 1012345678, +201012345678, 00201012345678.
 * Returns a canonical +20 number, or null.
 */
export function normalizeEgyptianPhone(value: string): string | null {
  const digits = toLatinDigits(value).replace(/[^\d+]/g, '');
  let national = digits;

  if (national.startsWith('+20')) national = national.slice(3);
  else if (national.startsWith('0020')) national = national.slice(4);
  else if (national.startsWith('20') && national.length > 10) national = national.slice(2);
  else if (national.startsWith('0')) national = national.slice(1);

  if (!/^1[0125]\d{8}$/.test(national)) return null;
  return `+20${national}`;
}

export function formatEgyptianPhoneForDisplay(value: string) {
  const normalized = normalizeEgyptianPhone(value);
  if (!normalized) return value;
  const national = `0${normalized.slice(3)}`;
  return `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
}
