// src/lib/auth/jwt.ts
// Simple token implementation that doesn't require jsonwebtoken package

// For development purposes only - in production use a proper JWT library
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Simple base64 encoding/decoding functions
const encodeBase64 = (obj: any): string => {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
};

const decodeBase64 = (str: string): any => {
  try {
    return JSON.parse(Buffer.from(str, 'base64').toString());
  } catch (e) {
    return null;
  }
};

// Generate a simple token (base64 encoded JSON with expiration)
export const generateToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  const now = Date.now();
  const tokenData = {
    ...payload,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + TOKEN_EXPIRY_MS) / 1000)
  };
  
  return encodeBase64(tokenData);
};

// Verify the token by checking if it's valid and not expired
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = decodeBase64(token);
    
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return null;
    }
    
    return decoded as TokenPayload;
  } catch (error) {
    return null;
  }
}; 