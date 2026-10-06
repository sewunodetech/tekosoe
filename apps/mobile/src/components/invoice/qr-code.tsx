import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
// Inti encoder saja (JS murni): entry utama `qrcode` menarik renderer canvas/fs.
import { create } from 'qrcode/lib/core/qrcode';

import { colors } from '@/constants/theme';

/** QR asli yang membuka `value` (URL verifikasi invoice). */
export function QrCode({ value, size = 84 }: { value: string; size?: number }) {
  const { count, d } = useMemo(() => {
    const { modules } = create(value, { errorCorrectionLevel: 'M' });
    let path = '';
    for (let y = 0; y < modules.size; y++) {
      for (let x = 0; x < modules.size; x++) {
        if (modules.get(x, y)) path += `M${x} ${y}h1v1h-1z`;
      }
    }
    return { count: modules.size, d: path };
  }, [value]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${count} ${count}`} accessibilityLabel="QR code to verify this invoice">
      <Rect width={count} height={count} fill={colors.surface} />
      <Path d={d} fill={colors.text} />
    </Svg>
  );
}
