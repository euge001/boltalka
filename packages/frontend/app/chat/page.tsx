'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useApiHooks';
import { useChat } from '@/hooks/useApiHooks';
import { ConversationList, MessageList, MessageInput } from '@/components/ChatComponents';
import { Button } from '@/components/ui/Button';

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const {
    conversations,
    currentConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSendingMessage,
    error,
    loadConversations,
    loadConversation,
    loadMessages,
    createConversation,
    sendMessage,
  } = useChat();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, mounted, router]);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadConversations();
    }
  }, [mounted, isAuthenticated, loadConversations]);

  const handleSelectConversation = async (conv: any) => {
    await loadConversation(conv.id);
    await loadMessages(conv.id);
  };

  const handleCreateNew = async () => {
    const newConv = await createConversation('New Chat', 'chat');
    if (newConv) {
      await loadConversation(newConv.id);
    }
  };

  const handleSendMessage = async (content: string): Promise<boolean> => {
    if (!currentConversation) return false;
    return await sendMessage(currentConversation.id, content);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!mounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Boltalka</h1>
          <span className="text-sm text-gray-600">v2.0.0</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{user?.name || user?.username}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>

          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4 bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-lg shadow overflow-hidden">
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversation?.id}
            onSelectConversation={handleSelectConversation}
            onCreateNew={handleCreateNew}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col overflow-hidden">
          {currentConversation ? (
            <>
              <div className="border-b p-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {currentConversation.title || 'Untitled Conversation'}
                </h2>
                <p className="text-sm text-gray-500">{currentConversation.mode || 'chat'} mode</p>
              </div>

              <MessageList messages={messages} isLoading={isLoadingMessages} userId={user?.id} />

              <MessageInput onSendMessage={handleSendMessage} isLoading={isSendingMessage} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Select a conversation to start chatting</p>
                <p className="text-sm">or create a new one from the sidebar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
