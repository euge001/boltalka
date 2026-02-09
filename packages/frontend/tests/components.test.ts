import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

describe('Frontend Components', () => {
  const frontendDir = process.cwd();

  describe('Component Files', () => {
    it('should have UI components', () => {
      const uiComponentPath = path.join(frontendDir, 'components/ui/Button.tsx');
      expect(fs.existsSync(uiComponentPath)).toBe(true);
    });

    it('should have auth forms component', () => {
      const authFormsPath = path.join(frontendDir, 'components/AuthForms.tsx');
      expect(fs.existsSync(authFormsPath)).toBe(true);
    });

    it('should have chat components', () => {
      const chatComponentsPath = path.join(frontendDir, 'components/ChatComponents.tsx');
      expect(fs.existsSync(chatComponentsPath)).toBe(true);
    });
  });

  describe('Page Files', () => {
    it('should have root page', () => {
      const rootPagePath = path.join(frontendDir, 'app/page.tsx');
      expect(fs.existsSync(rootPagePath)).toBe(true);
    });

    it('should have login page', () => {
      const loginPagePath = path.join(frontendDir, 'app/login/page.tsx');
      expect(fs.existsSync(loginPagePath)).toBe(true);
    });

    it('should have register page', () => {
      const registerPagePath = path.join(frontendDir, 'app/register/page.tsx');
      expect(fs.existsSync(registerPagePath)).toBe(true);
    });

    it('should have chat page', () => {
      const chatPagePath = path.join(frontendDir, 'app/chat/page.tsx');
      expect(fs.existsSync(chatPagePath)).toBe(true);
    });
  });

  describe('Service Files', () => {
    it('should have API client service', () => {
      const apiClientPath = path.join(frontendDir, 'services/apiClient.ts');
      expect(fs.existsSync(apiClientPath)).toBe(true);
    });

    it('should have Zustand store', () => {
      const storePath = path.join(frontendDir, 'store/useStore.ts');
      expect(fs.existsSync(storePath)).toBe(true);
    });

    it('should have custom hooks', () => {
      const hooksPath = path.join(frontendDir, 'hooks/useApiHooks.ts');
      expect(fs.existsSync(hooksPath)).toBe(true);
    });
  });

  describe('Component Content', () => {
    it('should export Button component', () => {
      const uiPath = path.join(frontendDir, 'components/ui/Button.tsx');
      const content = fs.readFileSync(uiPath, 'utf-8');
      expect(content).toContain('export const Button');
      expect(content).toContain('interface ButtonProps');
    });

    it('should export LoginForm component', () => {
      const authPath = path.join(frontendDir, 'components/AuthForms.tsx');
      const content = fs.readFileSync(authPath, 'utf-8');
      expect(content).toContain('export const LoginForm');
      expect(content).toContain('export const RegisterForm');
    });

    it('should export chat components', () => {
      const chatPath = path.join(frontendDir, 'components/ChatComponents.tsx');
      const content = fs.readFileSync(chatPath, 'utf-8');
      expect(content).toContain('export const ConversationList');
      expect(content).toContain('export const MessageList');
      expect(content).toContain('export const MessageInput');
    });
  });

  describe('Store and Hooks', () => {
    it('should export auth store', () => {
      const storePath = path.join(frontendDir, 'store/useStore.ts');
      const content = fs.readFileSync(storePath, 'utf-8');
      expect(content).toContain('export const useAuthStore');
      expect(content).toContain('export const useChatStore');
    });

    it('should export custom hooks', () => {
      const hooksPath = path.join(frontendDir, 'hooks/useApiHooks.ts');
      const content = fs.readFileSync(hooksPath, 'utf-8');
      expect(content).toContain('export const useAuth');
      expect(content).toContain('export const useChat');
    });

    it('should export API client', () => {
      const apiPath = path.join(frontendDir, 'services/apiClient.ts');
      const content = fs.readFileSync(apiPath, 'utf-8');
      expect(content).toContain('export class ApiClient');
      expect(content).toContain('export const apiClient');
    });
  });
});
