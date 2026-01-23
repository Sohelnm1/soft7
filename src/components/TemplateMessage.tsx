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
        <div className={`template-message bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 max-w-sm ${className}`}>
            {/* Header - Image or Text */}
            {headerComponent && (
                <div className="template-header">
                    {headerComponent.format === 'IMAGE' && headerComponent.example?.header_handle?.[0] ? (
                        <img
                            src={headerComponent.example.header_handle[0]}
                            alt="Template header"
                            className="w-full h-auto object-cover"
                        />
                    ) : headerComponent.text ? (
                        <div className="px-4 pt-4 pb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                                {headerComponent.text}
                            </h3>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Body */}
            {bodyComponent?.text && (
                <div className="template-body px-4 py-3">
                    <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
                        {bodyComponent.text}
                    </p>
                </div>
            )}

            {/* Footer */}
            {footerComponent?.text && (
                <div className="template-footer px-4 pb-3">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {footerComponent.text}
                    </p>
                </div>
            )}

            {/* Buttons */}
            {buttonsComponent?.buttons && buttonsComponent.buttons.length > 0 && (
                <div className="template-buttons border-t border-gray-200 dark:border-gray-700">
                    {buttonsComponent.buttons.map((button, index) => (
                        <button
                            key={index}
                            className="w-full px-4 py-3 text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 flex items-center justify-center gap-2"
                        >
                            {button.type === 'PHONE_NUMBER' && <Phone size={16} />}
                            {button.type === 'URL' && '🔗'}
                            {button.text}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
