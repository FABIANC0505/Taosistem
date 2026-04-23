import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'change-me-in-production';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);
const ALGORITHM = 'HS256';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hashed);
  } catch (error) {
    return false;
  }
}

export async function createAccessToken(data: Record<string, any>, minutes = 480): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + minutes * 60;
  
  return new SignJWT(data)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<Record<string, any> | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: [ALGORITHM],
    });
    return payload;
  } catch (error) {
    return null;
  }
}
