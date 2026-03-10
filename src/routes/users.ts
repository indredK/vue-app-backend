import express, { Request, Response } from 'express';
import { getUserById, updateUser } from '../db';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Users list' });
});

router.get('/:id', (req: Request, res: Response) => {
  const user = getUserById(parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

router.put('/:id', (req: Request, res: Response) => {
  const user = updateUser(parseInt(req.params.id), req.body);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

export default router;
