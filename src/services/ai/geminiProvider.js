/**
 * Centralized Google Gemini Provider Client
 * Delegates conversational requests through the backend /api/ai/chat endpoint
 * keeping API keys strictly server-side and using current Flash models.
 */

export class GeminiProvider {
  constructor() {
    this.model = 'gemini-3.5-flash';
  }

  isAvailable() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  async generateResponse(queryText, context = {}) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          language: context.currentLanguage || 'en',
          userContext: {
            name: context.userName,
            role: context.userRole
          },
          appContext: {
            currentPage: context.currentPage
          },
          gameContext: {
            currentGame: context.currentGameName,
            score: context.currentScore
          }
        })
      });

      const contentType = response.headers ? (response.headers.get('content-type') || '') : '';
      if (!response.ok || !contentType.includes('application/json')) {
        return null;
      }

      const data = await response.json();
      return data.text || null;
    } catch (err) {
      console.warn('Gemini Provider error, falling back to local engine:', err);
      return null;
    }
  }
}

export const geminiProvider = new GeminiProvider();
