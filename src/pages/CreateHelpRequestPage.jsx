import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { API_BASE_URL } from '../constants/api';

const CreateHelpRequestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    requiredSkills: []
  });

  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    'Emergency Medical',
    'Food Distribution',
    'Shelter Assistance',
    'Transportation',
    'Elder Care',
    'Child Care',
    'Home Repair',
    'Technology Help',
    'Legal Assistance',
    'Mental Health Support',
    'Education/Tutoring',
    'Other'
  ];

  // Skills matching backend SKILL_LIST
  const commonSkills = [
    'General Support',
    'First Aid',
    'Medical Assistance',
    'Food Distribution',
    'Logistics & Transport',
    'Crowd Management',
    'Teaching & Tutoring',
    'Disaster Relief',
    'Counseling Support',
    'Technical Support',
    'Translation'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSkill = (skill) => {
    if (skill && !formData.requiredSkills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      showToast({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build request body with location data
      const requestBody = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        requiredSkills: formData.requiredSkills,
        location: formData.location,
      };
      
      const response = await fetch(`${API_BASE_URL}/citizen/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create help request');
      }

      const data = await response.json();
      showToast({ type: 'success', message: 'Help request created successfully!' });
      navigate(`/event/${data.request._id}`);
    } catch (error) {
      console.error('Error creating help request:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Create Help Request</h1>
        <p className="text-gray-600 mt-2">
          Request assistance from volunteers in your community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            Request Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Need help with grocery shopping"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe what help you need..."
            rows="5"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
            Location (Optional)
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Enter your location or address (optional)"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Required Skills */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Required Skills (Optional)
          </label>
          
          {/* Common Skills Quick Select */}
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">Quick select:</p>
            <div className="flex flex-wrap gap-2">
              {commonSkills.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addSkill(skill)}
                  disabled={formData.requiredSkills.includes(skill)}
                  className="px-3 py-1 text-sm border border-blue-300 text-blue-700 rounded-full hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Skill Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(skillInput);
                }
              }}
              placeholder="Add custom skill..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => addSkill(skillInput)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {/* Selected Skills */}
          {formData.requiredSkills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.requiredSkills.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Volunteers with matching skills will be notified</li>
            <li>• A volunteer can accept your request</li>
            <li>• You'll be able to chat with the assigned volunteer</li>
            <li>• Track the progress in real-time</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Creating...' : 'Create Help Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHelpRequestPage;
