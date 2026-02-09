import { useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../store/useStore';
import { useChatStore } from '../store/useStore';
import type { LoginRequest, RegisterRequest } from '../services/apiClient';

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, error, setUser, setToken, setIsLoading, setError, logout } =
    useAuthStore();

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.login(credentials);

      if (response.error) {
        setError(response.error);
        setIsLoading(false);
        return false;
      }

      if (response.data) {
        setToken(response.data.token);
        apiClient.setToken(response.data.token);
        setUser(response.data.user);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    },
    [setIsLoading, setError, setToken, setUser],
  );

  const register = useCallback(
    async (credentials: RegisterRequest) => {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.register(credentials);

      if (response.error) {
        setError(response.error);
        setIsLoading(false);
        return false;
      }

      if (response.data) {
        setToken(response.data.token);
        apiClient.setToken(response.data.token);
        setUser(response.data.user);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    },
    [setIsLoading, setError, setToken, setUser],
  );

  const handleLogout = useCallback(() => {
    logout();
    apiClient.clearToken();
  }, [logout]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout: handleLogout,
  };
};

export const useChat = () => {
  const {
    conversations,
    currentConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSendingMessage,
    error,
    setConversations,
    setCurrentConversation,
    setMessages,
    addMessage,
    setIsLoadingConversations,
    setIsLoadingMessages,
    setIsSendingMessage,
    setError,
    clearError,
  } = useChatStore();

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setError(null);

    const response = await apiClient.getConversations();

    if (response.error) {
      setError(response.error);
      setIsLoadingConversations(false);
      return;
    }

    if (response.data) {
      setConversations(response.data);
    }

    setIsLoadingConversations(false);
  }, [setIsLoadingConversations, setError, setConversations]);

  const loadConversation = useCallback(
    async (id: string) => {
      setIsLoadingMessages(true);
      setError(null);

      const response = await apiClient.getConversation(id);

      if (response.error) {
        setError(response.error);
        setIsLoadingMessages(false);
        return;
      }

      if (response.data) {
        setCurrentConversation(response.data);
      }

      setIsLoadingMessages(false);
    },
    [setIsLoadingMessages, setError, setCurrentConversation],
  );

  const loadMessages = useCallback(
    async (conversationId: string) => {
      setIsLoadingMessages(true);
      setError(null);

      const response = await apiClient.getMessages(conversationId);

      if (response.error) {
        setError(response.error);
        setIsLoadingMessages(false);
        return;
      }

      if (response.data) {
        setMessages(response.data);
      }

      setIsLoadingMessages(false);
    },
    [setIsLoadingMessages, setError, setMessages],
  );

  const createConversation = useCallback(
    async (title?: string, mode?: string) => {
      setError(null);

      const response = await apiClient.createConversation({
        title,
        mode,
      });

      if (response.error) {
        setError(response.error);
        return null;
      }

      if (response.data) {
        setConversations([response.data, ...conversations]);
        return response.data;
      }

      return null;
    },
    [conversations, setError, setConversations],
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      setIsSendingMessage(true);
      setError(null);

      const response = await apiClient.sendMessage(conversationId, content);

      if (response.error) {
        setError(response.error);
        setIsSendingMessage(false);
        return false;
      }

      if (response.data) {
        addMessage(response.data);
        setIsSendingMessage(false);
        return true;
      }

      setIsSendingMessage(false);
      return false;
    },
    [setIsSendingMessage, setError, addMessage],
  );

  return {
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
    clearError,
  };
};
