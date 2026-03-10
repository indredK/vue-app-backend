import express, { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/user/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      'SELECT * FROM points_records WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get points records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/balance/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const userResult = await query('SELECT points FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const points = userResult.rows[0].points;

    const statsResult = await query(
      `SELECT 
        COUNT(CASE WHEN type = 'earn' THEN 1 END) as earn_count,
        COUNT(CASE WHEN type = 'spend' THEN 1 END) as spend_count,
        COALESCE(SUM(CASE WHEN type = 'earn' THEN amount ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN type = 'spend' THEN amount ELSE 0 END), 0) as total_spent
       FROM points_records 
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      balance: points,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Get points balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/earn', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, amount, description, relatedType, relatedId } = req.body;

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const newBalance = user.points + amount;

    await query(
      'UPDATE users SET points = $1 WHERE id = $2',
      [newBalance, userId]
    );

    const recordResult = await query(
      `INSERT INTO points_records (user_id, type, amount, balance, description, related_type, related_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        'earn',
        amount,
        newBalance,
        description || '积分获得',
        relatedType || '',
        relatedId || 0
      ]
    );

    res.status(201).json({
      record: recordResult.rows[0],
      balance: newBalance
    });
  } catch (error) {
    console.error('Earn points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/spend', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, amount, description, relatedType, relatedId } = req.body;

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.points < amount) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    const newBalance = user.points - amount;

    await query(
      'UPDATE users SET points = $1 WHERE id = $2',
      [newBalance, userId]
    );

    const recordResult = await query(
      `INSERT INTO points_records (user_id, type, amount, balance, description, related_type, related_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        'spend',
        amount,
        newBalance,
        description || '积分消费',
        relatedType || '',
        relatedId || 0
      ]
    );

    res.status(201).json({
      record: recordResult.rows[0],
      balance: newBalance
    });
  } catch (error) {
    console.error('Spend points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refund', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, amount, description, relatedType, relatedId } = req.body;

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const newBalance = user.points + amount;

    await query(
      'UPDATE users SET points = $1 WHERE id = $2',
      [newBalance, userId]
    );

    const recordResult = await query(
      `INSERT INTO points_records (user_id, type, amount, balance, description, related_type, related_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        'earn',
        amount,
        newBalance,
        description || '积分返还',
        relatedType || '',
        relatedId || 0
      ]
    );

    res.status(201).json({
      record: recordResult.rows[0],
      balance: newBalance
    });
  } catch (error) {
    console.error('Refund points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
