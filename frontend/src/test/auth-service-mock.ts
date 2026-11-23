export function createAuthServiceMock() {
  return {
    login: vi.fn(),
    register: vi.fn(),
    refreshSession: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    getCurrentUser: vi.fn(),
    checkUsername: vi.fn(),
    checkEmail: vi.fn(),
    getGithubAuthStatus: vi.fn(),
    getGithubLoginUrl: vi.fn(() => 'http://localhost:3000/api/v1/auth/github'),
    completeOnboarding: vi.fn(),
  };
}
