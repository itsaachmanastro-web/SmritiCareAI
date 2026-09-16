/**
 * North Eastern Region Multilingual Language Registry & Capability Matrix
 * Implements capability-aware support for regional and national languages.
 */

export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    region: 'National / NER Urban',
    sttLocale: 'en-IN',
    ttsLocale: 'en-IN',
    speechRecognitionAvailable: true,
    ttsAvailable: true,
    translationAvailable: true,
    greeting: 'Hello! I am Smriti, your care companion. How can I help you today?',
    listenPrompt: 'Listening... speak clearly.',
    limitedNotice: null
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    region: 'National',
    sttLocale: 'hi-IN',
    ttsLocale: 'hi-IN',
    speechRecognitionAvailable: true,
    ttsAvailable: true,
    translationAvailable: true,
    greeting: 'नमस्ते! मैं स्मृति हूँ, आपकी देखभाल साथी। आज मैं आपकी क्या मदद कर सकती हूँ?',
    listenPrompt: 'सुन रही हूँ... कृपया बोलिए।',
    limitedNotice: null
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    region: 'Assam / Brahmaputra Valley',
    sttLocale: 'as-IN',
    ttsLocale: 'as-IN',
    speechRecognitionAvailable: false, // Browser Web Speech typically lacks native as-IN STT
    ttsAvailable: false,
    translationAvailable: true,
    greeting: 'নমস্কাৰ! মই স্মৃতি, আপোনাৰ যত্নৰ সংগী। আজি মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?',
    listenPrompt: 'শুনি আছোঁ... কওক।',
    limitedNotice: 'Voice recognition for Assamese is limited in standard browsers. You can type in অসমীয়া or switch to English/Hindi for voice conversation.'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    region: 'Assam (Barak Valley), Tripura, Meghalaya',
    sttLocale: 'bn-IN',
    ttsLocale: 'bn-IN',
    speechRecognitionAvailable: true,
    ttsAvailable: true,
    translationAvailable: true,
    greeting: 'নমস্কার! আমি স্মৃতি, আপনার যত্ন সঙ্গী। আজ আপনাকে কিভাবে সাহায্য করতে পারি?',
    listenPrompt: 'শুনছি... বলুন।',
    limitedNotice: null
  },
  {
    code: 'brx',
    name: 'Bodo',
    nativeName: 'बड़ो',
    region: 'Bodoland Territorial Region, Assam',
    sttLocale: 'brx-IN',
    ttsLocale: 'brx-IN',
    speechRecognitionAvailable: false,
    ttsAvailable: false,
    translationAvailable: true,
    greeting: 'खुलुमबाय! आं स्मृति, नोंथांनि अनसायगिरि लोगो। दिनै आं नोंथांनो मा रोखोमै हेफाजाब होनो हागौ?',
    listenPrompt: 'खोंनासंनो नागिरदों...',
    limitedNotice: 'Voice recognition for Bodo is in preview. You can type in Bodo or choose English/Hindi for voice conversation.'
  },
  {
    code: 'mni',
    name: 'Meitei / Manipuri',
    nativeName: 'মৈতৈলোন্',
    region: 'Manipur / NER',
    sttLocale: 'mni-IN',
    ttsLocale: 'mni-IN',
    speechRecognitionAvailable: false,
    ttsAvailable: false,
    translationAvailable: true,
    greeting: 'খুরুমজরি! ঐ স্মৃতি, নখোয়গী মতেং পাংবা মরূপনি। ঙসি ঐনা করম্না মতেং পাংগদগে?',
    listenPrompt: 'তাবা ফংই...',
    limitedNotice: 'Voice recognition for Manipuri is in preview. You can type in Meitei or choose English/Hindi for voice interaction.'
  },
  {
    code: 'kha',
    name: 'Khasi',
    nativeName: 'Khasi',
    region: 'Meghalaya (Khasi Hills)',
    sttLocale: 'kha-IN',
    ttsLocale: 'kha-IN',
    speechRecognitionAvailable: false,
    ttsAvailable: false,
    translationAvailable: true,
    greeting: 'Khublei! Nga dei ka Smriti, ka paralok ban kynmaw bad iarap ia phi. Kumno nga lah ban iarap mynta ka sngi?',
    listenPrompt: 'Sngap...',
    limitedNotice: 'Voice support for Khasi is currently in preview. You can type in Khasi or switch to English for voice conversation.'
  },
  {
    code: 'lus',
    name: 'Mizo',
    nativeName: 'Mizo',
    region: 'Mizoram',
    sttLocale: 'lus-IN',
    ttsLocale: 'lus-IN',
    speechRecognitionAvailable: false,
    ttsAvailable: false,
    translationAvailable: true,
    greeting: 'Chibai! Smriti ka ni a, i tanpuitu ka ni. Vawiinah engtin nge ka tanpui theih ang che?',
    listenPrompt: 'Ngaithla e...',
    limitedNotice: 'Voice support for Mizo is currently in preview. You can type in Mizo or choose English for voice interaction.'
  },
  {
    code: 'grt',
    name: 'Garo',
    nativeName: 'Garo (A·chik)',
    region: 'Meghalaya (Garo Hills)',
    sttLocale: 'grt-IN',
    ttsLocale: 'grt-IN',
    speechRecognitionAvailable: false,
    ttsAvailable: false,
    translationAvailable: true,
    greeting: 'Mitela! Anga Smriti, na·simangni dakchakangipa ripeng. Da·alo anga maidake dakchakna man·gen?',
    listenPrompt: 'Knachakenga...',
    limitedNotice: 'Voice support for Garo is currently in preview. You can type in Garo or choose English for voice interaction.'
  }
];

export function getLanguage(code) {
  if (!code) return SUPPORTED_LANGUAGES[0];
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
}

export function isSpeechRecognitionSupported(langCode) {
  const lang = getLanguage(langCode);
  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SpeechRecognition) return false;
  return !!lang.speechRecognitionAvailable;
}

export function isTtsSupported(langCode) {
  const lang = getLanguage(langCode);
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return !!lang.ttsAvailable;
}
