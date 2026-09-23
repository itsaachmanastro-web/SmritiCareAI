import { handleLocationUpdate } from '../../server/locationServiceHandler.js';
export default async function handler(req, res) { return handleLocationUpdate(req, res); }
