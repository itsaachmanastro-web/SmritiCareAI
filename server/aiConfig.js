/**
 * Centralized Gemini AI Configuration & Model Discovery
 * Provides dynamic model verification, candidate resolution, and safe error mapping.
 */

export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

export const PREFERRED_FLASH_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite'
];

export const DEFAULT_SYSTEM_PROMPT = `You are Smriti, the AI assistant inside SmritiCare — "AI for Brighter Minds".

Your job is to help users understand and use the SmritiCare application and its supported dementia-care features.

You are NOT a general-purpose AI assistant.

YOUR PRIMARY PURPOSE:
Help users with questions directly related to:
- SmritiCare
- using the SmritiCare application
- patient features
- caregiver features
- reminders
- cognitive games
- cognitive progress
- community features
- caregiver calling/contact features
- offline-first functionality
- IndexedDB/local data persistence
- synchronization
- language settings
- voice assistant
- application settings
- account/login
- troubleshooting SmritiCare features
- explaining how SmritiCare works
- explaining the purpose of SmritiCare
- explaining the North-East India cultural/language focus of SmritiCare

You should answer these questions clearly, patiently, and in simple language.

--------------------------------------------------
DOMAIN RESTRICTION
--------------------------------------------------

If the user asks a question unrelated to SmritiCare, politely refuse to answer it as a general-purpose assistant.

For example:

User:
"What is the capital of France?"

Respond:

"I'm SmritiCare's assistant, so I can help you with SmritiCare, its features, games, reminders, caregiver tools, and how to use the app. For other topics, please use a general search or general assistant."

--------------------------------------------------
CRITICAL DEMENTIA CARE & SAFETY GUIDELINES
--------------------------------------------------
1. Always keep responses calm, clear, and concise. Give concise, complete answers. Never stop in the middle of a sentence. Avoid walls of text.
2. Use warm, simple words suitable for elderly dementia patients. Avoid complex medical jargon.
3. NEVER make clinical diagnoses (e.g. never say "You have dementia").
4. NEVER recommend or alter prescription medications. Direct medical inquiries to their caregiver or doctor.
5. In cognitive games, provide gentle clues or encouragement without spoiling the puzzle solution.
6. Provide immediate calming emotional grounding if the user feels distressed, lost, or scared.
7. Respond in the user's preferred language (e.g. Assamese, Bodo, Meitei, Khasi, Mizo, Garo, Bengali, Hindi, or English).

--------------------------------------------------
RESPONSE COMPLETENESS
--------------------------------------------------
Always finish your response completely.

Never end a response in the middle of a sentence, word, instruction, or thought.

For simple questions, provide a concise but complete answer.

If a response is longer than necessary, shorten it by removing unnecessary information BEFORE generating the answer, rather than cutting the answer off halfway.`;

export const DOMAIN_REFUSAL_MESSAGE = "I'm SmritiCare's assistant, so I can help you with SmritiCare, its features, games, reminders, caregiver tools, and how to use the app. For other topics, please use a general search or general assistant.";

/**
 * Extracts structured diagnostics from Gemini API error responses
 * without exposing sensitive API keys.
 */
export function parseGeminiErrorDiagnostics(status, errorBody = '', headers = null, endpoint = '', model = '') {
  let parsed = null;
  let rawText = '';
  try {
    if (typeof errorBody === 'string' && errorBody.trim()) {
      rawText = errorBody;
      parsed = JSON.parse(errorBody);
    } else if (typeof errorBody === 'object' && errorBody !== null) {
      parsed = errorBody;
      rawText = JSON.stringify(errorBody);
    }
  } catch {
    rawText = String(errorBody);
  }

  const errObj = parsed?.error || parsed || {};
  const message = errObj.message || rawText || '';
  const code = errObj.code || status;
  const statusStr = errObj.status || (status === 429 ? 'RESOURCE_EXHAUSTED' : 'ERROR');

  // Extract Retry-After from header or error details
  let retryDelaySeconds = null;
  if (headers && typeof headers.get === 'function') {
    const retryHeader = headers.get('retry-after');
    if (retryHeader) {
      const parsedSec = parseInt(retryHeader, 10);
      if (!isNaN(parsedSec)) retryDelaySeconds = parsedSec;
    }
  }

  // Look inside details array for RetryInfo, QuotaFailure, ErrorInfo
  let quotaMetric = null;
  let quotaLimit = null;
  let quotaLocation = null;
  const details = Array.isArray(errObj.details) ? errObj.details : [];

  for (const item of details) {
    // RetryInfo
    if (item['@type']?.includes('RetryInfo') || item.retryDelay) {
      const match = String(item.retryDelay || '').match(/(\d+(\.\d+)?)/);
      if (match && !retryDelaySeconds) {
        retryDelaySeconds = Math.ceil(parseFloat(match[1]));
      }
    }
    // QuotaFailure
    if (item['@type']?.includes('QuotaFailure') && Array.isArray(item.violations)) {
      for (const v of item.violations) {
        if (v.description) {
          const metricMatch = v.description.match(/quota metric '([^']+)'/i);
          if (metricMatch) quotaMetric = metricMatch[1];
          const limitMatch = v.description.match(/limit '([^']+)'/i);
          if (limitMatch) quotaLimit = limitMatch[1];
        }
        if (v.subject) quotaLocation = v.subject;
      }
    }
    // ErrorInfo
    if (item['@type']?.includes('ErrorInfo') && item.metadata) {
      if (!quotaMetric) {
        quotaMetric = item.metadata.metric || item.metadata.quota_metric || null;
      }
      if (!quotaLimit) {
        quotaLimit = item.metadata.quota_limit || item.metadata.limit || null;
      }
      if (!quotaLocation) {
        quotaLocation = item.metadata.quota_location || item.metadata.location || item.metadata.consumer || null;
      }
    }
  }

  // Also check regex in message for metric, limit, and retry delay
  if (!quotaMetric) {
    const metricMatch = message.match(/metric:\s*([^\s,]+)/i);
    if (metricMatch) quotaMetric = metricMatch[1];
  }
  if (!quotaLimit) {
    const limitMatch = message.match(/limit:\s*([^\s,]+)/i);
    if (limitMatch) quotaLimit = limitMatch[1];
  }
  if (!retryDelaySeconds) {
    const delayMatch = message.match(/retry\s+(?:after|in)\s+(\d+(?:\.\d+)?)\s*s/i);
    if (delayMatch) {
      retryDelaySeconds = Math.ceil(parseFloat(delayMatch[1]));
    }
  }

  // Sanitize endpoint to never expose API key
  const safeEndpoint = endpoint ? endpoint.replace(/key=[^&]+/i, 'key=REDACTED') : '';

  return {
    status,
    code,
    statusStr,
    message,
    model,
    endpoint: safeEndpoint,
    sanitizedUrl: safeEndpoint,
    retryDelaySeconds,
    quotaMetric,
    quotaLimit,
    quotaLocation,
    timestamp: new Date().toISOString()
  };
}

/**
 * Maps HTTP status and error bodies to human-readable, safe messages
 */
export function mapGeminiError(status, errorBody = '', diagnostics = null) {
  let detail = '';
  try {
    if (typeof errorBody === 'string' && errorBody.trim()) {
      const parsed = JSON.parse(errorBody);
      detail = parsed.error?.message || '';
    } else if (typeof errorBody === 'object' && errorBody !== null) {
      detail = errorBody.message || errorBody.error?.message || '';
    }
  } catch {
    detail = String(errorBody);
  }

  const retrySec = diagnostics?.retryDelaySeconds;
  const retryNote = retrySec ? ` Try again in approximately ${retrySec} seconds.` : '';

  switch (status) {
    case 400:
      return detail.toLowerCase().includes('key')
        ? '❌ Invalid API key format. Please check your Google Gemini API key.'
        : `❌ Invalid request to Gemini API (400): ${detail || 'Check parameters and model compatibility.'}`;
    case 401:
      return '❌ Invalid API key (401). Please verify your Google Gemini API key created at Google AI Studio (aistudio.google.com).';
    case 403:
      return '❌ Access forbidden or quota restricted (403). Ensure Generative Language API is enabled for your project.';
    case 404:
      return `❌ Gemini model not found (404). The requested model is unavailable. ${detail ? `(${detail})` : ''}`.trim();
    case 429:
      return `⚠️ Gemini is temporarily rate-limited. Your API project's request or token quota has been reached. Please wait and try again.${retryNote}`;
    case 500:
    case 502:
    case 503:
    case 504:
      return '❌ Google Gemini service is temporarily unavailable (500/503). Please retry shortly.';
    default:
      return `❌ Gemini API returned error (${status}): ${detail || 'Request failed.'}`;
  }
}

/**
 * Query Google's models endpoint to verify key and discover supported Flash models
 */
export async function discoverAndVerifyModel(apiKey, requestedModel = null) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return {
      ok: false,
      status: 400,
      error: '❌ No API key provided. Please configure GEMINI_API_KEY.'
    };
  }

  const cleanKey = apiKey.trim();
  const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;

  try {
    const res = await fetch(modelsUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        status: res.status,
        error: mapGeminiError(res.status, errText)
      };
    }

    const data = await res.json();
    const rawModels = Array.isArray(data.models) ? data.models : [];

    // Filter models supporting generateContent
    const supported = rawModels.filter(m =>
      Array.isArray(m.supportedGenerationMethods) &&
      m.supportedGenerationMethods.includes('generateContent')
    );

    if (supported.length === 0) {
      return {
        ok: false,
        status: 404,
        error: '❌ No models with generateContent capability found for this API key.'
      };
    }

    const supportedNames = supported.map(m => m.name.replace(/^models\//, ''));

    // 1. If a specific model was requested and exists
    const target = requestedModel || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    if (supportedNames.includes(target)) {
      return {
        ok: true,
        model: target,
        availableModels: supportedNames
      };
    }

    // 2. Look through PREFERRED_FLASH_MODELS in order
    for (const candidate of PREFERRED_FLASH_MODELS) {
      if (supportedNames.includes(candidate)) {
        return {
          ok: true,
          model: candidate,
          availableModels: supportedNames
        };
      }
    }

    // 3. Look for any active model containing 'flash'
    const flashMatch = supportedNames.find(name => name.toLowerCase().includes('flash'));
    if (flashMatch) {
      return {
        ok: true,
        model: flashMatch,
        availableModels: supportedNames
      };
    }

    // 4. Fallback to first available model supporting generateContent
    return {
      ok: true,
      model: supportedNames[0],
      availableModels: supportedNames
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: `❌ Cannot reach Google Gemini servers. ${err.message || 'Check internet connection.'}`
    };
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a fetch with exponential backoff and jitter for transient 429/503 errors.
 * Never loops infinitely; capped at maxRetries (default 2).
 */
export async function fetchWithBackoff(url, options = {}, maxRetries = 2) {
  let attempt = 0;
  let lastStatus = 0;
  let lastErrorText = '';
  let lastDiagnostics = null;

  while (attempt <= maxRetries) {
    try {
      const fetchSignal = options.signal || (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(8500) : undefined);
      const res = await fetch(url, { ...options, signal: fetchSignal });
      if (res.ok) {
        return { ok: true, response: res, status: res.status, diagnostics: null };
      }

      const errorText = await res.text();
      lastStatus = res.status;
      lastErrorText = errorText;

      const diagnostics = parseGeminiErrorDiagnostics(
        res.status,
        errorText,
        res.headers,
        url,
        options.modelName || ''
      );
      lastDiagnostics = diagnostics;

      // Transient 429 (quota/rate limit) or 500/502/503/504 (service temporarily unavailable/capacity)
      const isTransient = res.status === 429 || res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504;
      if (!isTransient || attempt >= maxRetries) {
        console.warn(`[Gemini API ${res.status}] Diagnostics:`, {
          status: diagnostics.status,
          code: diagnostics.statusStr,
          model: diagnostics.model,
          retryDelaySeconds: diagnostics.retryDelaySeconds,
          quotaMetric: diagnostics.quotaMetric,
          quotaLimit: diagnostics.quotaLimit,
          quotaLocation: diagnostics.quotaLocation,
          message: diagnostics.message
        });
        return { ok: false, status: res.status, errorText, diagnostics };
      }

      attempt++;

      // Compute backoff: respect server retryDelaySeconds if short, else exponential backoff with jitter
      let backoffMs;
      if (diagnostics.retryDelaySeconds && diagnostics.retryDelaySeconds > 0 && diagnostics.retryDelaySeconds <= 5) {
        backoffMs = diagnostics.retryDelaySeconds * 1000 + Math.random() * 250;
      } else {
        // Attempt 1: ~800ms, Attempt 2: ~1600ms + jitter
        const baseDelay = Math.pow(2, attempt - 1) * 800;
        const jitter = Math.random() * 300;
        backoffMs = Math.min(baseDelay + jitter, 3000);
      }

      console.warn(`[Gemini ${res.status}] Transient rate limit/error. Attempt ${attempt}/${maxRetries}. Backing off for ${Math.round(backoffMs)}ms...`);
      await sleep(backoffMs);
    } catch (netErr) {
      if (attempt >= maxRetries) {
        return {
          ok: false,
          status: 0,
          errorText: netErr.message,
          diagnostics: { status: 0, message: netErr.message, model: options.modelName }
        };
      }
      attempt++;
      const backoffMs = Math.pow(2, attempt - 1) * 800 + Math.random() * 200;
      await sleep(backoffMs);
    }
  }

  return { ok: false, status: lastStatus, errorText: lastErrorText, diagnostics: lastDiagnostics };
}

/**
 * Send a minimal prompt to verify model generateContent actually responds successfully.
 * Uses safe backoff and returns structured diagnostics on failure.
 */
export async function testGenerateContent(apiKey, modelName) {
  const cleanKey = (apiKey || '').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;

  const result = await fetchWithBackoff(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    modelName,
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Hello Smriti, confirm connection with one short friendly sentence.' }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    })
  }, 1);

  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      error: mapGeminiError(result.status, result.errorText, result.diagnostics),
      diagnostics: result.diagnostics
    };
  }

  try {
    const data = await result.response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    let replyText = parts
      .filter(p => typeof p.text === 'string' && !p.thought)
      .map(p => p.text)
      .join('')
      .trim();

    if (!replyText && parts.length > 0) {
      replyText = parts.map(p => p.text || '').join('').trim();
    }

    if (!replyText) {
      return {
        ok: false,
        status: 200,
        error: '❌ Gemini responded with empty content.'
      };
    }

    return {
      ok: true,
      status: 200,
      replyText
    };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      error: `Failed to parse Gemini response: ${err.message}`
    };
  }
}
