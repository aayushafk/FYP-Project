import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import socketService from '../../utils/socketService'
import api from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'

export default function DirectMessageChat({ recipientId, recipientName, onClose }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const { user } = useAuth()
  const token = localStorage.getItem('token')
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  // Fetch initial messages when component mounts
  useEffect(() => {
    fetchMessages()
  }, [recipientId])

  // Set up Socket.IO listener
  useEffect(() => {
    const handleNewMessage = (message) => {
      if ((message.sender._id === user._id && message.receiver._id === recipientId) ||
          (message.sender._id === recipientId && message.receiver._id === user._id)) {
        setMessages(prev => [...prev, message])
      }
    }

    // Listen for new messages via socketService
    socketService.onDirectMessage(handleNewMessage)

    return () => {
      socketService.removeMessageListener()
    }
  }, [recipientId, user._id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${API_URL}/chat/conversation/${recipientId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      const data = await response.json()
      if (data.conversation) {
        setMessages(data.conversation)
      }
      setLoading(false)
    } catch (err) {
      setError('Failed to load messages')
      console.error(err)
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    
    try {
      // Save via REST API
      const response = await api.post('/chat/send', {
        receiverId: recipientId,
        content: newMessage
      })

      if (response.data) {
        // Emit via Socket.IO for real-time delivery
        try {
          await socketService.ensureConnected()
          socketService.sendDirectMessage(recipientId, newMessage)
        } catch (socketErr) {
          console.warn('Socket send failed, but message saved:', socketErr)
        }
        
        setNewMessage('')
        setError('')
      } else {
        setError('Failed to send message')
      }
    } catch (err) {
      setError('Error sending message: ' + (err.response?.data?.message || err.message))
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">{recipientName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading messages...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <MessageCircle className="text-blue-600" size={24} />
          <h2 className="font-semibold text-gray-900">{recipientName}</h2>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle size={48} className="text-gray-300 mb-4" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${
                msg.sender._id === user._id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender._id === user._id
                    ? 'bg-blue-600 text-white rounded-bl-lg'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-br-lg'
                }`}
              >
                <p className="text-sm break-words">{msg.content}</p>
                <p className={`text-xs ${msg.sender._id === user._id ? 'text-blue-100' : 'text-gray-500'} mt-1`}>
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
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
