import express, { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission';

const router = express.Router();

router.get('/goods/:goodsId', async (req: Request, res: Response) => {
  try {
    const goodsId = parseInt(req.params.goodsId);
    const { page = 1, limit = 20, rating } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let conditions = ['goods_id = $1', 'status = $2'];
    let values: any[] = [goodsId, 'active'];
    let paramCount = 3;

    if (rating) {
      conditions.push(`rating = $${paramCount++}`);
      values.push(parseInt(rating as string));
    }

    const whereClause = conditions.join(' AND ');

    const result = await query(
      `SELECT r.*, u.nickname, u.avatar 
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...values, parseInt(limit as string), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM reviews WHERE ${whereClause}`,
      values
    );

    const ratingStats = await query(
      `SELECT 
        COUNT(*) as total,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM reviews 
       WHERE goods_id = $1 AND status = $2`,
      [goodsId, 'active']
    );

    res.json({
      reviews: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      stats: ratingStats.rows[0]
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT r.*, g.name as goods_name, g.image as goods_image 
       FROM reviews r
       JOIN goods g ON r.goods_id = g.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);

    const result = await query(
      `SELECT r.*, u.nickname, u.avatar 
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, goodsId, orderId, rating, content, images } = req.body;

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const existingReview = await query(
      'SELECT id FROM reviews WHERE user_id = $1 AND goods_id = $2',
      [userId, goodsId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    if (orderId) {
      const orderResult = await query(
        'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
        [orderId, userId]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderResult.rows[0];

      if (order.status !== 'completed') {
        return res.status(400).json({ error: 'Can only review completed orders' });
      }
    }

    const result = await query(
      `INSERT INTO reviews (user_id, goods_id, order_id, rating, content, images)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        goodsId,
        orderId || null,
        rating,
        content || '',
        JSON.stringify(images || [])
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { rating, content, images } = req.body;

    const reviewResult = await query('SELECT * FROM reviews WHERE id = $1', [reviewId]);

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = reviewResult.rows[0];

    if (req.user?.userId !== review.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      updateFields.push(`rating = $${paramCount++}`);
      values.push(rating);
    }
    if (content !== undefined) {
      updateFields.push(`content = $${paramCount++}`);
      values.push(content);
    }
    if (images !== undefined) {
      updateFields.push(`images = $${paramCount++}`);
      values.push(JSON.stringify(images));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(reviewId);

    const result = await query(
      `UPDATE reviews SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);

    const reviewResult = await query('SELECT * FROM reviews WHERE id = $1', [reviewId]);

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = reviewResult.rows[0];

    if (req.user?.userId !== review.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM reviews WHERE id = $1', [reviewId]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/reply', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { reply } = req.body;

    const result = await query(
      `UPDATE reviews 
       SET reply = $1, reply_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [reply || '', reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Reply review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/status', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      `UPDATE reviews 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
