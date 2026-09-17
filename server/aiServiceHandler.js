/**
 * Centralized AI Service Request Handler
 * Shared business logic for both Vercel Serverless Functions (/api/*)
 * and Local Vite Dev Server Middleware (server/chatApiPlugin.js).
 * 
 * Provides 100% parity between local development and production deployment.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  discoverAndVerifyModel,
  testGenerateContent,
  mapGeminiError,
  fetchWithBackoff,
  parseGeminiErrorDiagnostics,
  DEFAULT_GEMINI_MODEL,
  PREFERRED_FLASH_MODELS,
  DEFAULT_SYSTEM_PROMPT
} from './aiConfig.js';

let cachedActiveModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
let activeSystemPrompt = DEFAULT_SYSTEM_PROMPT;

export function getActiveModel() {
  return cachedActiveModel || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

export function setActiveModel(model) {
  if (model && typeof model === 'string') {
    cachedActiveModel = model;
    process.env.GEMINI_MODEL = model;
  }
}

export function getActivePrompt() {
  return activeSystemPrompt;
}

export function setActivePrompt(prompt) {
  activeSystemPrompt = prompt || DEFAULT_SYSTEM_PROMPT;
}

/**
 * Universal JSON response sender supporting:
 * - Vercel Serverless Functions (res.status().json())
 * - Standard Node / Vite Connect Middleware (res.statusCode, res.end())
 */
export function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, Authorization');

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
  } else {
    res.end(JSON.stringify(data));
  }
}

/**
 * Universal request body parser supporting:
 * - Pre-parsed request bodies (Vercel Serverless Functions)
 * - Streaming requests (raw Node / Vite Connect Middleware)
 */
export async function parseRequestBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  if (req.readableEnded || req.complete) {
    return {};
  }

  return new Promise((resolve) => {
    let raw = '';
    const timer = setTimeout(() => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    }, 3000);

    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

/**
 * Handle CORS preflight OPTIONS requests
 */
export function handleCors(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, Authorization');
    res.end();
    return true;
  }
  return false;
}

export function extractIntent(text, query) {
  const q = (query || '').toLowerCase().trim();
  if (q.includes('call') || q.includes('emergency') || q.includes('priya')) return 'EMERGENCY';
  if (q.includes('open game') || q.includes('play game') || q.includes('show games')) return 'NAV_GAMES';
  if (q.includes('open reminder') || q.includes('my reminders') || q.includes('show reminder')) return 'NAV_REMINDERS';
  if (q.includes('open community') || q.includes('show community')) return 'NAV_COMMUNITY';
  if (q.includes('progress') || q.includes('my star') || q.includes('my score')) return 'NAV_PROGRESS';
  if (q.includes('go home') || q.includes('back home')) return 'NAV_HOME';
  if (q.includes('dark mode') || q.includes('light mode')) return 'THEME';
  if (q.includes('language') || q.includes('assamese') || q.includes('hindi') || q.includes('bengali')) return 'LANGUAGE';
  return 'GENERAL';
}

export function detectAction(intent, query) {
  if (intent === 'EMERGENCY') return { type: 'OPEN_EMERGENCY_MODAL' };
  if (intent === 'NAV_GAMES') return { type: 'NAVIGATE', path: '/patient/games' };
  if (intent === 'NAV_REMINDERS') return { type: 'NAVIGATE', path: '/patient/reminders' };
  if (intent === 'NAV_COMMUNITY') return { type: 'NAVIGATE', path: '/community' };
  if (intent === 'NAV_PROGRESS') return { type: 'NAVIGATE', path: '/patient/progress' };
  if (intent === 'NAV_HOME') return { type: 'NAVIGATE', path: '/patient/home' };
  if (intent === 'THEME') {
    return { type: 'TOGGLE_THEME', theme: query.toLowerCase().includes('dark') ? 'dark' : 'light' };
  }
  return null;
}

export function persistKeyToEnv(newKey, newModel) {
  const trimmedKey = (newKey || '').trim();
  if (trimmedKey) {
    process.env.GEMINI_API_KEY = trimmedKey;
  }
  if (newModel) {
    process.env.GEMINI_MODEL = newModel;
    setActiveModel(newModel);
  }

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }
    if (/^GEMINI_API_KEY=.*$/m.test(content)) {
      content = content.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${trimmedKey}`);
    } else {
      content += `\nGEMINI_API_KEY=${trimmedKey}`;
    }
    if (newModel) {
      if (/^GEMINI_MODEL=.*$/m.test(content)) {
        content = content.replace(/^GEMINI_MODEL=.*$/m, `GEMINI_MODEL=${newModel}`);
      } else {
        content += `\nGEMINI_MODEL=${newModel}`;
      }
    }
    fs.writeFileSync(envPath, content, 'utf8');
  } catch (err) {
    // Read-only serverless filesystem note (expected in cloud serverless runtimes)
    console.warn('Filesystem .env update note (normal in serverless):', err.message);
  }
}

// -----------------------------------------------------------------------------
// ENDPOINT HANDLERS
// -----------------------------------------------------------------------------

/**
 * Handler for GET /api/ai/status
 */
export async function handleStatus(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method Not Allowed. Expected GET for /api/ai/status.' });
  }

  const currentKey = process.env.GEMINI_API_KEY || '';
  const hasKey = Boolean(currentKey && !currentKey.includes('your_') && currentKey.length >= 15);

  return sendJson(res, 200, {
    hasKey,
    model: getActiveModel(),
    defaultModel: DEFAULT_GEMINI_MODEL,
    supportedCandidates: PREFERRED_FLASH_MODELS,
    hasCustomPrompt: activeSystemPrompt !== DEFAULT_SYSTEM_PROMPT
  });
}

/**
 * Handler for GET and POST /api/ai/system-prompt
 */
export async function handleSystemPrompt(req, res) {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    return sendJson(res, 200, {
      systemPrompt: activeSystemPrompt,
      defaultPrompt: DEFAULT_SYSTEM_PROMPT,
      isDefault: activeSystemPrompt === DEFAULT_SYSTEM_PROMPT
    });
  }

  if (req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      if (body.reset) {
        activeSystemPrompt = DEFAULT_SYSTEM_PROMPT;
      } else if (typeof body.systemPrompt === 'string' && body.systemPrompt.trim()) {
        activeSystemPrompt = body.systemPrompt.trim();
      }
      return sendJson(res, 200, {
        success: true,
        systemPrompt: activeSystemPrompt,
        isDefault: activeSystemPrompt === DEFAULT_SYSTEM_PROMPT
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'Failed to update system prompt' });
    }
  }

  return sendJson(res, 405, { error: 'Method Not Allowed. Expected GET or POST.' });
}

/**
 * Handler for POST /api/ai/configure-key
 */
export async function handleConfigureKey(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed. Expected POST for /api/ai/configure-key.' });
  }

  try {
    const body = await parseRequestBody(req);
    const { apiKey, model } = body;
    persistKeyToEnv(apiKey, model);

    return sendJson(res, 200, {
      success: true,
      hasKey: Boolean(apiKey && apiKey.trim().length >= 15),
      model: getActiveModel()
    });
  } catch (err) {
    return sendJson(res, 500, { error: err.message || 'Failed to configure key' });
  }
}

/**
 * Handler for POST /api/ai/test (and /api/test)
 * Validates Gemini API connection with live verification and dynamic model discovery.
 */
export async function handleTest(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      connected: false,
      status: 405,
      error: 'Method Not Allowed. Expected POST for /api/ai/test.'
    });
  }

  try {
    const body = await parseRequestBody(req);
    const headerKey = req.headers ? (req.headers['x-gemini-api-key'] || req.headers['X-Gemini-Api-Key']) : '';
    const keyToTest = (body.apiKey && String(body.apiKey).trim()) ||
                      (headerKey && String(headerKey).trim()) ||
                      process.env.GEMINI_API_KEY || '';

    if (!keyToTest || keyToTest.includes('your_') || keyToTest.length < 15) {
      return sendJson(res, 400, {
        connected: false,
        status: 400,
        error: '❌ No valid Gemini API key configured. Please set GEMINI_API_KEY in Vercel Environment Variables or enter your API key to test.',
        model: null
      });
    }

    const requestedModel = body.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    let chosenModel = requestedModel;
    let testCall = await testGenerateContent(keyToTest, chosenModel);
    let availableModels = null;

    // Only if requested model returns 404, discover alternative supported Flash models
    if (!testCall.ok && testCall.status === 404) {
      console.warn(`Model ${chosenModel} returned 404 during test. Attempting dynamic discovery...`);
      const discovery = await discoverAndVerifyModel(keyToTest, requestedModel);
      if (discovery.ok && discovery.model) {
        chosenModel = discovery.model;
        availableModels = discovery.availableModels;
        testCall = await testGenerateContent(keyToTest, chosenModel);
      } else if (!discovery.ok) {
        testCall = {
          ok: false,
          status: discovery.status,
          error: discovery.error,
          diagnostics: null
        };
      }
    }

    if (!testCall.ok) {
      return sendJson(res, testCall.status || 500, {
        connected: false,
        status: testCall.status,
        error: testCall.error,
        model: chosenModel,
        diagnostics: testCall.diagnostics || null
      });
    }

    setActiveModel(chosenModel);

    if (body.saveKey) {
      persistKeyToEnv(keyToTest, chosenModel);
    }

    return sendJson(res, 200, {
      connected: true,
      status: 200,
      model: chosenModel,
      sampleResponse: testCall.replyText,
      availableModels: availableModels || [chosenModel],
      diagnostics: null,
      message: `Gemini LLM Connected (${chosenModel})`
    });
  } catch (err) {
    return sendJson(res, 500, {
      connected: false,
      status: 500,
      error: `❌ Internal error during connection test: ${err.message}`,
      model: null
    });
  }
}

/**
 * Handler for POST /api/ai/chat (and /api/chat)
 */
export async function handleChat(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed. Expected POST for /api/ai/chat.' });
  }

  try {
    const body = await parseRequestBody(req);
    const {
      message,
      conversationHistory = [],
      language = 'en',
      userContext = {},
      appContext = {},
      gameContext = {},
      customSystemPrompt
    } = body;

    const headerKey = req.headers ? (req.headers['x-gemini-api-key'] || req.headers['X-Gemini-Api-Key']) : '';
    const envKey = process.env.GEMINI_API_KEY || '';
    const rawKey = (headerKey && String(headerKey).trim()) || (envKey && String(envKey).trim()) || '';
    const isPlaceholder = !rawKey || rawKey.includes('your_') || rawKey.length < 15;
    const activeApiKey = isPlaceholder ? null : rawKey;

    if (!message || !message.trim()) {
      return sendJson(res, 400, { error: 'Message is required' });
    }

    const userQuery = message.trim();
    const intent = extractIntent('', userQuery);
    const action = detectAction(intent, userQuery);

    if (!activeApiKey) {
      return sendJson(res, 200, {
        text: null,
        intent,
        action,
        language,
        timestamp: new Date().toISOString(),
        source: 'no_key',
        notice: 'GEMINI_API_KEY is not configured in Vercel environment variables or is a placeholder. Using dynamic local fallback.'
      });
    }

    const contextLines = [
      `User Name: ${userContext.name || 'Elder'}`,
      `Role: ${userContext.role || 'patient'}`,
      `Current Page: ${appContext.currentPage || 'home'}`,
      `Preferred Language: ${language}`
    ];

    if (gameContext.currentGame) {
      contextLines.push(`Active Game: ${gameContext.currentGame}`);
      if (gameContext.score !== undefined) contextLines.push(`Current Score: ${gameContext.score}%`);
      if (gameContext.attempts) contextLines.push(`Attempts: ${gameContext.attempts}`);
      if (gameContext.status) contextLines.push(`Game Status: ${gameContext.status}`);
    }

    if (gameContext.recentGame && gameContext.recentScore !== undefined) {
      contextLines.push(`User Recent Game Score: ${gameContext.recentScore}% in ${gameContext.recentGame}`);
    } else if (gameContext.hasGameSessions === false) {
      contextLines.push(`User Recent Game Score: No games played yet.`);
    }

    if (appContext.reminderSummary) {
      contextLines.push(`Reminders Status: ${appContext.reminderSummary.pendingCount} pending out of ${appContext.reminderSummary.total}. Next: ${appContext.reminderSummary.nextReminder}`);
    }

    const rawTurns = [];
    const recentHistory = (conversationHistory || []).slice(-10);
    for (const item of recentHistory) {
      const role = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
      const text = (item.message || item.text || item.content || '').trim();
      if (text) {
        rawTurns.push({ role, text });
      }
    }

    const promptWithContext = `[Context: ${contextLines.join(' | ')}]\n${userQuery}`;
    rawTurns.push({ role: 'user', text: promptWithContext });

    const contents = [];
    for (const turn of rawTurns) {
      if (contents.length === 0) {
        if (turn.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: turn.text }] });
        }
      } else {
        const prev = contents[contents.length - 1];
        if (prev.role === turn.role) {
          prev.parts[0].text += `\n${turn.text}`;
        } else {
          contents.push({ role: turn.role, parts: [{ text: turn.text }] });
        }
      }
    }

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: promptWithContext }] });
    }

    let modelName = getActiveModel();
    let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeApiKey}`;
    const effectiveSystemPrompt = (customSystemPrompt && String(customSystemPrompt).trim()) || activeSystemPrompt || DEFAULT_SYSTEM_PROMPT;

    let geminiCall = await fetchWithBackoff(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      modelName,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: effectiveSystemPrompt }]
        },
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024
        }
      })
    }, 3);

    if (!geminiCall.ok && geminiCall.status === 404) {
      console.warn(`Model ${modelName} returned 404. Attempting dynamic model discovery...`);
      const discovery = await discoverAndVerifyModel(activeApiKey);
      if (discovery.ok && discovery.model !== modelName) {
        modelName = discovery.model;
        setActiveModel(modelName);
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeApiKey}`;
        geminiCall = await fetchWithBackoff(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          modelName,
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: effectiveSystemPrompt }]
            },
            contents,
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 1024
            }
          })
        }, 3);
      }
    }

    if (!geminiCall.ok) {
      const safeMessage = mapGeminiError(geminiCall.status, geminiCall.errorText, geminiCall.diagnostics);
      return sendJson(res, geminiCall.status || 500, {
        text: null,
        status: geminiCall.status,
        error: safeMessage,
        source: geminiCall.status === 429 ? 'rate_limited' : 'api_error',
        retryDelaySeconds: geminiCall.diagnostics?.retryDelaySeconds || null,
        diagnostics: geminiCall.diagnostics || null,
        model: modelName
      });
    }

    const data = await geminiCall.response.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    let replyText = parts
      .filter(p => typeof p.text === 'string' && !p.thought)
      .map(p => p.text)
      .join('')
      .trim();

    const finishReason = candidate?.finishReason;
    const isTerminal = (str) => /[.!?।"]$/.test((str || '').trim());

    if (finishReason === 'MAX_TOKENS' || (replyText && !isTerminal(replyText))) {
      if (replyText && !isTerminal(replyText)) {
        try {
          const continueContents = [
            ...contents,
            { role: 'model', parts: [{ text: replyText }] },
            { role: 'user', parts: [{ text: 'Please complete your previous sentence and thought concisely without repeating earlier text.' }] }
          ];
          const contRes = await fetchWithBackoff(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            modelName,
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: effectiveSystemPrompt }] },
              contents: continueContents,
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 512
              }
            })
          }, 1);
          if (contRes.ok) {
            const contData = await contRes.response.json();
            const contParts = contData.candidates?.[0]?.content?.parts || [];
            const contText = contParts
              .filter(p => typeof p.text === 'string' && !p.thought)
              .map(p => p.text)
              .join('')
              .trim();
            if (contText) {
              replyText = `${replyText} ${contText}`.trim();
            }
          }
        } catch (contErr) {
          console.warn('Continuation generation failed:', contErr.message);
        }
      }

      if (replyText && !isTerminal(replyText)) {
        const lastTerminatorIndex = Math.max(
          replyText.lastIndexOf('.'),
          replyText.lastIndexOf('!'),
          replyText.lastIndexOf('?'),
          replyText.lastIndexOf('।')
        );
        if (lastTerminatorIndex > 20) {
          replyText = replyText.substring(0, lastTerminatorIndex + 1).trim();
        } else {
          replyText = `${replyText}.`;
        }
      }
    }

    if (!replyText) {
      return sendJson(res, 200, {
        text: null,
        error: 'Empty response from Gemini API',
        source: 'empty'
      });
    }

    return sendJson(res, 200, {
      text: replyText,
      language,
      intent,
      action,
      finishReason,
      timestamp: new Date().toISOString(),
      source: 'gemini',
      model: modelName
    });
  } catch (err) {
    console.error('Error handling chat request:', err);
    return sendJson(res, 500, {
      error: err.message || 'Internal server error processing chat',
      source: 'server_error'
    });
  }
}
