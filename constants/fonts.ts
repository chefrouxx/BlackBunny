export const FONTS = {
  CODEC: "MGSCodec",
  HUD: "MGSHUD",
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 28,
  "3xl": 32,
  "4xl": 40,
};

export const COLORS = {
  background: "#000",
  text: "#fff",
  textSecondary: "#ccc",
  accent: "#E10600",
  gold: "#D4AF37",
  dark: "#111",
};

export const TEXT_STYLES = {
  heading: {
    fontFamily: FONTS.HUD,
    color: COLORS.text,
  },
  body: {
    fontFamily: FONTS.CODEC,
    color: COLORS.text,
  },
  title: {
    fontFamily: FONTS.HUD,
    fontSize: FONT_SIZES["4xl"],
    fontWeight: "bold" as const,
    color: COLORS.text,
  },
  subtitle: {
    fontFamily: FONTS.HUD,
    fontSize: FONT_SIZES["2xl"],
    fontWeight: "bold" as const,
    color: COLORS.text,
  },
  bodyText: {
    fontFamily: FONTS.CODEC,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
  },
  button: {
    fontFamily: FONTS.CODEC,
    fontWeight: "600" as const,
    color: COLORS.text,
    textAlign: "center" as const,
  },
};
