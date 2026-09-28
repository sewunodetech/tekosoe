import Svg, { Rect } from 'react-native-svg';

import { colors } from '@/constants/theme';
import { demoQrCells } from './qr-pattern';

/** QR dekoratif dari desain (84px, modul 4px). TODO: ganti dengan QR asli tautan verifikasi. */
export function QrCode({ size = 84 }: { size?: number }) {
  const ink = colors.text;
  const finder = (x: number, y: number) => (
    <>
      <Rect x={x} y={y} width={28} height={28} fill={ink} />
      <Rect x={x + 4} y={y + 4} width={20} height={20} fill={colors.surface} />
      <Rect x={x + 8} y={y + 8} width={12} height={12} fill={ink} />
    </>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 84 84" accessibilityLabel="QR code to verify this invoice">
      <Rect width={84} height={84} fill={colors.surface} />
      {finder(0, 0)}
      {finder(56, 0)}
      {finder(0, 56)}
      {demoQrCells.map(([cx, cy]) => (
        <Rect key={`${cx}-${cy}`} x={cx * 4} y={cy * 4} width={4} height={4} fill={ink} />
      ))}
    </Svg>
  );
}
