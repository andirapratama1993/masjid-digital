import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'masjid-digital-secret-key-2024'
const COOKIE_NAME = 'masjid_auth'

// Default credentials (in production, store hashed in DB or env)
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin'

export interface AuthPayload {
  username: string
  role: 'admin'
  iat?: number
  exp?: number
}

export function verifyCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export function signToken(payload: Omit<AuthPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload
  } catch {
    return null
  }
}

export const AUTH_COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 8, // 8 hours
  path: '/',
}
