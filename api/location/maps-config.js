import {
  handleGetMapsConfig,
  handleConfigureMapsKey,
  handleTestMapsKey
} from '../../server/locationServiceHandler.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetMapsConfig(req, res);
  }

  // Handle test action when invoked directly or via rewrite from /api/location/maps-test
  const isTestAction = req.query?.action === 'test' || req.url?.includes('action=test') || req.url?.includes('maps-test');
  if (isTestAction) {
    return handleTestMapsKey(req, res);
  }

  return handleConfigureMapsKey(req, res);
}
