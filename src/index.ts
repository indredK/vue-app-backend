import express, { Request, Response } from 'express';
import cors from 'cors';

import goodsRouter from './routes/goods';
import usersRouter from './routes/users';
import cartRouter from './routes/cart';
import ordersRouter from './routes/orders';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Shop Mini App API Server',
    version: '1.0.0',
    endpoints: {
      goods: '/api/goods',
      users: '/api/users',
      cart: '/api/cart',
      orders: '/api/orders'
    }
  });
});

app.use('/api/goods', goodsRouter);
app.use('/api/users', usersRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, req: Request, res: Response) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
