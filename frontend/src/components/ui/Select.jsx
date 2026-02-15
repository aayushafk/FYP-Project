import React from 'react';

const Select = ({
    label,
    error,
    id,
    options = [],
    placeholder = '-- Select --',
    className = '',
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    id={id}
                    className={`
            block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm outline-none transition-all
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
            ${error
                            ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }
            ${className}
          `}
                    {...props}
                >
                    <option value="" disabled>{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                    {error}
                </p>
            )}
        </div>
    );
};

export default Select;
