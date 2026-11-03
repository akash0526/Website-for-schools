import { randomBytes } from 'node:crypto';
import type { AuthProvider } from '../domain/ports.js';
import type { AdminUser } from '../domain/models.js';
import type { DatabaseClient } from '../data/supabase/client.js';
import { AppError } from '../middleware/errors.js';

export class DemoAuthProvider implements AuthProvider {
  private sessions = new Map<string, { user: AdminUser; expires: number }>();
  readonly demoUser: AdminUser = {
    id: 'demo-owner',
    email: 'principal@evergreen.example',
    name: 'Alex Morgan',
    role: 'owner',
  };
  login() {
    for (const [key, value] of this.sessions)
      if (value.expires < Date.now()) this.sessions.delete(key);
    const token = randomBytes(32).toString('hex');
    this.sessions.set(token, { user: this.demoUser, expires: Date.now() + 8 * 60 * 60 * 1000 });
    return { token, user: this.demoUser };
  }
  logout(token: string) {
    this.sessions.delete(token);
  }
  async resolveToken(token: string) {
    const session = this.sessions.get(token);
    if (!session || session.expires < Date.now()) return null;
    return session.user;
  }
}
export class SupabaseAuthProvider implements AuthProvider {
  constructor(private client: DatabaseClient) {}
  async resolveToken(token: string) {
    const { data, error } = await this.client.auth.getUser(token);
    if (error) {
      if (error.status && [400, 401, 403].includes(error.status)) return null;
      throw new AppError(
        503,
        'AUTH_UNAVAILABLE',
        'Sign-in is temporarily unavailable. Please try again.',
      );
    }
    if (!data.user) return null;
    const { data: profile, error: profileError } = await this.client
      .from('admin_profiles')
      .select('name,role')
      .eq('id', data.user.id)
      .maybeSingle();
    if (profileError)
      throw new AppError(503, 'AUTH_UNAVAILABLE', 'Could not verify your administrator access.');
    if (!profile || !['owner', 'editor'].includes(profile.role)) return null;
    return {
      id: data.user.id,
      email: data.user.email || '',
      name: profile.name || 'School Administrator',
      role: profile.role,
    } as AdminUser;
  }
}
