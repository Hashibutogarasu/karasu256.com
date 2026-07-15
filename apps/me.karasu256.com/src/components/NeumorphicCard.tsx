import { ReactNode } from 'react';

interface NeumorphicCardProps {
  children?: ReactNode;
  className?: string;
}

export default function NeumorphicCard({ children, className = '' }: NeumorphicCardProps) {
  return (
    <div
      className={`
      p-6 rounded-xl
      bg-[#f0f0f0]
      shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff]
      hover:shadow-[12px_12px_20px_#d1d1d1,-12px_-12px_20px_#ffffff]
      transition-shadow duration-300
      ${className}
    `}
    >
      {children}
    </div>
  );
}
