import { useState, useEffect } from 'react'
import { MessageCircle, Search } from 'lucide-react'
import DirectMessageChat from '../components/messaging/DirectMessageChat'
import { useAuth } from '../contexts/AuthContext'

export default function MessagesPage() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  
  const { user } = useAuth()
  const token = localStorage.getItem('token')
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  useEffect(() => {
    fetchInbox()
    
    // Check if there's a conversation selected from event details
    const selectedConv = localStorage.getItem('selectedConversation')
    if (selectedConv) {
      try {
        const conv = JSON.parse(selectedConv)
        setSelectedConversation(conv)
        localStorage.removeItem('selectedConversation')
      } catch (e) {
        console.error('Failed to parse selected conversation:', e)
      }
    }
    
    // Poll for new conversations every 5 seconds
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchInbox()
    setRefreshing(false)
  }

  const filteredConversations = conversations.filter(conv =>
    conv.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCloseChat = () => {
    setSelectedConversation(null)
    handleRefresh()
  }

  if (selectedConversation) {
    return (
      <DirectMessageChat
        recipientId={selectedConversation.partnerId}
        recipientName={selectedConversation.partnerName}
        onClose={handleCloseChat}
      />
    )
  }

  return (
    <div className="full-height page-background">
      <div style={{maxWidth: '56rem', margin: '0 auto'}}>
        {/* Header */}
        <div className="white-background border-b border-gray-200">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="text-primary-600" size={32} />
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            </div>
            <p className="text-gray-600">Connect and collaborate with organizers and volunteers</p>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 white-background border-b border-gray-200">
          <div style={{position: 'relative'}}>
            <Search className="absolute text-gray-400" style={{left: '0.75rem', top: '0.75rem'}} size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300"
              style={{paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem'}}
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading conversations...</div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="white-background rounded-lg p-12 text-center border border-gray-200">
              <MessageCircle className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {conversations.length === 0 ? 'No Conversations Yet' : 'No Results Found'}
              </h3>
              <p className="text-gray-600">
                {conversations.length === 0 
                  ? 'Start a conversation with an organizer or volunteer' 
                  : 'Try searching with different keywords'}
              </p>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.partnerId}
                  onClick={() => setSelectedConversation(conversation)}
                  className="white-background rounded-lg p-4 border border-gray-200 text-left"
                  style={{width: '100%', textAlign: 'left'}}
                >
                  <div className="flex items-start justify-between">
                    <div style={{flex: 1, minWidth: 0}}>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {conversation.partnerName}
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full" style={{width: '1.5rem', height: '1.5rem'}}>
                            {conversation.unreadCount}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1" style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {conversation.lastMessage}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 ml-4" style={{whiteSpace: 'nowrap'}}>
                      {new Date(conversation.lastMessageTime).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
