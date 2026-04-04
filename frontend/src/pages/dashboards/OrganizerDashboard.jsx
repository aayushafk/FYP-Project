import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const OrganizerDashboard = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const safeUser = user || {};
    const isVerified = Boolean(safeUser.isAdminVerified); // Backend field is isAdminVerified

    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/organizer/events');
            const payload = response?.data;
            const organizerEvents = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.events)
                    ? payload.events
                    : [];
            setEvents(organizerEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
            setEvents([]);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this event? This action cannot be undone.');
        if (!confirmDelete) return;

        try {
            await api.delete(`/organizer/event/${eventId}`);
            alert('Event deleted successfully!');
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert(error.response?.data?.message || 'Error deleting event');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-gray-700 font-medium">Loading organizer dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 animate-slideInUp">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">Organizer Dashboard</h1>
                        <p className="text-lg text-gray-600 mt-2 font-medium">{safeUser.organizationName || safeUser.fullName || 'Organizer'}</p>
                    </div>
                    <div className="flex gap-3">
                        {isVerified && (
                            <Button onClick={() => navigate('/organizer/event/create')} variant="primary" size="lg">Create Event</Button>
                        )}
                    </div>
                </div>

                {/* Verification Banner */}
                {!isVerified ? (
                    <Alert variant="warning" title="Verification Pending" className="animate-slideInDown">
                        Your account is currently under review by the administrators. You will be able to create events once verified.
                    </Alert>
                ) : (
                    <Alert variant="success" className="animate-slideInDown">
                        Account Verified. You have full access to organizer features.
                    </Alert>
                )}

                {/* Organization Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1 animate-slideInLeft">
                        <CardHeader><h3 className="font-bold text-lg text-white">Organization Profile</h3></CardHeader>
                        <CardBody className="space-y-4 text-sm">
                            <div>
                                <span className="block text-gray-600 font-semibold uppercase tracking-wide">Reg. Number</span>
                                <span className="font-bold text-gray-900 text-base">{safeUser.registrationNumber || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-600 font-semibold uppercase tracking-wide">Official Email</span>
                                <span className="font-bold text-gray-900 text-base break-all">{safeUser.officialEmail || safeUser.email || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-600 font-semibold uppercase tracking-wide">Contact</span>
                                <span className="font-bold text-gray-900 text-base">{safeUser.contactNumber || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-600 font-semibold uppercase tracking-wide">Address</span>
                                <span className="font-bold text-gray-900 text-base">{safeUser.organizationAddress || 'N/A'}</span>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Stats */}
                    <Card className="md:col-span-2 animate-slideInRight">
                        <CardHeader><h3 className="font-bold text-lg text-white">Overview</h3></CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md hover:scale-105 transition-all cursor-pointer">
                                    <span className="block text-4xl font-bold text-indigo-600 mb-1">{events.length}</span>
                                    <span className="text-sm text-gray-700 font-semibold">Total Events</span>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md hover:scale-105 transition-all cursor-pointer">
                                    <span className="block text-4xl font-bold text-green-600 mb-1">120</span>
                                    <span className="text-sm text-gray-700 font-semibold">Volunteers</span>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md hover:scale-105 transition-all cursor-pointer">
                                    <span className="block text-4xl font-bold text-orange-600 mb-1">4.8</span>
                                    <span className="text-sm text-gray-700 font-semibold">Org Rating</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Events List */}
                <Card className="animate-slideInUp">
                    <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <h3 className="font-bold text-xl text-white">My Events <span className="text-yellow-300">({events.length})</span></h3>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">View History</Button>
                    </CardHeader>
                    <CardBody>
                        {events.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600 mb-6 text-lg font-medium">You haven't created any events yet.</p>
                                <Button variant="primary" onClick={() => navigate('/organizer/event/create')} size="lg">Create Your First Event</Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b-2 border-gray-300">
                                        <tr>
                                            <th className="px-6 py-4">Event Name</th>
                                            <th className="px-6 py-4">Start Date</th>
                                            <th className="px-6 py-4">Volunteers</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map((event, index) => {
                                            const startDate = new Date(event.startDateTime);
                                            const today = new Date();
                                            const status = startDate > today ? 'Upcoming' : startDate.toDateString() === today.toDateString() ? 'Today' : 'Completed';
                                            
                                            return (
                                                <tr key={event._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors group animate-slideInUp" style={{animationDelay: `${index * 0.05}s`}}>
                                                    <td className="px-6 py-4 font-bold text-gray-900 group-hover:text-indigo-600">{event.title}</td>
                                                    <td className="px-6 py-4 text-gray-700 font-medium">{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                    <td className="px-6 py-4 font-semibold text-gray-900">{event.assignedVolunteers?.length || 0} / {event.volunteersNeeded}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                                                            status === 'Upcoming' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 
                                                            status === 'Today' ? 'bg-green-100 text-green-800 border-green-300' : 
                                                            'bg-gray-100 text-gray-800 border-gray-300'
                                                        }`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => navigate(`/event/${event._id}`)}
                                                                className="hover:-translate-y-0.5"
                                                            >
                                                                View
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                className="text-red-600 hover:bg-red-50 border-red-200 hover:border-red-400 hover:-translate-y-0.5"
                                                                onClick={() => handleDeleteEvent(event._id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default OrganizerDashboard;
