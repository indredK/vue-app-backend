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
      `SELECT f.*, g.name, g.price, g.image, g.sales, g.stock, g.status
       FROM favorites f
       JOIN goods g ON f.goods_id = g.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/check/:userId/:goodsId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const goodsId = parseInt(req.params.goodsId);

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      'SELECT * FROM favorites WHERE user_id = $1 AND goods_id = $2',
      [userId, goodsId]
    );

    res.json({ isFavorite: result.rows.length > 0 });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, goodsId } = req.body;

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const existingFavorite = await query(
      'SELECT * FROM favorites WHERE user_id = $1 AND goods_id = $2',
      [userId, goodsId]
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(400).json({ error: 'Already in favorites' });
    }

    const result = await query(
      'INSERT INTO favorites (user_id, goods_id) VALUES ($1, $2) RETURNING *',
      [userId, goodsId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const favoriteId = parseInt(req.params.id);

    const favoriteResult = await query('SELECT * FROM favorites WHERE id = $1', [favoriteId]);

    if (favoriteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    const favorite = favoriteResult.rows[0];

    if (req.user?.userId !== favorite.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM favorites WHERE id = $1', [favoriteId]);

    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/user/:userId/goods/:goodsId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const goodsId = parseInt(req.params.goodsId);

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      'DELETE FROM favorites WHERE user_id = $1 AND goods_id = $2 RETURNING *',
      [userId, goodsId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
