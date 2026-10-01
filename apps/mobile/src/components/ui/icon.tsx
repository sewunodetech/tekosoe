import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/constants/theme';

/** Ikon garis dari desain (canvas "Final UI", viewBox 24, stroke round). */
export type IconName =
  | 'back'
  | 'close'
  | 'plus'
  | 'pay'
  | 'external'
  | 'card'
  | 'home'
  | 'profile'
  | 'bell'
  | 'check'
  | 'chevron'
  | 'lock'
  | 'receipt'
  | 'faceId'
  | 'faceIdSmile'
  | 'calendar'
  | 'shield'
  | 'camera'
  | 'train'
  | 'food'
  | 'music'
  | 'offline'
  | 'archive';

type Props = { name: IconName; size?: number; color?: ColorValue; strokeWidth?: number };

export function Icon({ name, size = 20, color = colors.text, strokeWidth = 2.2 }: Props) {
  const s = { stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {glyph(name, s)}
    </Svg>
  );
}

function glyph(name: IconName, s: object) {
  switch (name) {
    case 'back':
      return <Path d="M15 18l-6-6 6-6" {...s} />;
    case 'close':
      return <Path d="M6 6l12 12M18 6L6 18" {...s} />;
    case 'plus':
      return <Path d="M12 5v14M5 12h14" {...s} />;
    case 'pay':
    case 'external':
      return <Path d="M7 17L17 7M9 7h8v8" {...s} />;
    case 'card':
      return (
        <>
          <Rect x={3} y={6} width={18} height={12} rx={2.5} {...s} />
          <Path d="M3 10h18" {...s} />
        </>
      );
    case 'home':
      return <Path d="M4 11l8-7 8 7v9H4z" {...s} />;
    case 'profile':
      return (
        <>
          <Circle cx={12} cy={8} r={4} {...s} />
          <Path d="M4 21c1-4 4-6 8-6s7 2 8 6" {...s} />
        </>
      );
    case 'bell':
      return (
        <>
          <Path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" {...s} />
          <Path d="M10 21h4" {...s} />
        </>
      );
    case 'check':
      return <Path d="M5 12.5l4.5 4.5L19 7.5" {...s} />;
    case 'chevron':
      return <Path d="M9 6l6 6-6 6" {...s} />;
    case 'lock':
      return (
        <>
          <Rect x={5} y={11} width={14} height={10} rx={2} {...s} />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...s} />
        </>
      );
    case 'receipt':
      return <Path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7" {...s} />;
    case 'faceId':
      return (
        <>
          <Path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2" {...s} />
          <Path d="M9 9v1M15 9v1M12 9v4h-1M9 16c1.5 1 4.5 1 6 0" {...s} />
        </>
      );
    case 'faceIdSmile':
      return (
        <>
          <Path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2" {...s} />
          <Path d="M9 9v1M15 9v1M9 15c1.5 1 4.5 1 6 0" {...s} />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect x={4} y={5} width={16} height={15} rx={3} {...s} />
          <Path d="M4 10h16M9 3v4M15 3v4" {...s} />
        </>
      );
    case 'shield':
      return <Path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" {...s} />;
    case 'camera':
      return (
        <>
          <Path d="M4 7h3l2-3h6l2 3h3v12H4z" {...s} />
          <Circle cx={12} cy={13} r={3.5} {...s} />
        </>
      );
    case 'train':
      return (
        <>
          <Rect x={5} y={3} width={14} height={14} rx={3} {...s} />
          <Path d="M5 11h14M8 21l2-4M16 21l-2-4" {...s} />
        </>
      );
    case 'food':
      return <Path d="M4 3v8a2 2 0 0 0 2 2h1v8M8 3v6M18 21V3c-2 1-4 3-4 7h4" {...s} />;
    case 'music':
      return (
        <>
          <Path d="M9 18V5l11-2v13" {...s} />
          <Circle cx={6} cy={18} r={3} {...s} />
          <Circle cx={17} cy={16} r={3} {...s} />
        </>
      );
    case 'offline':
      return <Path d="M2 8.5a16 16 0 0 1 20 0M5.5 12a11 11 0 0 1 13 0M9 15.5a5.5 5.5 0 0 1 6 0M3 3l18 18" {...s} />;
    case 'archive':
      return (
        <>
          <Rect x={3} y={4} width={18} height={5} rx={1} {...s} />
          <Path d="M5 9v11h14V9M10 13h4" {...s} />
        </>
      );
  }
}
