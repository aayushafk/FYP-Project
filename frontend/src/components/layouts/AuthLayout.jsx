import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full sm:max-w-xl max-w-xl">
                <Link to="/" className="flex justify-center">
                    {/* You can replace this with an actual SVG logo or Image */}
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-600 tracking-tight hover:text-primary-700 transition-colors cursor-pointer">
                        UnityAid
                    </h1>
                </Link>
                <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold text-gray-900">
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="w-full sm:max-w-xl max-w-xl mt-6 sm:mt-8">
                {children}
            </div>

            <div className="mt-6 sm:mt-8 text-center">
                <p className="text-xs sm:text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} UnityAid. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default AuthLayout;
