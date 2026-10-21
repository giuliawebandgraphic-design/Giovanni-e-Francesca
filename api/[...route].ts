import { handleVercelApi } from '../src/server/vercel-api.ts';

/** Handles every existing /api/* path as one Vercel Function. */
export default {
  fetch(request: Request) {
    return handleVercelApi(request);
  },
};
