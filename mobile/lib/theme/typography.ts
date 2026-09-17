export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  h2: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  h3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: fontFamily.regular,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    fontFamily: fontFamily.regular,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: fontFamily.regular,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  numericXl: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  numericL: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  button: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
} as const;