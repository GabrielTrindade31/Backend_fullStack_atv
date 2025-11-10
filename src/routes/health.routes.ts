import { Router } from 'express';
const health = Router();

health.get('/', (_req, res) => res.json({ status: 'ok', service: 'mini-projeto-fullstack' }));

export default health;
