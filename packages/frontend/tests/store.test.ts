import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/useStore';
import { useChatStore } from '../store/useStore';
import type { User } from '../store/useStore';

describe('Zustand Stores', () => {
  describe('useAuthStore', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    });

    it('should initialize with default state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set user', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      };

      useAuthStore.getState().setUser(user);
      const state = useAuthStore.getState();

      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set token', () => {
      useAuthStore.getState().setToken('test-token');
      const state = useAuthStore.getState();

      expect(state.token).toBe('test-token');
    });

    it('should set loading state', () => {
      useAuthStore.getState().setIsLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setIsLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set error', () => {
      useAuthStore.getState().setError('Test error');
      expect(useAuthStore.getState().error).toBe('Test error');
    });

    it('should logout', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      };

      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setToken('test-token');
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('useChatStore', () => {
    beforeEach(() => {
      useChatStore.setState({
        conversations: [],
        currentConversation: null,
        messages: [],
        isLoadingConversations: false,
        isLoadingMessages: false,
        isSendingMessage: false,
        error: null,
      });
    });

    it('should initialize with default state', () => {
      const state = useChatStore.getState();
      expect(state.conversations).toEqual([]);
      expect(state.currentConversation).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.isLoadingConversations).toBe(false);
      expect(state.isLoadingMessages).toBe(false);
      expect(state.isSendingMessage).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set conversations', () => {
      const convs = [
        {
          id: '1',
          userId: 'user1',
          title: 'Test',
          mode: 'chat',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      useChatStore.getState().setConversations(convs);
      expect(useChatStore.getState().conversations).toEqual(convs);
    });

    it('should set current conversation', () => {
      const conv = {
        id: '1',
        userId: 'user1',
        title: 'Test',
        mode: 'chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useChatStore.getState().setCurrentConversation(conv);
      expect(useChatStore.getState().currentConversation).toEqual(conv);
    });

    it('should set messages', () => {
      const msgs = [
        {
          id: '1',
          conversationId: 'conv1',
          userId: 'user1',
          role: 'user',
          content: 'Hello',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      useChatStore.getState().setMessages(msgs);
      expect(useChatStore.getState().messages).toEqual(msgs);
    });

    it('should add message', () => {
      const msg = {
        id: '1',
        conversationId: 'conv1',
        userId: 'user1',
        role: 'user',
        content: 'Hello',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useChatStore.getState().addMessage(msg);
      expect(useChatStore.getState().messages).toContain(msg);
    });

    it('should set loading states', () => {
      useChatStore.getState().setIsLoadingConversations(true);
      expect(useChatStore.getState().isLoadingConversations).toBe(true);

      useChatStore.getState().setIsLoadingMessages(true);
      expect(useChatStore.getState().isLoadingMessages).toBe(true);

      useChatStore.getState().setIsSendingMessage(true);
      expect(useChatStore.getState().isSendingMessage).toBe(true);
    });

    it('should set and clear errors', () => {
      useChatStore.getState().setError('Test error');
      expect(useChatStore.getState().error).toBe('Test error');

      useChatStore.getState().clearError();
      expect(useChatStore.getState().error).toBeNull();
    });
  });
});
