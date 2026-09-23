import { handleEmergencyLocation } from '../../server/locationServiceHandler.js';
export default async function handler(req, res) { return handleEmergencyLocation(req, res); }
