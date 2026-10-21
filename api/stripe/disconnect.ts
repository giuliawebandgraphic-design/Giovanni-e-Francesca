import { handleVercelApi } from '../../src/server/vercel-api.ts';

export default { fetch: (request: Request) => handleVercelApi(request) };
