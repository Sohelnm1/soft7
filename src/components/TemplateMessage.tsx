import React from 'react';
import { Phone } from 'lucide-react';

interface TemplateComponent {
    type: string;
    text?: string;
    format?: string;
    example?: {
        header_handle?: string[];
    };
    buttons?: Array<{
        type: string;
        text: string;
        url?: string;
        phone_number?: string;
    }>;
}

interface TemplateMessageProps {
    components: TemplateComponent[];
    className?: string;
}

export const TemplateMessage: React.FC<TemplateMessageProps> = ({ components, className = '' }) => {
    if (!components || !Array.isArray(components)) {
        return null;
    }

    const headerComponent = components.find(c => c.type === 'HEADER');
    const bodyComponent = components.find(c => c.type === 'BODY');
    const footerComponent = components.find(c => c.type === 'FOOTER');
    const buttonsComponent = components.find(c => c.type === 'BUTTONS');

    return (
        <div className={`template-message overflow-hidden flex flex-col ${className}`}>
            {/* Header - Image or Text */}
            {headerComponent && (
                <div className="template-header overflow-hidden rounded-t-xl">
                    {headerComponent.format === 'IMAGE' && headerComponent.example?.header_handle?.[0] ? (
                        <div className="relative aspect-[16/9] w-full overflow-hidden">
                            <img
                                src={headerComponent.example.header_handle[0]}
                                alt="Template header"
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                        </div>
                    ) : headerComponent.text ? (
                        <div className="pt-2 pb-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-tight tracking-tight">
                                {headerComponent.text}
                            </h3>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Body */}
            {bodyComponent?.text && (
                <div className="template-body pt-2 pb-1">
                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {bodyComponent.text}
                    </p>
                </div>
            )}

            {/* Footer */}
            {footerComponent?.text && (
                <div className="template-footer pb-2 opacity-70">
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium uppercase tracking-wider">
                        {footerComponent.text}
                    </p>
                </div>
            )}

            {/* Buttons */}
            {buttonsComponent?.buttons && buttonsComponent.buttons.length > 0 && (
                <div className="template-buttons mt-3 flex flex-col gap-1.5 pt-3 border-t border-gray-900/5 dark:border-white/5">
                    {buttonsComponent.buttons.map((button, index) => (
                        <button
                            key={index}
                            className="w-full px-4 py-2 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 rounded-lg text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-600/10 dark:border-emerald-400/10 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                        >
                            {button.type === 'PHONE_NUMBER' && <Phone size={14} />}
                            {button.type === 'URL' && <span className="text-xs">🔗</span>}
                            {button.text}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
