/**
 * Dynamic Contextual Knowledge Engine & Offline Fallback
 * Provides intelligent, varied, non-repetitive responses when offline or when
 * an external LLM API key is unconfigured.
 */
import { searchFaq } from '../../data/faq/faqData.js';
import { getGameKnowledge, GAME_KNOWLEDGE } from '../../data/gameKnowledge/gameKnowledgeData.js';
import { getLanguage } from '../translation/languageRegistry.js';
import { db } from '../../db/dexie.js';
import { DOMAIN_REFUSAL_MESSAGE } from '../../config/aiConfig.js';

export class LocalFallbackProvider {
  /**
   * Classify user query intent
   */
  classifyIntent(text) {
    const q = (text || '').toLowerCase().trim();

    if (q.includes('call') || q.includes('emergency') || q.includes('urgent') || q.includes('priya')) {
      return 'EMERGENCY';
    }
    if (q.includes('diagnose') || q.includes('dementia') || q.includes('am i sick') || q.includes('pill') || q.includes('medicine change') || q.includes('prescription')) {
      return 'MEDICAL_DISCLAIMER';
    }
    if (q.includes('again') || q.includes('repeat') || q.includes('one more time') || q.includes('say that again')) {
      return 'EXPLAIN_AGAIN';
    }
    if (q.includes('what games') || q.includes('list games') || q.includes('all games') || q.includes('which games') || q.includes('what can i play')) {
      return 'LIST_GAMES';
    }
    if (q.includes('open game') || q.includes('play game') || q.includes('go to game') || q.includes('show games')) {
      return 'NAV_GAMES';
    }
    if (q.includes('open reminder') || q.includes('show reminder') || q.includes('my reminders') || q.includes('go to reminders')) {
      return 'NAV_REMINDERS';
    }
    if (q.includes('open community') || q.includes('go to community') || q.includes('show community') || q.includes('what is community') || q.includes('community page')) {
      return 'NAV_COMMUNITY';
    }
    if (q.includes('progress') || q.includes('my star') || q.includes('my stars') || q.includes('go to progress')) {
      return 'NAV_PROGRESS';
    }
    if (q.includes('go home') || q.includes('home page') || q.includes('back home')) {
      return 'NAV_HOME';
    }
    if (q.includes('dark mode') || q.includes('light mode') || q.includes('switch theme') || q.includes('change theme')) {
      return 'THEME';
    }
    if (q.includes('change language') || q.includes('assamese') || q.includes('bengali') || q.includes('hindi') || q.includes('english')) {
      return 'LANGUAGE';
    }
    if (q.includes('how do i play') || q.includes('rules') || q.includes('how to play') || q.includes('instructions') || q.includes('what should i do') || q.includes('what do i do') || q.includes('hint') || q.includes('clue')) {
      return 'GAME_HELP';
    }
    if (q.includes('score') || q.includes('how did i do') || q.includes('my result') || q.includes('points') || q.includes('did i win') || q.includes('my performance')) {
      return 'GAME_RESULT';
    }
    if (q.includes('what do i have today') || q.includes('what are my reminders') || q.includes('my medicine') || q.includes('schedule') || q.includes('did i take')) {
      return 'REMINDER_QUERY';
    }
    if (q.includes('scared') || q.includes('confused') || q.includes('lost') || q.includes('where am i') || q.includes('sad') || q.includes('alone') || q.includes('help me feel calm')) {
      return 'WELLNESS';
    }
    if (q.includes('who are you') || q.includes('what is smriticare') || q.includes('about yourself') || q.includes('tell me about you')) {
      return 'ABOUT';
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('namaste') || q.includes('good morning') || q.includes('good afternoon') || q.includes('good evening') || q.includes('talk to me')) {
      return 'GREETING';
    }

    // Domain restriction check: general queries unrelated to SmritiCare
    const outOfDomainPatterns = [
      'capital of', 'president of', 'prime minister', 'write code', 'python',
      'javascript', 'solve math', 'solve 2', 'who invented', 'recipe',
      'weather in', 'weather today', 'stock price', 'bitcoin', 'crypto',
      'football', 'cricket score', 'movie', 'actor', 'actress', 'song lyrics',
      'quantum', 'physics', 'chemistry', 'biology', 'geography', 'france',
      'paris', 'germany', 'tell me a joke', 'who is elon', 'who is biden',
      'who is trump', 'who is modi', 'write an essay', 'translate to french',
      'translate to spanish', 'what is the height', 'how far is', 'tallest building'
    ];
    if (outOfDomainPatterns.some(p => q.includes(p))) {
      return 'OUT_OF_DOMAIN';
    }

    return 'CONVERSATIONAL';
  }

  /**
   * Generate dynamic response based on text, context, and conversation history
   */
  async generateResponse(queryText, context = {}) {
    const lang = context.currentLanguage || 'en';
    const langConfig = getLanguage(lang);
    const intent = this.classifyIntent(queryText);
    const userName = context.userName || context.userContext?.name || 'Amma';
    const isCaregiver = context.userRole === 'caregiver' || context.userContext?.role === 'caregiver';

    let replyText = '';
    let action = null;

    // 0. DOMAIN RESTRICTION REFUSAL
    if (intent === 'OUT_OF_DOMAIN') {
      replyText = DOMAIN_REFUSAL_MESSAGE;
      return { replyText, intent: 'OUT_OF_DOMAIN', action: null, language: lang };
    }

    // 1. EMERGENCY
    if (intent === 'EMERGENCY') {
      replyText = `I am opening your direct line to call your primary caregiver Priya Borah right away. Stay calm, help is right with you.`;
      action = { type: 'OPEN_EMERGENCY_MODAL' };
      return { replyText, intent, action, language: lang };
    }

    // 2. MEDICAL SAFETY DISCLAIMER
    if (intent === 'MEDICAL_DISCLAIMER') {
      replyText = `I am your friendly care companion, not a doctor. I cannot diagnose dementia or change medicines. Please speak directly with your caregiver Priya or your PHC medical officer.`;
      return { replyText, intent, action, language: lang };
    }

    // 3. EXPLAIN AGAIN / REPEAT
    if (intent === 'EXPLAIN_AGAIN') {
      const history = context.conversationHistory || [];
      const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant' || m.role === 'model');

      if (lastAssistantMsg && (lastAssistantMsg.message || lastAssistantMsg.text)) {
        const prevText = lastAssistantMsg.message || lastAssistantMsg.text;
        replyText = `Of course, ${userName}. Let me explain it more simply: ${prevText}`;
      } else if (context.currentGameName) {
        replyText = `Let's take it step by step for ${context.currentGameName}: First, relax and look at the screen. Choose your move carefully without rushing. I am here supporting you!`;
      } else {
        replyText = `Certainly, ${userName}. In SmritiCare, you can play memory games to brighten your mind, or check your daily reminders. What would you like to explore?`;
      }
      return { replyText, intent, action, language: lang };
    }

    // 4. LIST ALL GAMES
    if (intent === 'LIST_GAMES') {
      replyText = `We have 4 fun games in SmritiCare: 1) Bihu Memory Match, 2) Mekhela Pattern Weaving, 3) Tea Garden Morning Routine, and 4) Sounds of the Hills. Tap Games to start playing!`;
      action = { type: 'NAVIGATE', path: '/patient/games' };
      return { replyText, intent, action, language: lang };
    }

    // 5. SPECIFIC GAME INSTRUCTIONS (Context-Aware)
    if (intent === 'GAME_HELP') {
      const q = queryText.toLowerCase();
      let targetGame = null;

      if (q.includes('bihu') || q.includes('memory')) targetGame = GAME_KNOWLEDGE.bihu;
      else if (q.includes('mekhela') || q.includes('pattern') || q.includes('weaving')) targetGame = GAME_KNOWLEDGE.mekhela;
      else if (q.includes('tea') || q.includes('routine') || q.includes('morning')) targetGame = GAME_KNOWLEDGE.teagarden;
      else if (q.includes('sound') || q.includes('hill') || q.includes('music')) targetGame = GAME_KNOWLEDGE.soundshills;
      else if (context.currentGameId) targetGame = getGameKnowledge(context.currentGameId);

      if (targetGame) {
        if (q.includes('hint') || q.includes('clue')) {
          replyText = targetGame.hintWithoutSpoiling(context.currentGameState);
        } else {
          replyText = `In ${targetGame.name}: ${targetGame.rules.slice(0, 3).join(' ')}`;
        }
        return { replyText, intent, action, language: lang };
      } else {
        replyText = `To play our games, tap any game from the Games screen. In Bihu Memory, you match pairs of cultural cards. In Mekhela, you complete traditional weaving borders. Which one would you like to try?`;
        return { replyText, intent, action, language: lang };
      }
    }

    // 6. SCORE & PERFORMANCE QUERY (Context-Aware from Dexie)
    if (intent === 'GAME_RESULT') {
      // Check active game context first
      if (context.gameContext?.score !== undefined || context.currentScore !== undefined) {
        const score = context.gameContext?.score ?? context.currentScore;
        const gName = context.gameContext?.currentGame || context.currentGameName || 'your game';
        replyText = `In ${gName}, your score is ${score}%. You are playing wonderfully today, ${userName}!`;
        return { replyText, intent, action, language: lang };
      }

      // Query Dexie database for authenticated user's actual latest game session
      const targetUserId = context.userId || context.userContext?.id || (typeof localStorage !== 'undefined' ? Number(localStorage.getItem('smriti_user_id')) : null);
      if (targetUserId) {
        try {
          const lastSession = await db.gameSessions
            .where('userId')
            .equals(targetUserId)
            .reverse()
            .first();

          if (lastSession) {
            replyText = `In your recent ${lastSession.gameName} session, you scored ${lastSession.score}%. Excellent effort, ${userName}! Regular gentle play keeps your mind bright.`;
            return { replyText, intent, action, language: lang };
          }
        } catch (e) {
          console.warn('Could not read session from Dexie:', e);
        }
      }

      replyText = `I can't access a recent game score right now. Try playing one of our games, like Bihu Memory Match, and I'll remember your score!`;
      return { replyText, intent, action, language: lang };
    }

    // 7. REMINDERS QUERY (Context-Aware from Dexie)
    if (intent === 'REMINDER_QUERY') {
      const targetUserId = context.userId || context.userContext?.id || (typeof localStorage !== 'undefined' ? Number(localStorage.getItem('smriti_user_id')) : null);
      if (targetUserId) {
        try {
          const allReminders = await db.reminders.toArray();
          const reminders = allReminders.filter(r => Number(r.targetUserId) === Number(targetUserId) || Number(r.userId) === Number(targetUserId));

          if (reminders && reminders.length > 0) {
            const pending = reminders.filter(r => !r.done);
            if (pending.length === 0) {
              replyText = `Wonderful news, ${userName}! All ${reminders.length} daily reminders are completed. Rest and relax.`;
            } else {
              const nextItem = pending[0];
              replyText = `You have ${pending.length} reminder${pending.length > 1 ? 's' : ''} left today, ${userName}. Next is "${nextItem.label || nextItem.title}" at ${nextItem.time}.`;
            }
            return { replyText, intent, action, language: lang };
          }
        } catch (e) {
          console.warn('Could not read reminders from Dexie:', e);
        }
      }

      replyText = `You have a gentle daily schedule for medicines and hydration, ${userName}. Tap Reminders to view your list.`;
      action = { type: 'NAVIGATE', path: '/patient/reminders' };
      return { replyText, intent, action, language: lang };
    }

    // 8. NAVIGATION ACTIONS
    if (intent === 'NAV_GAMES') {
      replyText = `Opening your cognitive games now. Let's play together, ${userName}!`;
      action = { type: 'NAVIGATE', path: '/patient/games' };
      return { replyText, intent, action, language: lang };
    }
    if (intent === 'NAV_REMINDERS') {
      replyText = `Opening your daily reminders and medicine schedule.`;
      action = { type: 'NAVIGATE', path: '/patient/reminders' };
      return { replyText, intent, action, language: lang };
    }
    if (intent === 'NAV_COMMUNITY') {
      replyText = `Opening the Global Dementia Community. Here you can connect with other families and caregivers.`;
      action = { type: 'NAVIGATE', path: '/community' };
      return { replyText, intent, action, language: lang };
    }
    if (intent === 'NAV_PROGRESS') {
      replyText = `Opening your progress dashboard to see your golden stars and vitality index.`;
      action = { type: 'NAVIGATE', path: '/patient/progress' };
      return { replyText, intent, action, language: lang };
    }
    if (intent === 'NAV_HOME') {
      replyText = `Taking you back to your home screen.`;
      action = { type: 'NAVIGATE', path: '/patient/home' };
      return { replyText, intent, action, language: lang };
    }

    // 9. THEME & LANGUAGE
    if (intent === 'THEME') {
      const wantDark = queryText.toLowerCase().includes('dark');
      replyText = wantDark ? `Switching to dark mode for comfortable reading.` : `Switching to bright light mode.`;
      action = { type: 'TOGGLE_THEME', theme: wantDark ? 'dark' : 'light' };
      return { replyText, intent, action, language: lang };
    }
    if (intent === 'LANGUAGE') {
      replyText = `You can tap the Globe icon (🌐) at the top of the screen to choose from Assamese, Bodo, Meitei, Khasi, Mizo, Garo, Bengali, Hindi, or English.`;
      return { replyText, intent, action, language: lang };
    }

    // 10. WELLNESS & GROUNDING
    if (intent === 'WELLNESS') {
      replyText = `You are safe here at home, ${userName}. Take a slow, gentle breath with me. Everything is peaceful and alright.`;
      return { replyText, intent, action, language: lang };
    }

    // 11. ABOUT SMRITICARE
    if (intent === 'ABOUT') {
      replyText = `I am Smriti, your AI care companion. SmritiCare was built for elderly dementia patients in North East India, featuring local games, reminders, and offline memory support.`;
      return { replyText, intent, action, language: lang };
    }

    // 12. GREETINGS
    if (intent === 'GREETING') {
      replyText = `Hello ${userName}! It is lovely to talk with you. What would you like to do today? We can play a game, check your reminders, or simply chat.`;
      return { replyText, intent, action, language: lang };
    }

    // 13. FAQ LOOKUP
    const faqAns = searchFaq(queryText);
    if (faqAns) {
      replyText = faqAns;
      return { replyText, intent: 'FAQ', action, language: lang };
    }

    // 14. DOMAIN GROUNDING & CONVERSATIONAL SYNTHESIS
    // Check if query is within SmritiCare domain (games, reminders, dementia, caregiver, app, greetings)
    const smritiDomainTerms = [
      'smriti', 'care', 'game', 'play', 'score', 'bihu', 'mekhela', 'tea', 'hill', 'sound',
      'reminder', 'medicine', 'pill', 'doctor', 'priya', 'caregiver', 'family', 'phc',
      'progress', 'memory', 'star', 'dementia', 'app', 'help', 'setting', 'language', 'theme',
      'offline', 'sync', 'hello', 'hi', 'namaste', 'how are you', 'thank', 'who are you',
      'routine', 'bodo', 'assamese', 'bengali', 'hindi', 'assam', 'guwahati'
    ];
    const qLower = (queryText || '').toLowerCase();
    const isDomainRelated = smritiDomainTerms.some(term => qLower.includes(term));

    if (!isDomainRelated) {
      return {
        replyText: DOMAIN_REFUSAL_MESSAGE,
        intent: 'OUT_OF_DOMAIN',
        action: null,
        language: lang
      };
    }

    replyText = `I heard you ask: "${queryText}". I am here supporting you with your daily routine and games, ${userName}. To enable full open-ended conversational AI for all SmritiCare features, add your Gemini API key in settings!`;
    return { replyText, intent: 'CONVERSATIONAL', action, language: lang };
  }
}

export const localFallbackProvider = new LocalFallbackProvider();
