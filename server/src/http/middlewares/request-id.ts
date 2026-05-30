// Re-export the JS implementation so middleware paths line up under
// /src and the legacy server.js can keep using the .js path.

import type { RequestHandler } from 'express';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const requestId = require('../../../middlewares/request-id.js') as RequestHandler & {
  HEADER: string;
};

export default requestId;
export const HEADER = requestId.HEADER;
