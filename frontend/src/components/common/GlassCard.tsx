import React from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: 'teal' | 'violet' | 'none';
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glow = 'none',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden transition-all duration-200 shadow-xs',
        hoverEffect && 'hover:shadow-md hover:border-slate-300 transform-gpu hover:-translate-y-0.5',
        glow === 'teal' && 'aurora-glow-teal border-teal-200',
        glow === 'violet' && 'aurora-glow-violet border-purple-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
