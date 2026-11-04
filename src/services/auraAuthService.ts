import { AuraUser } from '../types';

interface PendingOtp {
  email: string;
  name?: string;
  code: string;
  expiresAt: number; // timestamp
}

const STORAGE_KEYS = {
  CURRENT_USER: 'aura_auth_current_user',
  PENDING_OTP: 'aura_auth_pending_otp',
  USERS_REGISTRY: 'aura_auth_users_registry',
};

// Generate deterministic ID from email
export function generateUserId(email: string): string {
  const clean = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return `usr_${Math.abs(hash).toString(36)}_${clean.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;
}

export function getCurrentAuraUser(): AuraUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[Aura Auth] Error reading current user:', err);
    return null;
  }
}

export function saveCurrentAuraUser(user: AuraUser): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    // Also update users registry
    const registryRaw = localStorage.getItem(STORAGE_KEYS.USERS_REGISTRY);
    const registry: Record<string, AuraUser> = registryRaw ? JSON.parse(registryRaw) : {};
    registry[user.email.toLowerCase()] = user;
    localStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(registry));
  } catch (err) {
    console.warn('[Aura Auth] Error saving current user:', err);
  }
}

export function clearCurrentAuraUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } catch (err) {
    console.warn('[Aura Auth] Error clearing current user:', err);
  }
}

/**
 * Sends a 6-digit verification code to the specified email address
 */
export function sendEmailVerificationCode(
  email: string,
  name?: string
): { success: boolean; code: string; expiresAt: number; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, code: '', expiresAt: 0, error: 'Please enter a valid email address.' };
  }

  // Generate 6-digit numeric OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const pending: PendingOtp = {
    email: cleanEmail,
    name: name?.trim() || undefined,
    code,
    expiresAt,
  };

  try {
    localStorage.setItem(STORAGE_KEYS.PENDING_OTP, JSON.stringify(pending));
  } catch (e) {
    console.warn('[Aura Auth] Error storing pending OTP:', e);
  }

  return { success: true, code, expiresAt };
}

/**
 * Gets the current pending verification code info if active and unexpired
 */
export function getPendingOtp(): PendingOtp | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_OTP);
    if (!raw) return null;
    const pending: PendingOtp = JSON.parse(raw);
    if (Date.now() > pending.expiresAt) {
      localStorage.removeItem(STORAGE_KEYS.PENDING_OTP);
      return null;
    }
    return pending;
  } catch {
    return null;
  }
}

/**
 * Verifies the 6-digit code and signs in the user
 */
export function verifyEmailCode(
  email: string,
  code: string
): { success: boolean; user?: AuraUser; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  const pending = getPendingOtp();

  if (!pending || pending.email !== cleanEmail) {
    return {
      success: false,
      error: 'No active verification code found for this email. Please request a new code.',
    };
  }

  if (Date.now() > pending.expiresAt) {
    return {
      success: false,
      error: 'This verification code has expired. Please request a new one.',
    };
  }

  if (pending.code !== cleanCode) {
    return {
      success: false,
      error: 'Incorrect verification code. Please check your email and try again.',
    };
  }

  // Find existing user in registry or create new
  let existingUser: AuraUser | null = null;
  try {
    const registryRaw = localStorage.getItem(STORAGE_KEYS.USERS_REGISTRY);
    if (registryRaw) {
      const registry: Record<string, AuraUser> = JSON.parse(registryRaw);
      existingUser = registry[cleanEmail] || null;
    }
  } catch {
    // ignore
  }

  const now = new Date().toISOString();
  const user: AuraUser = {
    id: existingUser?.id || generateUserId(cleanEmail),
    email: cleanEmail,
    name: pending.name || existingUser?.name || cleanEmail.split('@')[0],
    createdAt: existingUser?.createdAt || now,
    lastLoginAt: now,
  };

  saveCurrentAuraUser(user);
  localStorage.removeItem(STORAGE_KEYS.PENDING_OTP);

  return { success: true, user };
}
