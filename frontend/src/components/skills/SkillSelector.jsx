import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

const SkillSelector = ({ 
    selectedSkills = [], 
    onChange, 
    availableSkills = [],
    maxSkills = 10,
    disabled = false,
    placeholder = "Select skills..."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSkills = availableSkills.filter(skill =>
        skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedSkills.includes(skill)
    );

    const handleAddSkill = (skill) => {
        if (selectedSkills.length < maxSkills) {
            onChange([...selectedSkills, skill]);
        }
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleRemoveSkill = (skill) => {
        onChange(selectedSkills.filter(s => s !== skill));
    };

    return (
        <div className="relative w-full">
            <div className="border border-gray-300 rounded-lg p-2 bg-white">
                <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSkills.map(skill => (
                        <div
                            key={skill}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                        >
                            {skill}
                            {!disabled && (
                                <button
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {selectedSkills.length < maxSkills && !disabled && (
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={placeholder}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            className="w-full px-2 py-1 border-none outline-none text-sm"
                        />

                        {isOpen && filteredSkills.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto z-10">
                                {filteredSkills.map(skill => (
                                    <button
                                        key={skill}
                                        onClick={() => handleAddSkill(skill)}
                                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                                    >
                                        {skill}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedSkills.length >= maxSkills && (
                <p className="text-xs text-gray-500 mt-1">Maximum {maxSkills} skills reached</p>
            )}
        </div>
    );
};

export default SkillSelector;
