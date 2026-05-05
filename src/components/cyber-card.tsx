import React from 'react';

interface CyberCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  status?: string;
}

export const CyberCard: React.FC<CyberCardProps> = ({ title, children, className = "", noPadding = false, status }) => {
  return (
    <div className={`relative border border-neutral-800 bg-black/40 backdrop-blur-sm ${className}`}>
      {/* Corner Crosshairs */}
      <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t border-l border-red-500/50"></div>
      <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t border-r border-red-500/50"></div>
      <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b border-l border-red-500/50"></div>
      <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b border-r border-red-500/50"></div>

      {title && (
        <div className="flex justify-between items-center border-b border-neutral-800 px-4 py-2 bg-neutral-900/30">
          <h3 className="text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase">
            {title}
          </h3>
          {status && (
            <span className="text-[10px] text-red-500 uppercase tracking-widest animate-pulse">
              ● {status}
            </span>
          )}
        </div>
      )}
      
      <div className={noPadding ? "" : "p-4 md:p-6"}>
        {children}
      </div>
    </div>
  );
};
