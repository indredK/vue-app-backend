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
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const addressId = parseInt(req.params.id);
    const result = await query('SELECT * FROM addresses WHERE id = $1', [addressId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const address = result.rows[0];

    if (req.user?.userId !== address.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(address);
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      userId, 
      receiverName, 
      receiverPhone, 
      province, 
      city, 
      district, 
      detailAddress, 
      postalCode, 
      isDefault 
    } = req.body;

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (isDefault) {
      await query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const result = await query(
      `INSERT INTO addresses (user_id, receiver_name, receiver_phone, province, city, district, detail_address, postal_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        receiverName,
        receiverPhone,
        province,
        city,
        district,
        detailAddress,
        postalCode || '',
        isDefault || false
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const addressId = parseInt(req.params.id);
    const { 
      receiverName, 
      receiverPhone, 
      province, 
      city, 
      district, 
      detailAddress, 
      postalCode, 
      isDefault 
    } = req.body;

    const addressResult = await query('SELECT * FROM addresses WHERE id = $1', [addressId]);

    if (addressResult.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const address = addressResult.rows[0];

    if (req.user?.userId !== address.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (isDefault && !address.is_default) {
      await query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1',
        [address.user_id]
      );
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (receiverName !== undefined) {
      updateFields.push(`receiver_name = $${paramCount++}`);
      values.push(receiverName);
    }
    if (receiverPhone !== undefined) {
      updateFields.push(`receiver_phone = $${paramCount++}`);
      values.push(receiverPhone);
    }
    if (province !== undefined) {
      updateFields.push(`province = $${paramCount++}`);
      values.push(province);
    }
    if (city !== undefined) {
      updateFields.push(`city = $${paramCount++}`);
      values.push(city);
    }
    if (district !== undefined) {
      updateFields.push(`district = $${paramCount++}`);
      values.push(district);
    }
    if (detailAddress !== undefined) {
      updateFields.push(`detail_address = $${paramCount++}`);
      values.push(detailAddress);
    }
    if (postalCode !== undefined) {
      updateFields.push(`postal_code = $${paramCount++}`);
      values.push(postalCode);
    }
    if (isDefault !== undefined) {
      updateFields.push(`is_default = $${paramCount++}`);
      values.push(isDefault);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(addressId);

    const result = await query(
      `UPDATE addresses SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const addressId = parseInt(req.params.id);

    const addressResult = await query('SELECT * FROM addresses WHERE id = $1', [addressId]);

    if (addressResult.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const address = addressResult.rows[0];

    if (req.user?.userId !== address.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM addresses WHERE id = $1', [addressId]);

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/default', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const addressId = parseInt(req.params.id);

    const addressResult = await query('SELECT * FROM addresses WHERE id = $1', [addressId]);

    if (addressResult.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const address = addressResult.rows[0];

    if (req.user?.userId !== address.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query(
      'UPDATE addresses SET is_default = false WHERE user_id = $1',
      [address.user_id]
    );

    const result = await query(
      'UPDATE addresses SET is_default = true WHERE id = $1 RETURNING *',
      [addressId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
