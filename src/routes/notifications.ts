import express, { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/user/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { page = 1, limit = 20, isRead } = req.query;

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let conditions = ['user_id = $1'];
    let values: any[] = [userId];
    let paramCount = 2;

    if (isRead !== undefined) {
      conditions.push(`is_read = $${paramCount++}`);
      values.push(isRead === 'true');
    }

    const whereClause = conditions.join(' AND ');

    const result = await query(
      `SELECT * FROM notifications 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...values, parseInt(limit as string), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`,
      values
    );

    const unreadCount = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      notifications: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      unreadCount: parseInt(unreadCount.rows[0].count)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/unread-count/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);

    const result = await query('SELECT * FROM notifications WHERE id = $1', [notificationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = result.rows[0];

    if (req.user?.userId !== notification.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type, title, content, data } = req.body;

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `INSERT INTO notifications (user_id, type, title, content, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        type,
        title,
        content || '',
        JSON.stringify(data || {})
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);

    const notificationResult = await query('SELECT * FROM notifications WHERE id = $1', [notificationId]);

    if (notificationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = notificationResult.rows[0];

    if (req.user?.userId !== notification.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [notificationId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/read-all/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);

    const notificationResult = await query('SELECT * FROM notifications WHERE id = $1', [notificationId]);

    if (notificationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = notificationResult.rows[0];

    if (req.user?.userId !== notification.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM notifications WHERE id = $1', [notificationId]);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
