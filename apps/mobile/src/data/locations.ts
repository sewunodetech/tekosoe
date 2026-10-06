/**
 * Data negara dan kota untuk profil Tekosue.
 * Memastikan kota yang dipilih selalu sesuai dengan negaranya.
 */
export const LOCATIONS: Record<string, string[]> = {
  Indonesia: ['Jakarta', 'Bandung', 'Bali', 'Surabaya', 'Yogyakarta', 'Medan'],
  Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  Japan: ['Tokyo', 'Kyoto', 'Osaka', 'Sapporo', 'Fukuoka'],
  Singapore: ['Singapore'],
  Malaysia: ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Kota Kinabalu'],
  Thailand: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya'],
  Germany: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg'],
  'United Kingdom': ['London', 'Manchester', 'Edinburgh', 'Birmingham'],
  'United States': ['New York', 'San Francisco', 'Los Angeles', 'Seattle'],
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Jeju'],
};

export const COUNTRIES = Object.keys(LOCATIONS);
