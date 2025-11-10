import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import healthRouter from './routes/health.route';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', healthRouter);

app.use('/auth', authRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

export default app;
