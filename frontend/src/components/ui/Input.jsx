import React from 'react';

const Input = ({
    label,
    error,
    id,
    className = '',
    type = 'text',
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2 transition-colors">
                    {label} {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative group">
                <input
                    id={id}
                    type={type}
                    className={`
            block w-full rounded-lg border-2 px-4 py-2.5 text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400
            group-hover:shadow-md
            focus:ring-2 focus:ring-primary-500 focus:border-primary-600 focus:shadow-lg
            ${error
                            ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500 focus:border-red-600 placeholder:text-red-300'
                            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                        }
            ${className}
          `}
                    {...props}
                />
                {/* Animated bottom border on focus */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left rounded-b-lg`}></div>
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-600 animate-fadeIn font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 14.586 7.314 11.9a1 1 0 00-1.414 1.414l3.5 3.5a1 1 0 001.414 0l8.5-8.5z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input;
