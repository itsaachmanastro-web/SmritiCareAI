import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { chatApiPlugin } from './server/chatApiPlugin.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Populate process.env with loaded variables for server middleware
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const geminiModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  process.env.GEMINI_API_KEY = geminiKey;
  process.env.GEMINI_MODEL = geminiModel;

  return {
    plugins: [
      react(),
      chatApiPlugin({ apiKey: geminiKey })
    ],
    server: {
      port: 3000,
      open: false,
      host: true
    }
  };
});
