import { handleGetPatientLocation } from '../../server/locationServiceHandler.js';
export default async function handler(req, res) { return handleGetPatientLocation(req, res); }
