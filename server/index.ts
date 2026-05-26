import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { authRouter } from './routes/auth.js';
import { productRouter } from './routes/products.js';
import { categoryRouter } from './routes/categories.js';
import { saleRouter } from './routes/sales.js';
import { reportRouter } from './routes/reports.js';
import { userRouter } from './routes/users.js';
import { supplierRouter } from './routes/suppliers.js';
import { purchaseRouter } from './routes/purchases.js';
import { stockRouter } from './routes/stock.js';
import { errorHandler } from './middleware/errorHandler.js';
import { JWT_SECRET } from './middleware/auth.js';

if (!JWT_SECRET || JWT_SECRET === 'dev-secret') {
  console.error('FATAL: JWT_SECRET must be set in environment');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT ?? '3001';

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(helmet());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/sales', saleRouter);
app.use('/api/reports', reportRouter);
app.use('/api/users', userRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/purchase-orders', purchaseRouter);
app.use('/api/stock', stockRouter);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
