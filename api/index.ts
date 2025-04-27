import { bootstrap } from '../src/main';

// Create and init server
const server = bootstrap();

// Export for Vercel
export default async function handler(req, res) {
  const instance = await server;
  instance(req, res);
}
