/**
 * Server-side Vite plugin providing /api/ai/chat, /api/ai/test, /api/ai/status,
 * and /api/ai/configure-key endpoints for local development.
 * Delegates directly to the universal aiServiceHandler for 100% parity with Vercel Serverless Functions.
 */
import {
  handleStatus,
  handleSystemPrompt,
  handleConfigureKey,
  handleTest,
  handleChat
} from './aiServiceHandler.js';

export function chatApiPlugin(options = {}) {
  return {
    name: 'smriti-chat-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // Status Check: GET /api/ai/status or /api/status
        if (url === '/api/ai/status' || url === '/api/status') {
          return handleStatus(req, res);
        }

        // System Prompt: GET/POST /api/ai/system-prompt
        if (url === '/api/ai/system-prompt') {
          return handleSystemPrompt(req, res);
        }

        // Configure Key: POST /api/ai/configure-key
        if (url === '/api/ai/configure-key') {
          return handleConfigureKey(req, res);
        }

        // Connection Test: POST /api/ai/test or /api/test
        if (url === '/api/ai/test' || url === '/api/test') {
          return handleTest(req, res);
        }

        // Chat endpoint: POST /api/ai/chat or /api/chat
        if (url === '/api/ai/chat' || url === '/api/chat') {
          return handleChat(req, res);
        }

        next();
      });
    }
  };
}
