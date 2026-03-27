import { useState, useEffect } from 'react'
import Card from '../../ui/Card'
import Button from '../../ui/Button'
import { useAuth } from '../../../contexts/AuthContext'

export default function ChatInbox() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const { user } = useAuth()
  const token = localStorage.getItem('token')
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  useEffect(() => {
    fetchInbox()
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchInbox, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchInbox = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/inbox`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (Array.isArray(data)) {
        setConversations(data)
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to load inbox:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading conversations...</div>
  }

  return (
    <Card>
      <div className="divide-y">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.partnerId}
              className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => setSelectedConversation(conv)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{conv.partnerName}</h3>
                  <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-gray-500">
                    {new Date(conv.lastMessageTime).toLocaleDateString()}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
