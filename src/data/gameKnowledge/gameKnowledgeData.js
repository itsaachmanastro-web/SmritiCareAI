/**
 * Cognitive Game Knowledge Base
 * Provides game-specific instructions, encouragement, hints, and score explanations
 * for all 4 SmritiCare cultural games.
 */

export const GAME_KNOWLEDGE = {
  bihu: {
    id: 'bihu',
    name: 'Bihu Memory Match',
    domain: 'Memory & Recall',
    culturalOrigin: 'Assam & North East India Bihu festival heritage',
    description: 'A gentle card-matching game featuring traditional Assamese symbols like Japi, Dhol, and Kopou Phool.',
    rules: [
      'Look carefully at the cards shown face-down on the board.',
      'Tap any card to turn it over and reveal its picture.',
      'Tap a second card to see if it matches the first card.',
      'If both pictures match, they remain open. If they are different, they turn back over.',
      'Keep going until you have found all the matching pairs.'
    ],
    difficultyLevels: {
      easy: '4 pairs (8 cards total) — gentle pace for relaxed memory recall',
      medium: '6 pairs (12 cards total) — balanced cognitive stimulation',
      hard: '8 pairs (16 cards total) — comprehensive memory exercise'
    },
    hintWithoutSpoiling: (state) => {
      if (!state || state.flippedCount === 0) {
        return 'Start by tapping any card near the top row. Take a quiet moment to remember where it is.';
      }
      return 'Take your time. There is no rush. Try to remember a picture you noticed earlier.';
    },
    explainScore: (score, mistakes, timeSeconds) => {
      const mins = Math.floor(timeSeconds / 60);
      const secs = timeSeconds % 60;
      const timeStr = mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''} ${secs} seconds` : `${secs} seconds`;

      if (score >= 90) {
        return `You did wonderfully! You scored ${score} points and found all the pairs in ${timeStr} with very few misses. Your visual memory is sharp and active today.`;
      }
      if (score >= 70) {
        return `Good job on completing the game! You scored ${score} points in ${timeStr}. Every match you made helps keep your memory warm and engaged.`;
      }
      return `Well done for completing the Bihu game! You scored ${score} points. Remember, practicing gently every day is what keeps our mind bright and healthy. You can try again whenever you like.`;
    }
  },

  mekhela: {
    id: 'mekhela',
    name: 'Mekhela Pattern Weaving',
    domain: 'Pattern Recognition & Visual Reasoning',
    culturalOrigin: 'Assamese handloom and North Eastern textile weaving motifs',
    description: 'Identify the missing motif in traditional woven border sequences like Kingkhap Diamond and Naga Chevron.',
    rules: [
      'Look at the sequence of weaving border motifs shown on screen.',
      'Observe the repeating pattern carefully from left to right.',
      'Notice the empty spot with the question mark.',
      'Choose the tile from the options below that correctly continues the border pattern.'
    ],
    motifs: [
      'Muga Kingkhap (Golden Diamond)',
      'Assam Kesu (Red Folk Motif)',
      'Naga Woven Chevron',
      'Mizo Puan Lozenge'
    ],
    hintWithoutSpoiling: (state) => {
      return 'Look at the color and shape of the first two tiles. Notice how they repeat in a steady rhythm, just like on a weaving loom.';
    },
    explainScore: (score, correctCount, totalQuestions) => {
      if (score >= 85) {
        return `Excellent pattern recognition! You solved ${correctCount} motifs with a score of ${score}%. Your eye for detail and design is working beautifully today.`;
      }
      return `You completed the weaving puzzle with a score of ${score}%. Recognizing these traditional motifs is great exercise for your reasoning. Be proud of your effort!`;
    }
  },

  teagarden: {
    id: 'teagarden',
    name: 'Tea Garden Daily Routine',
    domain: 'Routine & Executive Function',
    culturalOrigin: 'North East tea garden morning heritage',
    description: 'Sequence 4 morning tasks chronologically from waking up to sipping hot morning Assam tea.',
    rules: [
      'Look at the 4 morning activity cards presented.',
      'Think about what you naturally do first when waking up in the morning.',
      'Tap each step in order: what happens first, second, third, and fourth.',
      'Press "Check My Routine" when all 4 steps are arranged.'
    ],
    hintWithoutSpoiling: (state) => {
      return 'Think of your peaceful morning at home. What is the very first thing you do right when the sun rises and you open your eyes? Start there.';
    },
    explainScore: (score, isCorrect) => {
      if (isCorrect || score >= 90) {
        return `Splendid! You organized your morning routine in perfect order with a score of ${score}%. Sequential routines help keep your daily living smooth and calm.`;
      }
      return `You finished the routine sequence with ${score}%. Thinking through daily morning steps is a fantastic way to support your daily independence.`;
    }
  },

  soundshills: {
    id: 'soundshills',
    name: 'Sounds of the Hills',
    domain: 'Auditory Attention & Focus',
    culturalOrigin: 'North Eastern folk music instruments and natural hill soundscapes',
    description: 'Listen to gentle regional acoustic sounds and tap the matching musical instrument or natural soundscape.',
    rules: [
      'Press the speaker button to listen to the gentle melody or regional sound.',
      'Listen closely to the rhythm and tone.',
      'Look at the 4 picture options on screen.',
      'Tap the card that matches the sound you heard.'
    ],
    hintWithoutSpoiling: (state) => {
      return 'Press the speaker icon again to hear the sound one more time. Notice whether it sounds like water flowing, rain falling, or a rhythmic festival beat.';
    },
    explainScore: (score, correctCount, totalRounds) => {
      if (score >= 80) {
        return `Wonderful listening! You identified ${correctCount} sounds with a score of ${score}%. Your auditory attention and focus are lively today.`;
      }
      return `You scored ${score}% on Sounds of the Hills. Listening attentively to familiar sounds helps keep your senses alert and connected to the world around you.`;
    }
  }
};

export function getGameKnowledge(gameKey) {
  if (!gameKey) return null;
  const key = gameKey.toLowerCase();
  if (key.includes('bihu') || key.includes('memory')) return GAME_KNOWLEDGE.bihu;
  if (key.includes('mekhela') || key.includes('pattern')) return GAME_KNOWLEDGE.mekhela;
  if (key.includes('tea') || key.includes('routine')) return GAME_KNOWLEDGE.teagarden;
  if (key.includes('sound') || key.includes('hill') || key.includes('attention')) return GAME_KNOWLEDGE.soundshills;
  return null;
}
