/**
 * Structured Local FAQ & Help Knowledge Base
 * Answers common questions directly from the application's true architecture without hallucinating.
 */

export const FAQ_DATA = [
  {
    category: 'general',
    keywords: ['what is smriticare', 'about smriticare', 'who are you', 'who made this', 'tell me about yourself'],
    question: 'What is SmritiCare?',
    answer: 'SmritiCare is an AI-powered, voice-first cognitive care platform created for elderly dementia patients and family caregivers in North East India. It offers culturally familiar games, voice reminders, and an offline-first health record system.'
  },
  {
    category: 'patient_mode',
    keywords: ['patient mode', 'how to use patient mode', 'what can i do here', 'elderly mode'],
    question: 'How do I use Patient Mode?',
    answer: 'Patient Mode is designed to be very simple with large buttons and voice assistance. You can play cognitive memory games, check your daily medicine reminders, see your golden progress stars, or tap the red Call button to reach your caregiver.'
  },
  {
    category: 'caregiver_mode',
    keywords: ['caregiver mode', 'phc mode', 'caregiver dashboard', 'doctor mode'],
    question: 'What is Caregiver Mode?',
    answer: 'Caregiver Mode gives family members and Primary Health Center workers a clinical overview of cognitive trends, adherence to reminders, AI screening alerts, and a weekly clinical report that can be saved or printed.'
  },
  {
    category: 'games',
    keywords: ['games', 'what games are there', 'how many games', 'list games'],
    question: 'What games are available?',
    answer: 'SmritiCare has 4 culturally rooted games: 1) Bihu Memory Match (memory), 2) Mekhela Pattern Weaving (visual patterns), 3) Tea Garden Morning Routine (executive function), and 4) Sounds of the Hills (auditory attention).'
  },
  {
    category: 'scoring',
    keywords: ['how does scoring work', 'stars', 'vitality index', 'cognitive score'],
    question: 'How does cognitive scoring work?',
    answer: 'Games calculate a gentle vitality score from 0 to 100 based on accuracy and completion. Scores are meant for encouragement and tracking personal trends over time. They are never a medical diagnosis.'
  },
  {
    category: 'reminders',
    keywords: ['reminders', 'medicines', 'schedule', 'daily tasks', 'confirm reminder'],
    question: 'How do reminders work?',
    answer: 'Your caregiver sets reminders for medications, drinking water, or daily walks. In Patient Mode, you will see each task with its time. Tap the checkbox to mark it done so your caregiver knows you have taken it.'
  },
  {
    category: 'language',
    keywords: ['change language', 'assamese', 'hindi', 'bengali', 'bodo', 'meitei', 'khasi', 'mizo', 'garo', 'english'],
    question: 'How do I change the language?',
    answer: 'You can tap the Globe icon (🌐) at the top of the screen or inside the AI assistant to choose from Assamese, Bodo, Meitei, Khasi, Mizo, Garo, Bengali, Hindi, or English.'
  },
  {
    category: 'theme',
    keywords: ['dark mode', 'light mode', 'switch theme', 'screen brightness'],
    question: 'How do I turn on dark mode or light mode?',
    answer: 'Tap the Sun or Moon icon in the top navigation bar, or tell me "Turn on dark mode" or "Turn on light mode". Your theme preference is saved across the entire application.'
  },
  {
    category: 'community',
    keywords: ['global community', 'community', 'forum', 'connect', 'talk to caregivers'],
    question: 'What is the Global Community?',
    answer: 'The Global Community lets caregivers and families connect with others facing dementia. You can read warm stories, share daily tips, join topic rooms, and offer encouragement safely without exposing private health data.'
  },
  {
    category: 'offline',
    keywords: ['offline', 'no internet', 'sync', 'does it work offline', 'indexeddb', 'dexie'],
    question: 'Does SmritiCare work without internet?',
    answer: 'Yes! SmritiCare is built offline-first using browser IndexedDB. All game scores, schedule confirmations, and conversations are safely stored on your device. As soon as you reconnect, changes sync automatically to the cloud.'
  },
  {
    category: 'emergency',
    keywords: ['emergency', 'help', 'call priya', 'call caregiver', 'urgent'],
    question: 'How do I contact my caregiver in an emergency?',
    answer: 'Tap the red "Call" button with the phone icon at the bottom of the screen. It immediately opens a one-tap direct line to your primary caregiver.'
  },
  {
    category: 'medical_safety',
    keywords: ['do i have dementia', 'diagnose me', 'am i sick', 'prescribe', 'doctor', 'medicine change'],
    question: 'Can the assistant give medical advice?',
    answer: 'I am your friendly care companion, not a doctor. I cannot diagnose dementia or recommend medication changes. Please speak directly with your family caregiver or PHC medical officer for medical decisions.'
  }
];

export function searchFaq(query) {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // Match keyword in query
  for (const item of FAQ_DATA) {
    if (item.keywords.some(k => q.includes(k))) {
      return item.answer;
    }
  }
  return null;
}
