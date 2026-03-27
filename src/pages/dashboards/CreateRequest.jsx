import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const CreateRequest = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Medical', // Default
        location: '',
        image: '' // Placeholder for now
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = [
        { value: 'Medical', label: 'Medical Assistance' },
        { value: 'Food', label: 'Food & Water' },
        { value: 'Rescue', label: 'Rescue Operation' },
        { value: 'Transport', label: 'Transportation' },
        { value: 'Other', label: 'Other/General' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setError('');
        setIsLoading(true);

        try {
            await api.post('/requests', formData);
            navigate('/dashboard/user');
        } catch (err) {
            console.error('Error creating request:', err);
            setError(err.response?.data?.message || 'Failed to create request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => navigate('/dashboard/user')} className="mb-2">
                        &larr; Back to Dashboard
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Create Help Request</h1>
                    <p className="text-gray-600">Provide details so volunteers can assist you effectively.</p>
                </div>

                <Card>
                    <CardBody>
                        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Request Title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Need Insulin for Diabetic Patient"
                                required
                            />

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <Select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    options={categories}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    rows="4"
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="Describe the situation, specific needs, and urgency..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <Input
                                label="Location (Optional)"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g., 123 Main St, Apt 4B, City (optional)"
                                helpText="You can type an address."
                            />

                            {/* Image Upload Placeholder */}
                            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center text-gray-500">
                                <p>Image Upload Coming Soon</p>
                                <p className="text-xs">(This feature will allow you to upload photos of the situation)</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/user')}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={isLoading} variant="primary">
                                    Submit Request
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default CreateRequest;
