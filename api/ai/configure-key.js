import { handleConfigureKey } from '../../server/aiServiceHandler.js';

export default async function handler(req, res) {
  return handleConfigureKey(req, res);
}
