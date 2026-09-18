import { handleContact } from '../server/chatApiPlugin.js';

export default async function handler(req, res) {
  return handleContact(req, res);
}
