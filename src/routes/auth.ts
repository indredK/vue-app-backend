import express, { Request, Response } from 'express';
import { query } from '../db';
import { hashPassword, comparePassword, generateToken, TokenPayload } from '../utils/auth';

const router = express.Router();

interface RegisterRequest {
  username: string;
  password: string;
  nickname?: string;
  phone?: string;
  email?: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, nickname, phone, email }: RegisterRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const passwordHash = await hashPassword(password);

    const result = await query(
      `INSERT INTO users (username, password_hash, nickname, phone, email, role_id)
       VALUES ($1, $2, $3, $4, $5, 2)
       RETURNING id, username, nickname, phone, email, role_id, points, avatar`,
      [username, passwordHash, nickname || '用户', phone || '', email || '']
    );

    const user = result.rows[0];
    const tokenPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
      roleId: user.role_id
    };
    const token = generateToken(tokenPayload);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        phone: user.phone,
        email: user.email,
        roleId: user.role_id,
        points: user.points,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await query(
      'SELECT * FROM users WHERE username = $1 AND status = $2',
      [username, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const tokenPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
      roleId: user.role_id
    };
    const token = generateToken(tokenPayload);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        phone: user.phone,
        email: user.email,
        roleId: user.role_id,
        points: user.points,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
