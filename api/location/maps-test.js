import { handleTestMapsKey } from '../../server/locationServiceHandler.js';

export default async function handler(req, res) {
  return handleTestMapsKey(req, res);
}
