import express, { Request, Response } from 'express';
import { getCartItems, addCartItem, updateCartItem, removeCartItem, clearCart } from '../db';

const router = express.Router();

router.get('/:userId', (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  res.json(getCartItems(userId));
});

router.post('/', (req: Request, res: Response) => {
  const { userId, goodsId, name, price, image, quantity = 1 } = req.body;
  const item = addCartItem({ userId, goodsId, name, price, image, quantity, selected: true });
  res.status(201).json(item);
});

router.put('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const item = updateCartItem(id, req.body);
  if (!item) {
    return res.status(404).json({ error: 'Cart item not found' });
  }
  res.json(item);
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const success = removeCartItem(id);
  if (!success) {
    return res.status(404).json({ error: 'Cart item not found' });
  }
  res.json({ message: 'Cart item deleted successfully' });
});

router.delete('/clear/:userId', (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  clearCart(userId);
  res.json({ message: 'Cart cleared successfully' });
});

export default router;
