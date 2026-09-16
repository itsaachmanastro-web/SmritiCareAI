/**
 * Server-side Vite plugin providing /api/ai/chat, /api/ai/test, /api/ai/status,
 * and /api/ai/configure-key endpoints.
 * Securely calls Google Gemini API with dynamic model discovery and zero client key exposure.
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



function extractIntent(text, query) {
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

function detectAction(intent, query) {
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

function persistKeyToEnv(newKey, newModel) {
  const envPath = path.resolve(process.cwd(), '.env');
  let content = '';
  try {
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }
  } catch {}

  const trimmedKey = (newKey || '').trim();
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
    process.env.GEMINI_MODEL = newModel;
  }

  process.env.GEMINI_API_KEY = trimmedKey;
  try {
    fs.writeFileSync(envPath, content, 'utf8');
  } catch (err) {
    console.warn('Could not persist key to .env file:', err.message);
  }
}

export function chatApiPlugin(options = {}) {
  let cachedActiveModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  let activeSystemPrompt = DEFAULT_SYSTEM_PROMPT;

  return {
    name: 'smriti-chat-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // 1. Status Check: GET /api/ai/status
        if (req.method === 'GET' && url === '/api/ai/status') {
          const currentKey = process.env.GEMINI_API_KEY || options.apiKey || '';
          const hasKey = Boolean(currentKey && !currentKey.includes('your_') && currentKey.length >= 15);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            hasKey,
            model: cachedActiveModel || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
            defaultModel: DEFAULT_GEMINI_MODEL,
            supportedCandidates: PREFERRED_FLASH_MODELS,
            hasCustomPrompt: activeSystemPrompt !== DEFAULT_SYSTEM_PROMPT
          }));
          return;
        }

        // 2. System Prompt Get/Set Endpoints
        if (req.method === 'GET' && url === '/api/ai/system-prompt') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            systemPrompt: activeSystemPrompt,
            defaultPrompt: DEFAULT_SYSTEM_PROMPT,
            isDefault: activeSystemPrompt === DEFAULT_SYSTEM_PROMPT
          }));
          return;
        }

        if (req.method === 'POST' && url === '/api/ai/system-prompt') {
          let rawBody = '';
          req.on('data', chunk => { rawBody += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(rawBody || '{}');
              if (body.reset) {
                activeSystemPrompt = DEFAULT_SYSTEM_PROMPT;
              } else if (typeof body.systemPrompt === 'string' && body.systemPrompt.trim()) {
                activeSystemPrompt = body.systemPrompt.trim();
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                systemPrompt: activeSystemPrompt,
                isDefault: activeSystemPrompt === DEFAULT_SYSTEM_PROMPT
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 2. Configure Key Server-Side: POST /api/ai/configure-key
        if (req.method === 'POST' && url === '/api/ai/configure-key') {
          let rawBody = '';
          req.on('data', chunk => { rawBody += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(rawBody || '{}');
              const { apiKey, model } = body;
              persistKeyToEnv(apiKey, model);
              if (model) cachedActiveModel = model;

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                hasKey: Boolean(apiKey && apiKey.trim().length >= 15),
                model: cachedActiveModel
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Failed to configure key' }));
            }
          });
          return;
        }

        // 3. Test Live Connection: POST /api/ai/test or POST /api/test
        if (req.method === 'POST' && (url === '/api/ai/test' || url === '/api/test')) {
          let rawBody = '';
          req.on('data', chunk => { rawBody += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(rawBody || '{}');
              const headerKey = req.headers['x-gemini-api-key'];
              const keyToTest = (body.apiKey && String(body.apiKey).trim()) ||
                                (headerKey && String(headerKey).trim()) ||
                                process.env.GEMINI_API_KEY ||
                                options.apiKey || '';

              if (!keyToTest || keyToTest.includes('your_') || keyToTest.length < 15) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  connected: false,
                  status: 400,
                  error: '❌ No valid Gemini API key configured. Please enter your API key to test.',
                  model: null
                }));
                return;
              }

              const requestedModel = body.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

              // Step 1: Direct single test call with backoff (exactly 1 request)
              let chosenModel = requestedModel;
              let testCall = await testGenerateContent(keyToTest, chosenModel);
              let availableModels = null;

              // Step 2: Only if the requested model returns 404 (model unavailable), discover alternatives
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
                res.statusCode = testCall.status || 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  connected: false,
                  status: testCall.status,
                  error: testCall.error,
                  model: chosenModel,
                  diagnostics: testCall.diagnostics || null
                }));
                return;
              }

              // Verified successfully! Cache this active model for subsequent chat calls
              cachedActiveModel = chosenModel;

              // If the test provided a valid key and it worked, optionally persist to server runtime
              if (body.saveKey) {
                persistKeyToEnv(keyToTest, chosenModel);
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                connected: true,
                status: 200,
                model: chosenModel,
                sampleResponse: testCall.replyText,
                availableModels: availableModels || [chosenModel],
                diagnostics: null,
                message: `Gemini LLM Connected (${chosenModel})`
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                connected: false,
                status: 500,
                error: `❌ Internal error during connection test: ${err.message}`,
                model: null
              }));
            }
          });
          return;
        }

        // 4. Chat Endpoint: POST /api/ai/chat or POST /api/chat
        if (req.method === 'POST' && (url === '/api/ai/chat' || url === '/api/chat')) {
          let rawBody = '';
          req.on('data', chunk => { rawBody += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(rawBody || '{}');
              const {
                message,
                conversationHistory = [],
                language = 'en',
                userContext = {},
                appContext = {},
                gameContext = {},
                customSystemPrompt
              } = body;

              const headerKey = req.headers['x-gemini-api-key'];
              const envKey = process.env.GEMINI_API_KEY || options.apiKey;
              const rawKey = (headerKey && String(headerKey).trim()) || (envKey && String(envKey).trim()) || '';
              const isPlaceholder = !rawKey || rawKey.includes('your_') || rawKey.length < 15;
              const activeApiKey = isPlaceholder ? null : rawKey;

              if (!message || !message.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Message is required' }));
                return;
              }

              const userQuery = message.trim();
              const intent = extractIntent('', userQuery);
              const action = detectAction(intent, userQuery);

              // If no valid Gemini API key is configured, return no_key cleanly
              if (!activeApiKey) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  text: null,
                  intent,
                  action,
                  language,
                  timestamp: new Date().toISOString(),
                  source: 'no_key',
                  notice: 'GEMINI_API_KEY is not configured or is a placeholder. Using dynamic local fallback.'
                }));
                return;
              }

              // Context injection as system context turn
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
                contextLines.push(`User Recent Game Score: No games played yet. If asked, respond with: "I can't access a recent game score right now. Try playing one of our games, like Bihu Memory Match, and I'll remember your score!"`);
              }

              if (appContext.reminderSummary) {
                contextLines.push(`Reminders Status: ${appContext.reminderSummary.pendingCount} pending out of ${appContext.reminderSummary.total}. Next: ${appContext.reminderSummary.nextReminder}`);
              }

              // Build multi-turn history adhering strictly to Gemini API rules:
              // - Roles must strictly alternate: 'user', 'model', 'user', 'model'...
              // - First turn must be 'user'
              // - Last turn must be 'user' (the current query)
              const rawTurns = [];
              const recentHistory = (conversationHistory || []).slice(-10);
              for (const item of recentHistory) {
                const role = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
                const text = (item.message || item.text || item.content || '').trim();
                if (text) {
                  rawTurns.push({ role, text });
                }
              }

              // Current turn with contextual grounding
              const promptWithContext = `[Context: ${contextLines.join(' | ')}]\n${userQuery}`;
              rawTurns.push({ role: 'user', text: promptWithContext });

              // Normalize and alternate
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

              // Determine model name to call
              let modelName = cachedActiveModel || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
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

              // If 404, attempt dynamic model discovery to find active supported Flash model
              if (!geminiCall.ok && geminiCall.status === 404) {
                console.warn(`Model ${modelName} returned 404. Attempting dynamic model discovery...`);
                const discovery = await discoverAndVerifyModel(activeApiKey);
                if (discovery.ok && discovery.model !== modelName) {
                  modelName = discovery.model;
                  cachedActiveModel = modelName;
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
                res.statusCode = geminiCall.status || 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  text: null,
                  status: geminiCall.status,
                  error: safeMessage,
                  source: geminiCall.status === 429 ? 'rate_limited' : 'api_error',
                  retryDelaySeconds: geminiCall.diagnostics?.retryDelaySeconds || null,
                  diagnostics: geminiCall.diagnostics || null,
                  model: modelName
                }));
                return;
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

              // Completion safety check: ensure the response is never cut off mid-sentence
              const isTerminal = (str) => /[.!?।"]$/.test((str || '').trim());

              if (finishReason === 'MAX_TOKENS' || (replyText && !isTerminal(replyText))) {
                // If it ends abruptly, attempt automatic completion continuation
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

                // If still not ending on a complete sentence, clean up any trailing broken fragment
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
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  text: null,
                  error: 'Empty response from Gemini API',
                  source: 'empty'
                }));
                return;
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                text: replyText,
                language,
                intent,
                action,
                finishReason,
                timestamp: new Date().toISOString(),
                source: 'gemini',
                model: modelName
              }));
            } catch (err) {
              console.error('Error handling chat request:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: err.message || 'Internal server error processing chat',
                source: 'server_error'
              }));
            }
          });
          return;
        }

        // Pass through all other requests to Vite
        next();
      });
    },
    configurePreviewServer(server) {
      this.configureServer(server);
    }
  };
}
