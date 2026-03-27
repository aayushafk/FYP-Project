import { useState, useEffect, useRef } from 'react'
import Card from '../../ui/Card'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { useAuth } from '../../../contexts/AuthContext'

export default function Chat({ recipientId, recipientName, eventId = null }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [recipientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/chat/conversation/${recipientId}`,
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
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/chat/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            receiverId: recipientId,
            content: newMessage,
            eventId: eventId || undefined
          })
        }
      )

      if (response.ok) {
        setNewMessage('')
        fetchMessages()
      } else {
        setError('Failed to send message')
      }
    } catch (err) {
      setError('Error sending message')
    }
  }

  if (loading) {
    return <div className="p-4">Loading messages...</div>
  }

  return (
    <Card className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start a conversation!
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
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-900'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" variant="primary">
            Send
          </Button>
        </div>
      </form>
    </Card>
  )
}
