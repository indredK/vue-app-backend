import express, { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission';

const router = express.Router();

router.get('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, action, module, status, userId } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (action) {
      conditions.push(`action = $${paramCount++}`);
      values.push(action);
    }

    if (module) {
      conditions.push(`module = $${paramCount++}`);
      values.push(module);
    }

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (userId) {
      conditions.push(`user_id = $${paramCount++}`);
      values.push(parseInt(userId as string));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT l.*, u.username, u.nickname 
       FROM system_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...values, parseInt(limit as string), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM system_logs ${whereClause}`,
      values
    );

    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const logId = parseInt(req.params.id);

    const result = await query(
      `SELECT l.*, u.username, u.nickname 
       FROM system_logs l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.id = $1`,
      [logId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats/summary', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { days = 7 } = req.query;

    const totalLogs = await query(
      `SELECT COUNT(*) as count FROM system_logs WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'`,
      []
    );

    const successLogs = await query(
      `SELECT COUNT(*) as count FROM system_logs WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days' AND status = 'success'`,
      []
    );

    const errorLogs = await query(
      `SELECT COUNT(*) as count FROM system_logs WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days' AND status = 'error'`,
      []
    );

    const moduleStats = await query(
      `SELECT 
        module,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count
       FROM system_logs
       WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY module
       ORDER BY count DESC`,
      []
    );

    const actionStats = await query(
      `SELECT 
        action,
        COUNT(*) as count
       FROM system_logs
       WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY action
       ORDER BY count DESC
       LIMIT 10`,
      []
    );

    res.json({
      total: parseInt(totalLogs.rows[0].count),
      success: parseInt(successLogs.rows[0].count),
      error: parseInt(errorLogs.rows[0].count),
      byModule: moduleStats.rows,
      topActions: actionStats.rows
    });
  } catch (error) {
    console.error('Get log stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/cleanup', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.body;

    const result = await query(
      `DELETE FROM system_logs 
       WHERE created_at < CURRENT_DATE - INTERVAL '${days} days' 
       RETURNING *`,
      []
    );

    res.json({ 
      message: 'Logs cleaned up successfully',
      deletedCount: result.rowCount 
    });
  } catch (error) {
    console.error('Cleanup logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const logAction = async (
  userId: number | null,
  action: string,
  module: string,
  ip: string,
  userAgent: string,
  requestData: any,
  responseData: any,
  status: string = 'success',
  errorMessage: string = ''
) => {
  try {
    await query(
      `INSERT INTO system_logs (user_id, action, module, ip, user_agent, request_data, response_data, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        action,
        module,
        ip,
        userAgent,
        JSON.stringify(requestData || {}),
        JSON.stringify(responseData || {}),
        status,
        errorMessage
      ]
    );
  } catch (error) {
    console.error('Log action error:', error);
  }
};

export default router;
