import React from 'react';

interface OverlayProps {
  isVisible?: boolean;
  opacity?: number;
  zIndex?: number;
  onClick?: () => void;
}

export default function Overlay({ isVisible = true, opacity = 0.5, zIndex = 50, onClick }: OverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-500"
      style={{
        opacity,
        zIndex,
      }}
      onClick={onClick}
      role="presentation"
    />
  );
}
