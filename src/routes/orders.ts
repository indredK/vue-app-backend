import express, { Request, Response } from 'express';
import { getOrders, getOrderById, createOrder, updateOrderStatus } from '../db';

const router = express.Router();

router.get('/:userId', (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  res.json(getOrders(userId));
});

router.get('/detail/:id', (req: Request, res: Response) => {
  const order = getOrderById(parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

router.post('/', (req: Request, res: Response) => {
  const { userId, items, totalAmount } = req.body;
  const order = createOrder(userId, items, totalAmount);
  res.status(201).json(order);
});

router.put('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const order = updateOrderStatus(parseInt(req.params.id), status);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

export default router;
