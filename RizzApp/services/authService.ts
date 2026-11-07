// Compatibility exports: there is only one authentication implementation.
export { getCurrentUser, isAuthenticated, logout as signOut } from '../api/authApi';
export async function signIn(_email: string, _password: string): Promise<never> {
  throw new Error('Use the secure Clerk sign-in screen');
}
