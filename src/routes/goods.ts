import express, { Request, Response } from 'express';
import { getGoodsList, getGoodsById, getGoodsByIds } from '../db';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json(getGoodsList());
});

router.get('/:id', (req: Request, res: Response) => {
  const goods = getGoodsById(parseInt(req.params.id));
  if (!goods) {
    return res.status(404).json({ error: 'Goods not found' });
  }
  res.json(goods);
});

router.get('/batch/:ids', (req: Request, res: Response) => {
  const ids = req.params.ids.split(',').map(id => parseInt(id));
  res.json(getGoodsByIds(ids));
});

export default router;
