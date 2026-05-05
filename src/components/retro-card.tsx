import React, { ReactNode } from 'react';

interface RetroCardProps {
    title?: string;
    children: ReactNode;
    className?: string;
    redBorder?: boolean;
    headerAction?: ReactNode;
}

const RetroCard: React.FC<RetroCardProps> = ({ title, children, className = "", redBorder = false, headerAction }) => {
    return (
        <div className={`relative group ${className}`}>
            {/* Decorative Crosshairs - using SVGs for precision */}
            {/* Top Left */}
            <div className="absolute -top-[5px] -left-[5px] w-[10px] h-[10px] text-terminal-red opacity-50 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                 <svg viewBox="0 0 10 10" className="w-full h-full overflow-visible">
                    <path d="M5 0V10M0 5H10" stroke="currentColor" strokeWidth="1" />
                 </svg>
            </div>
            {/* Top Right */}
            <div className="absolute -top-[5px] -right-[5px] w-[10px] h-[10px] text-terminal-red opacity-50 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                 <svg viewBox="0 0 10 10" className="w-full h-full overflow-visible">
                    <path d="M5 0V10M0 5H10" stroke="currentColor" strokeWidth="1" />
                 </svg>
            </div>
            {/* Bottom Left */}
            <div className="absolute -bottom-[5px] -left-[5px] w-[10px] h-[10px] text-terminal-red opacity-50 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                 <svg viewBox="0 0 10 10" className="w-full h-full overflow-visible">
                    <path d="M5 0V10M0 5H10" stroke="currentColor" strokeWidth="1" />
                 </svg>
            </div>
            {/* Bottom Right */}
            <div className="absolute -bottom-[5px] -right-[5px] w-[10px] h-[10px] text-terminal-red opacity-50 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                 <svg viewBox="0 0 10 10" className="w-full h-full overflow-visible">
                    <path d="M5 0V10M0 5H10" stroke="currentColor" strokeWidth="1" />
                 </svg>
            </div>

            {/* Border Container */}
            <div className={`
                relative h-full bg-terminal-black border
                ${redBorder ? 'border-terminal-red' : 'border-neutral-800'}
                transition-colors duration-500
            `}>
                {/* Header Line */}
                {title && (
                    <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2 bg-terminal-gray/20">
                        <div className="flex items-center gap-2">
                            {redBorder && <div className="w-2 h-2 bg-terminal-red animate-pulse" />}
                            <h3 className={`font-mono text-xs uppercase tracking-widest ${redBorder ? 'text-terminal-red' : 'text-terminal-text'}`}>
                                {title}
                            </h3>
                        </div>
                        {headerAction && (
                            <div className="text-xs font-mono text-neutral-500">
                                {headerAction}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Content */}
                <div className="p-6 h-full">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default RetroCard;