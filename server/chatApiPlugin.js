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
import {
  handleLocationUpdate,
  handleGetPatientLocation,
  handleUpdateSafeZone,
  handleEmergencyLocation,
  handleGetMapsConfig,
  handleConfigureMapsKey,
  handleTestMapsKey
} from './locationServiceHandler.js';
import {
  handleAuthLogin,
  handleAuthRegister,
  handleAuthGoogle,
  handleVerifySession,
  handleAuthLogout,
  handleAuthResetPassword
} from './authServiceHandler.js';
import {
  handleGetReminders,
  handleCreateReminder,
  handleDeleteReminder,
  handleToggleReminder
} from './reminderServiceHandler.js';

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export async function handleContact(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    return res.end(JSON.stringify({
      status: 'ok',
      endpoint: '/api/contact',
      message: 'SmritiCare Contact Submission Service is active.',
      officialEmail: 'support@smriticare.org'
    }));
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  try {
    const data = await parseJsonBody(req);
    const { name, email, subject, message } = data;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Please provide your name (minimum 2 characters).' }));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Please provide a valid email address.' }));
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Subject is required (minimum 3 characters).' }));
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Message is required (minimum 10 characters).' }));
    }

    const inquiryId = `INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const receivedAt = new Date().toISOString();

    console.log(`📨 [Contact] Inquiry ${inquiryId} from ${name.trim()} <${email.trim()}>: "${subject.trim()}"`);

    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      inquiryId,
      receivedAt,
      message: `Thank you, ${name.trim()}. Your inquiry has been received by the SmritiCare Team (Ref: ${inquiryId}).`,
      supportEmail: 'support@smriticare.org'
    }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Failed to process contact inquiry.' }));
  }
}

export function chatApiPlugin(options = {}) {
  return {
    name: 'smriti-chat-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // Contact Endpoint: GET/POST /api/contact
        if (url === '/api/contact') {
          return handleContact(req, res);
        }

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

        // Location Update: POST /api/location/update
        if (url === '/api/location/update') {
          return handleLocationUpdate(req, res);
        }

        // Get Patient Location: GET /api/location/patient
        if (url === '/api/location/patient') {
          return handleGetPatientLocation(req, res);
        }

        // Safe Zone Management: POST /api/location/safe-zone
        if (url === '/api/location/safe-zone') {
          return handleUpdateSafeZone(req, res);
        }

        // Emergency SOS Location: POST /api/location/emergency
        if (url === '/api/location/emergency') {
          return handleEmergencyLocation(req, res);
        }

        // Google Maps Config: GET/POST /api/location/maps-config
        if (url === '/api/location/maps-config') {
          if (req.method === 'GET') return handleGetMapsConfig(req, res);
          return handleConfigureMapsKey(req, res);
        }

        // Google Maps Test: POST /api/location/maps-test
        if (url === '/api/location/maps-test') {
          return handleTestMapsKey(req, res);
        }

        // --- AUTHENTICATION ENDPOINTS ---
        // Login: POST /api/auth/login
        if (url === '/api/auth/login') {
          return handleAuthLogin(req, res);
        }

        // Register: POST /api/auth/register
        if (url === '/api/auth/register') {
          return handleAuthRegister(req, res);
        }

        // Google OAuth Verify: POST /api/auth/google
        if (url === '/api/auth/google') {
          return handleAuthGoogle(req, res);
        }

        // Verify Session: POST /api/auth/verify-session
        if (url === '/api/auth/verify-session') {
          return handleVerifySession(req, res);
        }

        // Logout: POST /api/auth/logout
        if (url === '/api/auth/logout') {
          return handleAuthLogout(req, res);
        }

        // Reset Password: POST /api/auth/reset-password
        if (url === '/api/auth/reset-password') {
          return handleAuthResetPassword(req, res);
        }

        // --- REMINDER ENDPOINTS ---
        // Reminders: GET, POST, DELETE, PATCH /api/reminders
        if (url === '/api/reminders') {
          if (req.method === 'GET') {
            return handleGetReminders(req, res);
          }
          if (req.method === 'POST') {
            return handleCreateReminder(req, res);
          }
          if (req.method === 'DELETE') {
            return handleDeleteReminder(req, res);
          }
          if (req.method === 'PATCH') {
            return handleToggleReminder(req, res);
          }
        }

        next();
      });
    }
  };
}
