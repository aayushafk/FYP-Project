import React from 'react';

const Alert = ({
    children,
    variant = 'info',
    title,
    className = '',
    dismissible = false,
    onClose
}) => {
    const variants = {
        info: 'bg-blue-50 text-blue-800 border-blue-200',
        success: 'bg-green-50 text-green-800 border-green-200',
        warning: 'bg-amber-50 text-amber-800 border-amber-200',
        error: 'bg-red-50 text-red-800 border-red-200',
    };

    const style = variants[variant] || variants.info;

    return (
        <div className={`p-4 rounded-lg border flex justify-between items-start ${style} ${className}`} role="alert">
            <div className="flex-grow">
                {title && <h3 className="font-semibold mb-1">{title}</h3>}
                <div className="text-sm">
                    {children}
                </div>
            </div>
            {dismissible && (
                <button
                    type="button"
                    onClick={onClose}
                    className="ml-4 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                    aria-label="Close"
                >
                    <span className="text-xl font-medium leading-none">&times;</span>
                </button>
            )}
        </div>
    );
};

export default Alert;
