import React from 'react';

export const Card = ({ children, className = '', interactive = false, ...props }) => {
    return (
        <div
            className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 ${
                interactive ? 'hover:shadow-2xl hover:border-primary-200 hover:-translate-y-1 cursor-pointer' : ''
            } ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '', ...props }) => {
    return (
        <div className={`px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white transition-all ${className}`} {...props}>
            {children}
        </div>
    );
};

export const CardBody = ({ children, className = '', ...props }) => {
    return (
        <div className={`p-6 ${className}`} {...props}>
            {children}
        </div>
    );
};

export const CardFooter = ({ children, className = '', ...props }) => {
    return (
        <div className={`px-6 py-4 bg-gray-50 border-t border-gray-100 transition-all ${className}`} {...props}>
            {children}
        </div>
    );
};
