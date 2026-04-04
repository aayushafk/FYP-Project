import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, Users, X } from 'lucide-react'
import { getSocket, joinEventChat, sendEventMessage, onEventMessage, onUserJoined, onUserLeft, leaveEventChat } from '../../services/socketService'
import { useAuth } from '../../contexts/AuthContext'

export default function EventChatComponent({ eventId, eventTitle, onClose }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [activeUsers, setActiveUsers] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const messagesEndRef = useRef(null)
  
  const { user } = useAuth()
  const token = localStorage.getItem('token')
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  // Fetch initial event messages
  useEffect(() => {
    fetchEventMessages()
  }, [eventId])

  // Join event chat room and set up Socket.IO listeners
  useEffect(() => {
    const socket = getSocket()
    
    // Join the event chat room
    joinEventChat(eventId, user._id, user.fullName, user.role)

    // Listen for new messages
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message])
    }

    const handleUserJoined = (data) => {
      setStatusMessage(data.message)
      setTimeout(() => setStatusMessage(''), 4000)
    }

    const handleUserLeft = (data) => {
      setStatusMessage(data.message)
      setTimeout(() => setStatusMessage(''), 4000)
    }

    socket.on('receiveMessage', handleNewMessage)
    socket.on('userJoined', handleUserJoined)
    socket.on('userLeft', handleUserLeft)

    return () => {
      socket.off('receiveMessage', handleNewMessage)
      socket.off('userJoined', handleUserJoined)
      socket.off('userLeft', handleUserLeft)
      leaveEventChat()
    }
  }, [eventId, user._id, user.fullName, user.role])

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchEventMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/event/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.messages) {
        setMessages(data.messages)
      }
      setLoading(false)
    } catch (err) {
      setError('Failed to load event messages')
      console.error(err)
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)

    try {
      // Save to database first
      const response = await fetch(`${API_URL}/chat/event/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      })

      if (response.ok) {
        // Then emit via Socket.IO for real-time delivery
        sendEventMessage(eventId, newMessage)
        setNewMessage('')
        setError('')
      } else {
        setError('Failed to send message')
      }
    } catch (err) {
      setError('Error sending message')
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">{eventTitle} - Chat</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading event chat...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-indigo-600" size={24} />
          <div>
            <h2 className="font-semibold text-gray-900">{eventTitle}</h2>
            <p className="text-xs text-gray-500">Event Discussion</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-700 text-center">
          {statusMessage}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare size={48} className="text-gray-300 mb-4" />
            <p>No messages yet. Start the discussion!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg._id || index} className={`flex ${msg.sender?.id === user._id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender?.id === user._id
                  ? 'bg-indigo-600 text-white rounded-bl-lg'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-br-lg'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${
                  msg.sender?.id === user._id ? 'text-indigo-100' : 'text-gray-600'
                }`}>
                  {msg.sender?.id === user._id
                    ? 'You'
                    : msg.sender?.role
                      ? `${msg.sender.name} (${msg.sender.role.charAt(0).toUpperCase() + msg.sender.role.slice(1)})`
                      : msg.sender?.name
                  }
                </p>
                <p className="text-sm break-words">{msg.message}</p>
                <p className={`text-xs ${msg.sender?.id === user._id ? 'text-indigo-100' : 'text-gray-500'} mt-1`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
