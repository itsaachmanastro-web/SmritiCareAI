import { handleStatus } from '../server/aiServiceHandler.js';

export default async function handler(req, res) {
  return handleStatus(req, res);
}
