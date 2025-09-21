"use client"

import { X, MessageCircle } from "lucide-react"

interface Message {
  id: string
  name: string
  initials: string
  message: string
  time: string
  unread: boolean
  color: string
}

interface MessagesModalProps {
  open: boolean
  onClose: () => void
}

export function MessagesModal({ open, onClose }: MessagesModalProps) {
  if (!open) return null

  const messages: Message[] = []

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-teal-700 rounded-t-3xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 text-white">
          <h2 className="text-xl font-semibold">Messages</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages List */}
        <div className="bg-gray-50 rounded-t-3xl flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages Yet</h3>
              <p className="text-gray-600">
                Your messages will appear here when you start chatting with other players.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-center gap-3 p-4 border-b border-gray-200">
                <div
                  className={`w-12 h-12 rounded-full ${message.color} flex items-center justify-center text-white font-semibold`}
                >
                  {message.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{message.name}</h3>
                    <span className="text-sm text-gray-500">{message.time}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{message.message}</p>
                </div>
                {message.unread && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
