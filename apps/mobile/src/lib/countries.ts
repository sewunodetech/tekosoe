/** Nama negara di form profil ↔ kode ISO 3166-1 alpha-2 yang disimpan api (`profiles.country_code`). */
const CODES: Record<string, string> = {
  Indonesia: 'ID',
  Australia: 'AU',
  Japan: 'JP',
  Singapore: 'SG',
  Malaysia: 'MY',
  Thailand: 'TH',
  Germany: 'DE',
  'United Kingdom': 'GB',
  'United States': 'US',
  'South Korea': 'KR',
};

const NAMES = Object.fromEntries(Object.entries(CODES).map(([name, code]) => [code, name]));

export const countryCode = (name: string) => CODES[name] ?? name.slice(0, 2).toUpperCase();
export const countryName = (code: string) => NAMES[code.toUpperCase()] ?? code;
