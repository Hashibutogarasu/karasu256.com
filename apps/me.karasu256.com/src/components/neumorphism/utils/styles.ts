export const neumorphColors = {
  background: '#e0e5ec',
  lightShadow: '#ffffff',
  darkShadow: '#a3b1c6',
};

export const neumorphBoxShadow = `
  8px 8px 16px ${neumorphColors.darkShadow},
  -8px -8px 16px ${neumorphColors.lightShadow}
`;

export const neumorphInsetBoxShadow = `
  inset 8px 8px 16px ${neumorphColors.darkShadow},
  inset -8px -8px 16px ${neumorphColors.lightShadow}
`;
