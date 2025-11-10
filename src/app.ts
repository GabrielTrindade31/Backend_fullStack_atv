import cors from 'cors';
import express from 'express';
import { authRouter } from './modules/auth/auth.controller';
import { healthRouter } from './modules/health/health.controller';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', healthRouter);
app.use('/auth', authRouter);

app.use(errorHandler);

export { app };
