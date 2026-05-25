import { afterEach, describe, expect, it } from 'vitest';
import { clearSessionStorage, persistSessionToStorage, readSession } from '../sessionStorage';

afterEach(() => {
  clearSessionStorage();
});

describe('sessionStorage service', () => {
  it('persists and reads session data', () => {
    persistSessionToStorage({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: {
        id: 'u-1',
        fullName: 'Test User',
        email: 'test@company.dev',
        role: 'Customer',
      },
    });

    const session = readSession();

    expect(session.token).toBe('access-token');
    expect(session.refreshToken).toBe('refresh-token');
    expect(session.user?.email).toBe('test@company.dev');
  });

  it('clears session data', () => {
    persistSessionToStorage({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: {
        id: 'u-2',
        fullName: 'Second User',
        email: 'second@company.dev',
        role: 'Customer',
      },
    });

    clearSessionStorage();

    const session = readSession();
    expect(session.token).toBeNull();
    expect(session.refreshToken).toBeNull();
    expect(session.user).toBeNull();
  });
});
