import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import SkillSelector from './SkillSelector';
import api from '../../utils/api';

const VolunteerSkillManager = () => {
    const [skills, setSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            setLoading(true);

            // Fetch available skills
            const skillsListRes = await api.get('/volunteer/skills/available');
            setAvailableSkills(skillsListRes.data.availableSkills || []);

            // Fetch user's current skills
            const userSkillsRes = await api.get('/volunteer/profile/skills');
            setSkills(userSkillsRes.data.skills || []);
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Error loading skills'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSkillsChange = (newSkills) => {
        setSkills(newSkills);
        setMessage({ type: '', text: '' });
    };

    const handleSaveSkills = async () => {
        try {
            setSaving(true);
            await api.put('/volunteer/profile/skills', { skills });
            setMessage({
                type: 'success',
                text: 'Skills updated successfully!'
            });
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Error updating skills'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">My Skills</h2>
                <p className="text-gray-600 mb-6">
                    Add your skills to help organizers find you for matching events and requests. You can add up to 10 skills.
                </p>

                {/* Message display */}
                {message.text && (
                    <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
                        message.type === 'error'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-green-50 border border-green-200'
                    }`}>
                        {message.type === 'error' ? (
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                        ) : (
                            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                        )}
                        <p className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                            {message.text}
                        </p>
                    </div>
                )}

                {/* Skill selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Your Skills ({skills.length}/10)
                    </label>
                    <SkillSelector
                        selectedSkills={skills}
                        onChange={handleSkillsChange}
                        availableSkills={availableSkills}
                        maxSkills={10}
                        placeholder="Search and add skills..."
                    />
                </div>

                {/* Skill categories info */}
                {availableSkills.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-medium text-blue-900 mb-3">Available Skill Categories:</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-900">
                            <div>🏥 Medical & Health</div>
                            <div>🚨 Emergency & Rescue</div>
                            <div>📦 Logistics & Support</div>
                            <div>📚 Education & Training</div>
                            <div>👶 Care Services</div>
                            <div>🎉 Event & Community</div>
                            <div>🗣️ Communication</div>
                            <div>⚖️ Professional Services</div>
                        </div>
                    </div>
                )}

                {/* Current skills display */}
                {skills.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-medium text-gray-700 mb-3">Your Current Skills:</h3>
                        <div className="flex flex-wrap gap-2">
                            {skills.map(skill => (
                                <div
                                    key={skill}
                                    className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
                                >
                                    ✓ {skill}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSaveSkills}
                        disabled={saving}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            saving
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {saving ? 'Saving...' : 'Save Skills'}
                    </button>
                    <button
                        onClick={() => {
                            fetchSkills();
                            setMessage({ type: '', text: '' });
                        }}
                        className="flex-1 py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                        Reset
                    </button>
                </div>

                {/* Info section */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-800 mb-2">How Skills Help You:</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                        <li>✓ Get notifications about events that need your specific skills</li>
                        <li>✓ See a skill match percentage for each opportunity</li>
                        <li>✓ Help organizers find the right volunteers for their needs</li>
                        <li>✓ Build your volunteer profile and showcase your expertise</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default VolunteerSkillManager;
