import express, { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission';

const router = express.Router();

router.get('/methods', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM payment_methods WHERE status = $1 ORDER BY sort_order ASC',
      ['active']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/methods/:id', async (req: Request, res: Response) => {
  try {
    const methodId = parseInt(req.params.id);
    const result = await query('SELECT * FROM payment_methods WHERE id = $1', [methodId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/methods', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, icon, status, config, sortOrder } = req.body;

    const result = await query(
      `INSERT INTO payment_methods (name, code, icon, status, config, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, code, icon || '', status || 'active', config || {}, sortOrder || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/methods/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const methodId = parseInt(req.params.id);
    const { name, icon, status, config, sortOrder } = req.body;

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (icon !== undefined) {
      updateFields.push(`icon = $${paramCount++}`);
      values.push(icon);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (config !== undefined) {
      updateFields.push(`config = $${paramCount++}`);
      values.push(config);
    }
    if (sortOrder !== undefined) {
      updateFields.push(`sort_order = $${paramCount++}`);
      values.push(sortOrder);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(methodId);

    const result = await query(
      `UPDATE payment_methods SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/methods/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const methodId = parseInt(req.params.id);

    const result = await query('DELETE FROM payment_methods WHERE id = $1 RETURNING *', [methodId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, paymentMethodId } = req.body;

    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (req.user?.userId !== order.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.payment_status !== 'unpaid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    const methodResult = await query('SELECT * FROM payment_methods WHERE id = $1 AND status = $2', [paymentMethodId, 'active']);

    if (methodResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found or inactive' });
    }

    const paymentMethod = methodResult.rows[0];

    const paymentResult = await query(
      `INSERT INTO payments (order_id, payment_method_id, amount, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [orderId, paymentMethodId, order.final_amount, 'pending']
    );

    const payment = paymentResult.rows[0];

    let paymentUrl = '';
    let paymentParams: any = {};

    switch (paymentMethod.code) {
      case 'alipay':
        paymentUrl = `https://openapi.alipay.com/gateway.do`;
        paymentParams = {
          out_trade_no: payment.id,
          total_amount: order.final_amount,
          subject: `订单${order.order_no}`,
          notify_url: `${process.env.API_URL}/api/payments/callback/alipay`
        };
        break;
      case 'wechat':
        paymentUrl = `https://api.mch.weixin.qq.com/pay/unifiedorder`;
        paymentParams = {
          out_trade_no: payment.id,
          total_fee: Math.floor(order.final_amount * 100),
          body: `订单${order.order_no}`,
          notify_url: `${process.env.API_URL}/api/payments/callback/wechat`
        };
        break;
      case 'balance':
        const userResult = await query('SELECT * FROM users WHERE id = $1', [order.user_id]);

        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        if (user.points < order.final_amount * 100) {
          return res.status(400).json({ error: 'Insufficient balance' });
        }

        await query(
          'UPDATE users SET points = points - $1 WHERE id = $2',
          [Math.floor(order.final_amount * 100), order.user_id]
        );

        await query(
          `UPDATE payments SET status = $1, paid_at = CURRENT_TIMESTAMP WHERE id = $2`,
          ['paid', payment.id]
        );

        await query(
          `UPDATE orders SET payment_status = $1, payment_method = $2, payment_time = CURRENT_TIMESTAMP, status = 'paid' WHERE id = $3`,
          ['paid', paymentMethod.code, orderId]
        );

        await query(
          'INSERT INTO order_status_history (order_id, status, remark) VALUES ($1, $2, $3)',
          [orderId, 'paid', '余额支付成功']
        );

        return res.json({
          paymentId: payment.id,
          status: 'paid',
          message: 'Payment successful'
        });
      default:
        return res.status(400).json({ error: 'Unsupported payment method' });
    }

    res.json({
      paymentId: payment.id,
      paymentUrl,
      paymentParams,
      status: 'pending'
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/callback/alipay', async (req: Request, res: Response) => {
  try {
    const { out_trade_no, trade_status, total_amount } = req.body;

    if (trade_status !== 'TRADE_SUCCESS' && trade_status !== 'TRADE_FINISHED') {
      return res.json({ success: false });
    }

    const paymentResult = await query('SELECT * FROM payments WHERE id = $1', [out_trade_no]);

    if (paymentResult.rows.length === 0) {
      return res.json({ success: false });
    }

    const payment = paymentResult.rows[0];

    if (payment.status === 'paid') {
      return res.json({ success: true });
    }

    await query(
      `UPDATE payments SET status = $1, paid_at = CURRENT_TIMESTAMP, callback_data = $2 WHERE id = $3`,
      ['paid', JSON.stringify(req.body), payment.id]
    );

    await query(
      `UPDATE orders SET payment_status = $1, payment_method = 'alipay', payment_time = CURRENT_TIMESTAMP, status = 'paid' WHERE id = $2`,
      ['paid', payment.order_id]
    );

    await query(
      'INSERT INTO order_status_history (order_id, status, remark) VALUES ($1, $2, $3)',
      [payment.order_id, 'paid', '支付宝支付成功']
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Alipay callback error:', error);
    res.json({ success: false });
  }
});

router.post('/callback/wechat', async (req: Request, res: Response) => {
  try {
    const { out_trade_no, return_code, result_code } = req.body;

    if (return_code !== 'SUCCESS' || result_code !== 'SUCCESS') {
      return res.json({ return_code: 'FAIL', return_msg: 'Payment failed' });
    }

    const paymentResult = await query('SELECT * FROM payments WHERE id = $1', [out_trade_no]);

    if (paymentResult.rows.length === 0) {
      return res.json({ return_code: 'FAIL', return_msg: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    if (payment.status === 'paid') {
      return res.json({ return_code: 'SUCCESS', return_msg: 'OK' });
    }

    await query(
      `UPDATE payments SET status = $1, paid_at = CURRENT_TIMESTAMP, callback_data = $2 WHERE id = $3`,
      ['paid', JSON.stringify(req.body), payment.id]
    );

    await query(
      `UPDATE orders SET payment_status = $1, payment_method = 'wechat', payment_time = CURRENT_TIMESTAMP, status = 'paid' WHERE id = $2`,
      ['paid', payment.order_id]
    );

    await query(
      'INSERT INTO order_status_history (order_id, status, remark) VALUES ($1, $2, $3)',
      [payment.order_id, 'paid', '微信支付成功']
    );

    res.json({ return_code: 'SUCCESS', return_msg: 'OK' });
  } catch (error) {
    console.error('WeChat callback error:', error);
    res.json({ return_code: 'FAIL', return_msg: 'Internal error' });
  }
});

router.get('/status/:paymentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const paymentId = parseInt(req.params.paymentId);

    const result = await query(
      `SELECT p.*, o.order_no, o.final_amount 
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.id = $1`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = result.rows[0];

    if (req.user?.userId !== payment.user_id && req.user?.roleId !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
