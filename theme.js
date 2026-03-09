// src/utils/theme.js
export const Colors = {
  bg: '#07070F', surface: '#0F0F1A', card: '#161622', cardAlt: '#1C1C2E',
  accent: '#FF5C35', accentDark: '#CC3D1F', accentSoft: 'rgba(255,92,53,0.15)',
  accentGlow: 'rgba(255,92,53,0.35)',
  gold: '#F5C842', goldSoft: 'rgba(245,200,66,0.15)', goldGlow: 'rgba(245,200,66,0.30)',
  green: '#00D68F', greenSoft: 'rgba(0,214,143,0.12)',
  red: '#FF4B4B', redSoft: 'rgba(255,75,75,0.12)',
  purple: '#9B6DFF', purpleSoft: 'rgba(155,109,255,0.15)',
  blue: '#4B9FFF', blueSoft: 'rgba(75,159,255,0.12)',
  text: '#EEEEFF', textSub: '#9999BB', textMuted: '#55556A',
  border: 'rgba(255,255,255,0.07)', borderAccent: 'rgba(255,92,53,0.35)',
  borderGold: 'rgba(245,200,66,0.30)', white: '#FFFFFF',
};
export const Radius  = { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 28, full: 999 };
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 28, '3xl': 40 };
export const FontSizes = { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, '2xl': 22, '3xl': 28, '4xl': 36, '5xl': 48 };
export const Shadow = {
  accent: { shadowColor: '#FF5C35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  gold:   { shadowColor: '#F5C842', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  card:   { shadowColor: '#000',    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5,  shadowRadius: 12, elevation: 8 },
};
