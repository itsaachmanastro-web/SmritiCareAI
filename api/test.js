import { handleTest } from '../server/aiServiceHandler.js';

export default async function handler(req, res) {
  return handleTest(req, res);
}
