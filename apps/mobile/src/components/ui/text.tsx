import { Text as RNText, type TextProps } from 'react-native';

import { colors, type as typeScale } from '@/constants/theme';

export type TextVariant = keyof typeof typeScale;

type Props = TextProps & { variant?: TextVariant; color?: string };

/** Teks dengan skala tipografi desain. Default: body, warna ink. */
export function Text({ variant = 'body', color = colors.text, style, ...rest }: Props) {
  return <RNText style={[typeScale[variant], { color }, style]} {...rest} />;
}
