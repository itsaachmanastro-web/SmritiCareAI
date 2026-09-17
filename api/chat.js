import { handleChat } from '../server/aiServiceHandler.js';

export default async function handler(req, res) {
  return handleChat(req, res);
}
