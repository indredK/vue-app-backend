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
      'SELECT * FROM cart_items WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get cart items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, goodsId, name, price, image, quantity = 1, selected = true } = req.body;

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const existingItem = await query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND goods_id = $2',
      [userId, goodsId]
    );

    if (existingItem.rows.length > 0) {
      const result = await query(
        'UPDATE cart_items SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [quantity, existingItem.rows[0].id]
      );
      return res.json(result.rows[0]);
    }

    const result = await query(
      `INSERT INTO cart_items (user_id, goods_id, name, price, image, quantity, selected)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, goodsId, name, price, image, quantity, selected]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add cart item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cartItemId = parseInt(req.params.id);
    const { quantity, selected } = req.body;

    const cartItemResult = await query('SELECT * FROM cart_items WHERE id = $1', [cartItemId]);

    if (cartItemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const cartItem = cartItemResult.rows[0];

    if (req.user?.userId !== cartItem.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (quantity !== undefined) {
      updateFields.push(`quantity = $${paramCount++}`);
      values.push(quantity);
    }
    if (selected !== undefined) {
      updateFields.push(`selected = $${paramCount++}`);
      values.push(selected);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(cartItemId);

    const result = await query(
      `UPDATE cart_items SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cartItemId = parseInt(req.params.id);

    const cartItemResult = await query('SELECT * FROM cart_items WHERE id = $1', [cartItemId]);

    if (cartItemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const cartItem = cartItemResult.rows[0];

    if (req.user?.userId !== cartItem.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM cart_items WHERE id = $1', [cartItemId]);

    res.json({ message: 'Cart item deleted successfully' });
  } catch (error) {
    console.error('Delete cart item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/clear/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/select-all/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { selected } = req.body;

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query(
      'UPDATE cart_items SET selected = $1 WHERE user_id = $2',
      [selected, userId]
    );

    res.json({ message: 'Cart items updated successfully' });
  } catch (error) {
    console.error('Update cart selection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
