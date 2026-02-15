import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const RequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await api.get(`/requests/${id}`);
                setRequest(response.data);
            } catch (err) {
                console.error('Error fetching request:', err);
                setError('Failed to load request details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequest();
    }, [id]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Assigned': return 'bg-purple-100 text-purple-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!request) return <div className="p-8 text-center">Request not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
                <Button variant="ghost" onClick={() => navigate('/dashboard/user')} className="mb-4">
                    &larr; Back to Dashboard
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">Created on {new Date(request.createdAt).toLocaleString()}</p>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                    <p className="text-gray-700 leading-relaxed">{request.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Category</span>
                                        <p className="font-medium">{request.category}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Location</span>
                                        <p className="font-medium">{request.location}</p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Chat Section Placeholder */}
                        <Card>
                            <CardHeader>
                                <h3 className="font-semibold text-gray-900">Communication</h3>
                            </CardHeader>
                            <CardBody>
                                <div className="h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                    Chat Interface Coming Soon
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Sidebar / Status Tracker */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <h3 className="font-semibold text-gray-900">Status Tracker</h3>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-6 relative">
                                    {/* Vertical Line */}
                                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200"></div>

                                    {/* Steps */}
                                    {['Pending', 'Assigned', 'In Progress', 'Completed'].map((step, index) => {
                                        const steps = ['Pending', 'Assigned', 'In Progress', 'Completed'];
                                        const currentStepIndex = steps.indexOf(request.status);
                                        const isCompleted = index <= currentStepIndex;
                                        const isCurrent = index === currentStepIndex;

                                        return (
                                            <div key={step} className="relative flex items-center gap-4 pl-0">
                                                <div className={`relative z-10 w-4 h-4 rounded-full border-2 ${isCompleted ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'
                                                    }`}></div>
                                                <span className={`text-sm ${isCurrent ? 'font-bold text-gray-900' : isCompleted ? 'font-medium text-gray-700' : 'text-gray-400'
                                                    }`}>
                                                    {step}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Assigned Volunteer */}
                        <Card>
                            <CardHeader>
                                <h3 className="font-semibold text-gray-900">Assigned Volunteer</h3>
                            </CardHeader>
                            <CardBody>
                                {request.assignedTo ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                                            {request.assignedTo.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{request.assignedTo.fullName}</p>
                                            <p className="text-xs text-gray-500">Contact: {request.assignedTo.phoneNumber}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-sm italic">
                                        No volunteer assigned yet.
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetails;
