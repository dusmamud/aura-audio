// Mock account session. localStorage only — the "sign in" is a demo:
// any name + email works, any password is accepted and never stored.
// Nothing is sent anywhere.
export interface MockAccount {
  name: string;
  email: string;
}

const KEY = 'aura-account';

export function getAccount(): MockAccount | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockAccount;
    return parsed && parsed.name && parsed.email ? parsed : null;
  } catch {
    return null;
  }
}

export function signIn(name: string, email: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ name: name.trim(), email: email.trim() }));
  } catch {
    // Private mode: session lasts for this page load only.
  }
}

export function signOut() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
