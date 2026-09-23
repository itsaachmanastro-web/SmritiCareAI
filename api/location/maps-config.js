import { handleGetMapsConfig, handleConfigureMapsKey } from '../../server/locationServiceHandler.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetMapsConfig(req, res);
  }
  return handleConfigureMapsKey(req, res);
}
