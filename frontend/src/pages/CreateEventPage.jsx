import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Calendar, MapPin, Users, Award, AlertCircle, CheckCircle, ArrowLeft, Loader } from 'lucide-react';

const VOLUNTEER_SKILLS = [
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

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    location: '',
    volunteersNeeded: 5,
    volunteerRoles: '',
    contactInfo: ''
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Event title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Event description is required');
      }
      if (!formData.startDateTime) {
        throw new Error('Start date and time are required');
      }
      if (!formData.endDateTime) {
        throw new Error('End date and time are required');
      }
      if (new Date(formData.startDateTime) >= new Date(formData.endDateTime)) {
        throw new Error('End date must be after start date');
      }
      if (!formData.location.trim()) {
        throw new Error('Location is required');
      }
      if (formData.volunteersNeeded < 1) {
        throw new Error('At least 1 volunteer is required');
      }

      // Send datetime-local strings with :00 appended for proper parsing
      // datetime-local returns format like "2026-02-07T14:30"
      // Append :00 to make it "2026-02-07T14:30:00" which is a valid datetime string
      console.log('Original formData:', formData);
      console.log('formData.startDateTime:', formData.startDateTime);
      console.log('formData.endDateTime:', formData.endDateTime);
      console.log('formData.location:', formData.location);

      const eventData = {
        ...formData,
        startDateTime: formData.startDateTime ? formData.startDateTime + ':00' : null,
        endDateTime: formData.endDateTime ? formData.endDateTime + ':00' : null,
        requiredSkills: selectedSkills,
        volunteersNeeded: parseInt(formData.volunteersNeeded)
      };

      console.log('Sending eventData to backend:', eventData);
      console.log('startDateTime:', eventData.startDateTime);
      console.log('endDateTime:', eventData.endDateTime);
      console.log('location:', eventData.location);

      const response = await api.post('/organizer/event', eventData);
      
      console.log('✅ Event created successfully!');
      console.log('Response:', response.data);
      
      // Even if response structure is different, event was created
      setSuccessMessage('Event created successfully! Redirecting to dashboard...');
      setError('');
      
      // Redirect to organizer dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/organizer', { replace: true });
      }, 2000);
    } catch (err) {
      console.error('❌ Error creating event:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Failed to create event. Please try again.';
      
      if (err.response?.status === 403) {
        errorMessage = 'Your account is pending administrator verification. Please wait for approval.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Please log in again to create an event.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSuccessMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStartDateMin = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="full-height page-background py-8 px-4">
      <div style={{maxWidth: '42rem', margin: '0 auto'}}>
        {/* Header */}
        <button
          onClick={() => navigate('/organizer/dashboard')}
          className="flex items-center text-primary-600 mb-6 font-medium"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>

        {/* Main Card */}
        <div className="white-background rounded-lg shadow-xl overflow-hidden">
          {/* Title Section */}
          <div style={{background: 'linear-gradient(to right, var(--primary-600), var(--primary-700))'}} className="px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
            <p style={{color: '#bfdbfe'}}>Set up a volunteer event and find the right volunteers for your cause</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-6" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            {/* Register Date Info */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Event Registration Date:</span> {formatDate(new Date().toISOString())}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={20} className="text-red-600" style={{marginTop: '0.125rem', marginRight: '0.75rem', flexShrink: 0}} />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Success Alert */}
            {successMessage && (
              <div className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle size={20} className="text-green-600" style={{marginTop: '0.125rem', marginRight: '0.75rem', flexShrink: 0}} />
                <p className="text-green-700">{successMessage}</p>
              </div>
            )}

            {/* Event Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Community Park Cleanup"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">Make it clear and descriptive</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what the event is about, what volunteers will do, and any important details..."
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                style={{resize: 'none'}}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">Provide clear details to attract the right volunteers</p>
            </div>

            {/* Date & Time Grid */}
            <div className="grid gap-4" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={formData.startDateTime}
                  onChange={handleInputChange}
                  min={getStartDateMin()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  End Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={formData.endDateTime}
                  onChange={handleInputChange}
                  min={formData.startDateTime || getStartDateMin()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Central Park, New York, NY"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                disabled={isSubmitting}
              />
            </div>

            {/* Volunteers Needed */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users size={16} className="inline mr-1" />
                Volunteers Needed
              </label>
              <input
                type="number"
                name="volunteersNeeded"
                value={formData.volunteersNeeded}
                onChange={handleInputChange}
                min="1"
                max="1000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                disabled={isSubmitting}
              />
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Award size={16} className="inline mr-1" />
                Required Skills (Optional)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Only volunteers with matching skills will be notified. Select "General Support" to notify all volunteers.
              </p>
              <div className="grid gap-2" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'}}>
                {VOLUNTEER_SKILLS.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    disabled={isSubmitting}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm ${
                      selectedSkills.includes(skill)
                        ? 'bg-primary-600 text-white border-2 border-primary-600 shadow-md'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {skill === 'General Support' && '🌍 '}
                    {skill}
                    {selectedSkills.includes(skill) && ' ✓'}
                  </button>
                ))}
              </div>
              {selectedSkills.length > 0 && (
                <div className="mt-3 p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Selected:</strong> {selectedSkills.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Volunteer Roles */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Volunteer Roles (Optional)
              </label>
              <input
                type="text"
                name="volunteerRoles"
                value={formData.volunteerRoles}
                onChange={handleInputChange}
                placeholder="e.g., Setup, Cleanup, Registration, First Aid"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                disabled={isSubmitting}
              />
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Information (Optional)
              </label>
              <input
                type="text"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleInputChange}
                placeholder="e.g., Phone number or email for volunteers to reach you"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
                style={{
                  background: isSubmitting ? 'var(--gray-400)' : 'linear-gradient(to right, var(--primary-600), var(--primary-700))',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    <span>Creating Event...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <span>Create Event</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 mt-6" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'}}>
          <div className="white-background p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-2">💡 Pro Tip</h3>
            <p className="text-sm text-gray-600">Clear event descriptions attract more qualified volunteers. Be specific about what you need!</p>
          </div>
          <div className="white-background p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-2">🎯 Smart Skills</h3>
            <p className="text-sm text-gray-600">Selecting skills helps us notify only matching volunteers, saving everyone's time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;
