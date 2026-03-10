import express, { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { 
  canTransitionOrderStatus, 
  canTransitionPaymentStatus,
  OrderStatus,
  PaymentStatus,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getNextOrderStatuses
} from '../utils/orderStatus';

const router = express.Router();

router.get('/user/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT o.*, 
              json_agg(json_build_object('id', oi.id, 'goodsId', oi.goods_id, 'name', oi.name, 'price', oi.price, 'image', oi.image, 'quantity', oi.quantity)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const orders = result.rows.map(order => ({
      ...order,
      statusLabel: getOrderStatusLabel(order.status as OrderStatus),
      paymentStatusLabel: getPaymentStatusLabel(order.payment_status as PaymentStatus)
    }));

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/detail/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    
    const orderResult = await query(
      `SELECT o.*, 
              json_agg(json_build_object('id', oi.id, 'goodsId', oi.goods_id, 'name', oi.name, 'price', oi.price, 'image', oi.image, 'quantity', oi.quantity)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (req.user?.userId !== order.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const historyResult = await query(
      'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC',
      [orderId]
    );

    res.json({
      ...order,
      statusLabel: getOrderStatusLabel(order.status as OrderStatus),
      paymentStatusLabel: getPaymentStatusLabel(order.payment_status as PaymentStatus),
      history: historyResult.rows
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, items, addressId, totalAmount, pointsUsed, remark } = req.body;

    if (req.user?.userId !== userId && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const orderNo = `ORDER${Date.now()}${Math.floor(Math.random() * 1000)}`;
    let pointsDiscount = 0;
    let finalAmount = totalAmount;

    if (pointsUsed && pointsUsed > 0) {
      pointsDiscount = pointsUsed * 0.01;
      finalAmount = totalAmount - pointsDiscount;

      await query(
        'UPDATE users SET points = points - $1 WHERE id = $2 AND points >= $1',
        [pointsUsed, userId]
      );
    }

    const orderResult = await query(
      `INSERT INTO orders (user_id, order_no, address_id, total_amount, points_used, points_discount, final_amount, status, payment_status, remark)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, orderNo, addressId, totalAmount, pointsUsed, pointsDiscount, finalAmount, 'pending', 'unpaid', remark || '']
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await query(
        'INSERT INTO order_items (order_id, goods_id, name, price, image, quantity) VALUES ($1, $2, $3, $4, $5, $6)',
        [order.id, item.goodsId, item.name, item.price, item.image, item.quantity]
      );

      await query(
        'UPDATE goods SET sales = sales + $1 WHERE id = $2',
        [item.quantity, item.goodsId]
      );
    }

    await query(
      'INSERT INTO order_status_history (order_id, status, remark) VALUES ($1, $2, $3)',
      [order.id, 'pending', '订单创建']
    );

    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );

    res.status(201).json({
      ...order,
      statusLabel: getOrderStatusLabel('pending'),
      paymentStatusLabel: getPaymentStatusLabel('unpaid'),
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, remark } = req.body;

    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (req.user?.userId !== order.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!canTransitionOrderStatus(order.status as OrderStatus, status as OrderStatus)) {
      return res.status(400).json({ 
        error: 'Invalid status transition',
        currentStatus: order.status,
        requestedStatus: status,
        allowedStatuses: getNextOrderStatuses(order.status as OrderStatus)
      });
    }

    const updateData: any = { status };
    
    if (status === 'paid') {
      updateData.payment_status = 'paid';
      updateData.payment_time = new Date();
    } else if (status === 'shipped') {
      updateData.shipping_time = new Date();
    } else if (status === 'delivered') {
      updateData.received_time = new Date();
    } else if (status === 'completed') {
      await query(
        'UPDATE users SET points = points + $1 WHERE id = $2',
        [Math.floor(order.final_amount), order.user_id]
      );
    }

    const setClause = Object.keys(updateData).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(updateData);

    await query(
      `UPDATE orders SET ${setClause} WHERE id = $1`,
      [orderId, ...values]
    );

    await query(
      'INSERT INTO order_status_history (order_id, status, remark) VALUES ($1, $2, $3)',
      [orderId, status, remark || '']
    );

    const updatedOrder = await query('SELECT * FROM orders WHERE id = $1', [orderId]);

    res.json({
      ...updatedOrder.rows[0],
      statusLabel: getOrderStatusLabel(status as OrderStatus),
      paymentStatusLabel: getPaymentStatusLabel(updatedOrder.rows[0].payment_status as PaymentStatus)
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/payment-status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { paymentStatus, paymentMethod, transactionId } = req.body;

    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (req.user?.userId !== order.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!canTransitionPaymentStatus(order.payment_status as PaymentStatus, paymentStatus as PaymentStatus)) {
      return res.status(400).json({ 
        error: 'Invalid payment status transition',
        currentStatus: order.payment_status,
        requestedStatus: paymentStatus
      });
    }

    await query(
      `UPDATE orders 
       SET payment_status = $1, payment_method = $2 
       WHERE id = $3`,
      [paymentStatus, paymentMethod || order.payment_method, orderId]
    );

    if (paymentStatus === 'paid') {
      await query(
        `UPDATE orders 
         SET payment_time = CURRENT_TIMESTAMP, status = 'paid' 
         WHERE id = $1`,
        [orderId]
      );

      await query(
        'INSERT INTO order_status_history (order_id, status, remark) VALUES ($1, $2, $3)',
        [orderId, 'paid', '支付成功']
      );
    }

    const updatedOrder = await query('SELECT * FROM orders WHERE id = $1', [orderId]);

    res.json({
      ...updatedOrder.rows[0],
      statusLabel: getOrderStatusLabel(updatedOrder.rows[0].status as OrderStatus),
      paymentStatusLabel: getPaymentStatusLabel(paymentStatus as PaymentStatus)
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { cancelReason } = req.body;

    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (req.user?.userId !== order.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'pending' && order.status !== 'paid') {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    await query(
      `UPDATE orders 
       SET status = 'cancelled', cancel_reason = $1 
       WHERE id = $2`,
      [cancelReason || '', orderId]
    );

    await query(
      'INSERT INTO order_status_history (order_id, status, remark) VALUES ($1, $2, $3)',
      [orderId, 'cancelled', cancelReason || '订单取消']
    );

    if (order.points_used > 0) {
      await query(
        'UPDATE users SET points = points + $1 WHERE id = $2',
        [order.points_used, order.user_id]
      );
    }

    const itemsResult = await query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);

    for (const item of itemsResult.rows) {
      await query(
        'UPDATE goods SET sales = sales - $1 WHERE id = $2',
        [item.quantity, item.goods_id]
      );
    }

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
