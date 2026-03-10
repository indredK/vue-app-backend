import express, { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      keyword = '', 
      categoryId, 
      minPrice, 
      maxPrice, 
      sort = 'created_at', 
      order = 'DESC',
      isHot,
      isNew,
      isRecommend
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const validSorts = ['created_at', 'price', 'sales', 'name'];
    const sortField = validSorts.includes(sort as string) ? sort : 'created_at';
    const sortOrder = (order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const conditions: string[] = ['status = $1'];
    const values: any[] = ['active'];
    let paramCount = 2;

    if (keyword) {
      conditions.push(`(name ILIKE $${paramCount++} OR description ILIKE $${paramCount++})`);
      values.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (categoryId) {
      conditions.push(`category_id = $${paramCount++}`);
      values.push(parseInt(categoryId as string));
    }

    if (minPrice) {
      conditions.push(`price >= $${paramCount++}`);
      values.push(parseFloat(minPrice as string));
    }

    if (maxPrice) {
      conditions.push(`price <= $${paramCount++}`);
      values.push(parseFloat(maxPrice as string));
    }

    if (isHot === 'true') {
      conditions.push(`is_hot = $${paramCount++}`);
      values.push(true);
    }

    if (isNew === 'true') {
      conditions.push(`is_new = $${paramCount++}`);
      values.push(true);
    }

    if (isRecommend === 'true') {
      conditions.push(`is_recommend = $${paramCount++}`);
      values.push(true);
    }

    const whereClause = conditions.join(' AND ');

    const result = await query(
      `SELECT * FROM goods 
       WHERE ${whereClause}
       ORDER BY ${sortField} ${sortOrder}
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...values, parseInt(limit as string), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM goods WHERE ${whereClause}`,
      values
    );

    res.json({
      goods: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error) {
    console.error('Get goods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/hot', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT * FROM goods 
       WHERE status = $1 AND is_hot = $2 
       ORDER BY sales DESC 
       LIMIT $3`,
      ['active', true, parseInt(limit as string)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get hot goods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/new', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT * FROM goods 
       WHERE status = $1 AND is_new = $2 
       ORDER BY created_at DESC 
       LIMIT $3`,
      ['active', true, parseInt(limit as string)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get new goods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/recommend', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT * FROM goods 
       WHERE status = $1 AND is_recommend = $2 
       ORDER BY sales DESC 
       LIMIT $3`,
      ['active', true, parseInt(limit as string)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get recommend goods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const goodsId = parseInt(req.params.id);
    const result = await query('SELECT * FROM goods WHERE id = $1', [goodsId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goods not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get goods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/batch/:ids', async (req: Request, res: Response) => {
  try {
    const ids = req.params.ids.split(',').map(id => parseInt(id));
    
    const result = await query(
      `SELECT * FROM goods WHERE id = ANY($1) AND status = $2`,
      [ids, 'active']
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get goods by ids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      categoryId, 
      name, 
      price, 
      originalPrice, 
      image, 
      images, 
      stock, 
      specs, 
      description, 
      tags, 
      status, 
      isHot, 
      isNew, 
      isRecommend 
    } = req.body;

    const result = await query(
      `INSERT INTO goods (category_id, name, price, original_price, image, images, stock, specs, description, tags, status, is_hot, is_new, is_recommend)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        categoryId || null,
        name,
        price,
        originalPrice || null,
        image || '',
        JSON.stringify(images || []),
        stock || 0,
        JSON.stringify(specs || {}),
        description || '',
        JSON.stringify(tags || []),
        status || 'active',
        isHot || false,
        isNew || false,
        isRecommend || false
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create goods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const goodsId = parseInt(req.params.id);
    const { 
      categoryId, 
      name, 
      price, 
      originalPrice, 
      image, 
      images, 
      stock, 
      specs, 
      description, 
      tags, 
      status, 
      isHot, 
      isNew, 
      isRecommend 
    } = req.body;

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (categoryId !== undefined) {
      updateFields.push(`category_id = $${paramCount++}`);
      values.push(categoryId);
    }
    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (price !== undefined) {
      updateFields.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (originalPrice !== undefined) {
      updateFields.push(`original_price = $${paramCount++}`);
      values.push(originalPrice);
    }
    if (image !== undefined) {
      updateFields.push(`image = $${paramCount++}`);
      values.push(image);
    }
    if (images !== undefined) {
      updateFields.push(`images = $${paramCount++}`);
      values.push(JSON.stringify(images));
    }
    if (stock !== undefined) {
      updateFields.push(`stock = $${paramCount++}`);
      values.push(stock);
    }
    if (specs !== undefined) {
      updateFields.push(`specs = $${paramCount++}`);
      values.push(JSON.stringify(specs));
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramCount++}`);
      values.push(JSON.stringify(tags));
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (isHot !== undefined) {
      updateFields.push(`is_hot = $${paramCount++}`);
      values.push(isHot);
    }
    if (isNew !== undefined) {
      updateFields.push(`is_new = $${paramCount++}`);
      values.push(isNew);
    }
    if (isRecommend !== undefined) {
      updateFields.push(`is_recommend = $${paramCount++}`);
      values.push(isRecommend);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(goodsId);

    const result = await query(
      `UPDATE goods SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goods not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update goods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const goodsId = parseInt(req.params.id);

    const result = await query('DELETE FROM goods WHERE id = $1 RETURNING *', [goodsId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goods not found' });
    }

    res.json({ message: 'Goods deleted successfully' });
  } catch (error) {
    console.error('Delete goods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/stock', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const goodsId = parseInt(req.params.id);
    const { stock, operation } = req.body;

    let queryText = '';
    let values: any[] = [];

    if (operation === 'add') {
      queryText = 'UPDATE goods SET stock = stock + $1 WHERE id = $2 RETURNING *';
      values = [stock, goodsId];
    } else if (operation === 'subtract') {
      queryText = 'UPDATE goods SET stock = stock - $1 WHERE id = $2 RETURNING *';
      values = [stock, goodsId];
    } else {
      queryText = 'UPDATE goods SET stock = $1 WHERE id = $2 RETURNING *';
      values = [stock, goodsId];
    }

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goods not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update goods stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
