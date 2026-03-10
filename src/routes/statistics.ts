import express, { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission';

const router = express.Router();

router.get('/overview', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const todayOrders = await query(
      'SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as total FROM orders WHERE DATE(created_at) = CURRENT_DATE',
      []
    );

    const yesterdayOrders = await query(
      'SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as total FROM orders WHERE DATE(created_at) = CURRENT_DATE - INTERVAL \'1 day\'',
      []
    );

    const thisMonthOrders = await query(
      'SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as total FROM orders WHERE created_at >= $1',
      [thisMonth]
    );

    const lastMonthOrders = await query(
      'SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as total FROM orders WHERE created_at >= $1 AND created_at < $2',
      [lastMonth, thisMonth]
    );

    const totalUsers = await query('SELECT COUNT(*) as count FROM users', []);
    const totalGoods = await query('SELECT COUNT(*) as count FROM goods', []);
    const totalOrders = await query('SELECT COUNT(*) as count FROM orders', []);

    const recentOrders = await query(
      `SELECT o.*, u.nickname 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC 
       LIMIT 10`,
      []
    );

    const topGoods = await query(
      `SELECT g.*, COALESCE(SUM(oi.quantity), 0) as total_sold
       FROM goods g
       LEFT JOIN order_items oi ON g.id = oi.goods_id
       GROUP BY g.id
       ORDER BY total_sold DESC
       LIMIT 10`,
      []
    );

    res.json({
      today: {
        orders: parseInt(todayOrders.rows[0].count),
        revenue: parseFloat(todayOrders.rows[0].total)
      },
      yesterday: {
        orders: parseInt(yesterdayOrders.rows[0].count),
        revenue: parseFloat(yesterdayOrders.rows[0].total)
      },
      thisMonth: {
        orders: parseInt(thisMonthOrders.rows[0].count),
        revenue: parseFloat(thisMonthOrders.rows[0].total)
      },
      lastMonth: {
        orders: parseInt(lastMonthOrders.rows[0].count),
        revenue: parseFloat(lastMonthOrders.rows[0].total)
      },
      totals: {
        users: parseInt(totalUsers.rows[0].count),
        goods: parseInt(totalGoods.rows[0].count),
        orders: parseInt(totalOrders.rows[0].count)
      },
      recentOrders: recentOrders.rows,
      topGoods: topGoods.rows
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/sales', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query;

    const result = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(final_amount), 0) as revenue
       FROM orders
       WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      []
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get sales statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orders', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(final_amount), 0) as total_amount
       FROM orders
       GROUP BY status`,
      []
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get order statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/goods', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const totalGoods = await query('SELECT COUNT(*) as count FROM goods', []);
    const activeGoods = await query('SELECT COUNT(*) as count FROM goods WHERE status = $1', ['active']);
    const lowStockGoods = await query('SELECT COUNT(*) as count FROM goods WHERE stock < 10', []);

    const categoryStats = await query(
      `SELECT 
        c.name as category_name,
        COUNT(g.id) as goods_count,
        COALESCE(SUM(g.sales), 0) as total_sales
       FROM categories c
       LEFT JOIN goods g ON c.id = g.category_id
       GROUP BY c.id, c.name
       ORDER BY goods_count DESC`,
      []
    );

    res.json({
      total: parseInt(totalGoods.rows[0].count),
      active: parseInt(activeGoods.rows[0].count),
      lowStock: parseInt(lowStockGoods.rows[0].count),
      byCategory: categoryStats.rows
    });
  } catch (error) {
    console.error('Get goods statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query;

    const totalUsers = await query('SELECT COUNT(*) as count FROM users', []);
    const activeUsers = await query('SELECT COUNT(*) as count FROM users WHERE status = $1', ['active']);

    const newUsers = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
       FROM users
       WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      []
    );

    const topUsers = await query(
      `SELECT 
        u.id,
        u.nickname,
        u.avatar,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.final_amount), 0) as total_spent
       FROM users u
       LEFT JOIN orders o ON u.id = o.user_id
       GROUP BY u.id
       ORDER BY total_spent DESC
       LIMIT 10`,
      []
    );

    res.json({
      total: parseInt(totalUsers.rows[0].count),
      active: parseInt(activeUsers.rows[0].count),
      newUsers: newUsers.rows,
      topUsers: topUsers.rows
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
