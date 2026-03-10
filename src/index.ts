import express, { Request, Response } from 'express';
import cors from 'cors';

import goodsRouter from './routes/goods';
import usersRouter from './routes/users';
import cartRouter from './routes/cart';
import ordersRouter from './routes/orders';
import authRouter from './routes/auth';
import paymentsRouter from './routes/payments';
import categoriesRouter from './routes/categories';
import reviewsRouter from './routes/reviews';
import favoritesRouter from './routes/favorites';
import addressesRouter from './routes/addresses';
import pointsRouter from './routes/points';
import notificationsRouter from './routes/notifications';
import statisticsRouter from './routes/statistics';
import logsRouter, { logAction } from './routes/logs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://indredk.github.io',
    'https://indredk.github.io/vue-app'
  ],
  credentials: true
}));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Shop Mini App API Server',
    version: '1.0.0',
    endpoints: {
      goods: '/api/goods',
      users: '/api/users',
      cart: '/api/cart',
      orders: '/api/orders',
      auth: '/api/auth',
      payments: '/api/payments',
      categories: '/api/categories',
      reviews: '/api/reviews',
      favorites: '/api/favorites',
      addresses: '/api/addresses',
      points: '/api/points',
      notifications: '/api/notifications',
      statistics: '/api/statistics',
      logs: '/api/logs'
    }
  });
});

app.use('/api/goods', goodsRouter);
app.use('/api/users', usersRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/points', pointsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/logs', logsRouter);

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
