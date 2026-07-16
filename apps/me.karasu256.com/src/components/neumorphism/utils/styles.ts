/** Sourced from the shared shadcn theme tokens (`@Hashibutogarasu/ui/styles/base.css`) so the neumorphism palette follows light/dark automatically instead of needing a hand-maintained dark copy. */
export const neumorphColors = {
  background: 'var(--muted)',
  lightShadow: 'var(--background)',
  darkShadow: 'var(--border)',
};

export const neumorphBoxShadow = `
  8px 8px 16px ${neumorphColors.darkShadow},
  -8px -8px 16px ${neumorphColors.lightShadow}
`;

export const neumorphInsetBoxShadow = `
  inset 8px 8px 16px ${neumorphColors.darkShadow},
  inset -8px -8px 16px ${neumorphColors.lightShadow}
`;
