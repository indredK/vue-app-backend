import express, { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE status = $1 ORDER BY sort_order ASC, id ASC',
      ['active']
    );

    const categories = result.rows;

    const buildTree = (parentId: number = 0): any[] => {
      return categories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }));
    };

    res.json(buildTree());
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/flat', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE status = $1 ORDER BY sort_order ASC, id ASC',
      ['active']
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const result = await query('SELECT * FROM categories WHERE id = $1', [categoryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/goods', async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const validSorts = ['created_at', 'price', 'sales', 'name'];
    const sortField = validSorts.includes(sort as string) ? sort : 'created_at';
    const sortOrder = (order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await query(
      `SELECT * FROM goods 
       WHERE category_id = $1 AND status = $2 
       ORDER BY ${sortField} ${sortOrder}
       LIMIT $3 OFFSET $4`,
      [categoryId, 'active', parseInt(limit as string), offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM goods WHERE category_id = $1 AND status = $2',
      [categoryId, 'active']
    );

    res.json({
      goods: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error) {
    console.error('Get category goods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, parentId, sortOrder, icon, status } = req.body;

    const result = await query(
      `INSERT INTO categories (name, parent_id, sort_order, icon, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, parentId || 0, sortOrder || 0, icon || '', status || 'active']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name, parentId, sortOrder, icon, status } = req.body;

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (parentId !== undefined) {
      updateFields.push(`parent_id = $${paramCount++}`);
      values.push(parentId);
    }
    if (sortOrder !== undefined) {
      updateFields.push(`sort_order = $${paramCount++}`);
      values.push(sortOrder);
    }
    if (icon !== undefined) {
      updateFields.push(`icon = $${paramCount++}`);
      values.push(icon);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(categoryId);

    const result = await query(
      `UPDATE categories SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);

    const childResult = await query('SELECT id FROM categories WHERE parent_id = $1', [categoryId]);

    if (childResult.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with subcategories' });
    }

    const goodsResult = await query('SELECT id FROM goods WHERE category_id = $1', [categoryId]);

    if (goodsResult.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with goods' });
    }

    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [categoryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
