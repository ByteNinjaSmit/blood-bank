import type { RequestHandler } from 'express';
import crypto from 'node:crypto';

export const HEADER = 'x-request-id';

const requestId: RequestHandler = (req, res, next) => {
  const existing = req.headers[HEADER];
  const id = (Array.isArray(existing) ? existing[0] : existing) ?? crypto.randomUUID();
  req.id = id;
  res.setHeader(HEADER, id);
  next();
};

export default requestId;
