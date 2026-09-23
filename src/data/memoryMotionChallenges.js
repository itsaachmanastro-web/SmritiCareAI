/**
 * SmritiCare Memory Motion Challenge Dataset
 * 
 * 4 Complete Cognitive Video Scenarios with Grounded Memory Challenges:
 * 1. 🏠 Morning in the Kitchen (KITCHEN_MORNING)
 * 2. 🛒 Grocery Market Routine (GROCERY_MARKET)
 * 3. 🌳 Garden & Park Walk (GARDEN_PARK)
 * 4. 🛏️ Bedroom Evening Routine (BEDROOM_ROUTINE)
 * 
 * Full 5-language localization: English (en), Hindi (hi), Assamese (as), Bengali (bn), Manipuri (mni).
 */

export const MEMORY_MOTION_CHALLENGES = [
  // ===========================================================================
  // ROUND 1: 🏠 Morning in the Kitchen
  // ===========================================================================
  {
    id: 'mm-k-001',
    roundIndex: 1,
    difficulty: 1,
    levelTier: 'easy',
    scenarioKey: 'KITCHEN_MORNING',
    sceneType: 'KITCHEN_MORNING',
    question: {
      en: 'How many ORANGES were in the fruit bowl on the counter?',
      hi: 'काउंटर पर रखे फलों के कटोरे में कितने संतरे थे?',
      as: 'কাউন্টাৰৰ বাটিত কেইটা কমলা আছিল?',
      bn: 'কাউন্টারের ফলের পাত্রে কটি কমলালেবু ছিল?',
      mni: 'কাউন্তৰগী বাতিদা কোমোলা কয়াম য়াওখিগে?'
    },
    options: [
      { id: 'opt-1', icon: '🍊', text: { en: '1 Orange', hi: '1 संतरा', as: '১টা কমলা', bn: '১টি কমলালেবু', mni: 'কোমোলা ১' }, isCorrect: false },
      { id: 'opt-2', icon: '🍊🍊', text: { en: '2 Oranges', hi: '2 संतरे', as: '২টা কমলা', bn: '২টি কমলালেবু', mni: 'কোমোলা ২' }, isCorrect: true },
      { id: 'opt-3', icon: '🍊🍊🍊', text: { en: '3 Oranges', hi: '3 संतरे', as: '৩টা কমলা', bn: '৩টি কমলালেবু', mni: 'কোমোলা ৩' }, isCorrect: false },
      { id: 'opt-4', icon: '🍊🍊🍊🍊', text: { en: '4 Oranges', hi: '4 संतरे', as: '৪টা কমলা', bn: '৪টি কমলালেবু', mni: 'কোমোলা ৪' }, isCorrect: false }
    ],
    correctAnswerIndex: 1,
    explanation: {
      en: 'There were exactly 2 bright oranges resting alongside the 3 red apples in the wooden fruit bowl.',
      hi: 'लकड़ी के कटोरे में 3 सेबों के साथ ठीक 2 संतरे रखे हुए थे।',
      as: 'কাঠৰ বাটিটোত ৩টা ৰঙা আপেলৰ সৈতে সঠিকভাৱে ২টা কমলা আছিল।',
      bn: 'কাঠের বাটিতে ৩টি লাল আপেলের সাথে ঠিক ২টি কমলালেবু ছিল।',
      mni: 'উগী বাটি মনুংদা সেব ৩গা লোয়ননা কোমোলা ২ য়াওখি।'
    }
  },
  {
    id: 'mm-k-002',
    roundIndex: 1,
    difficulty: 1,
    levelTier: 'easy',
    scenarioKey: 'KITCHEN_MORNING',
    sceneType: 'KITCHEN_MORNING',
    question: {
      en: 'What COLOR was the cup that the woman picked up?',
      hi: 'महिला ने किस रंग का कप उठाया था?',
      as: 'মহিলাগৰাকীয়ে কি ৰঙৰ কাপ তুলি লৈছিল?',
      bn: 'মহিলাটি কোন রঙের কাপটি তুলেছিলেন?',
      mni: 'নুপী অদুগী করম্বা মচুগী খাপ লৌখৎখিগে?'
    },
    options: [
      { id: 'opt-1', icon: '🔴', text: { en: 'Bright Red', hi: 'चमकीला लाल', as: 'উজ্জ্বল ৰঙা', bn: 'উজ্জ্বল লাল', mni: 'ঙাল্লবা অঙাংবা' }, isCorrect: true },
      { id: 'opt-2', icon: '🔵', text: { en: 'Ocean Blue', hi: 'गहरा नीला', as: 'গাঢ় নীলা', bn: 'গাঢ় নীল', mni: 'অচৌবা নীলা' }, isCorrect: false },
      { id: 'opt-3', icon: '🟢', text: { en: 'Leaf Green', hi: 'पत्ते जैसा हरा', as: 'পাত সেউজীয়া', bn: 'সবুজ', mni: 'অশেংবা' }, isCorrect: false },
      { id: 'opt-4', icon: '🟡', text: { en: 'Sunny Yellow', hi: 'पीला', as: 'হালধীয়া', bn: 'হলুদ', mni: 'য়াইঙাংবা' }, isCorrect: false }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The woman picked up a bright red ceramic mug from the marble island counter.',
      hi: 'महिला ने मार्बल काउंटर से एक चमकदार लाल कप उठाया था।',
      as: 'তেখেতে মাৰ্বল কাউন্টাৰৰ পৰা উজ্জ্বল ৰঙা কাপটো তুলি লৈছিল।',
      bn: 'তিনি মার্বেল কাউন্টার থেকে একটি উজ্জ্বল লাল কাপ তুলেছিলেন।',
      mni: 'মহাক্না কাউন্তৰদগী ঙাল্লবা অঙাংবা খাপ অদু লৌখৎখি।'
    }
  },
  {
    id: 'mm-k-003',
    roundIndex: 1,
    difficulty: 2,
    levelTier: 'easy',
    scenarioKey: 'KITCHEN_MORNING',
    sceneType: 'KITCHEN_MORNING',
    question: {
      en: 'What did the person do right AFTER picking up the red cup?',
      hi: 'लाल कप उठाने के तुरंत बाद व्यक्ति ने क्या किया?',
      as: 'ৰঙা কাপটো তুলি লোৱাৰ ঠিক পিছতে কি কৰিলে?',
      bn: 'লাল কাপটি তোলার ঠিক পরেই ব্যক্তিটি কী করেছিলেন?',
      mni: 'অঙাংবা খাপ লৌখৎলবা মতুংদা মথংদা করি তৌখিগে?'
    },
    options: [
      { id: 'opt-1', icon: '🚰', text: { en: 'Filled the cup with water from the glass pitcher', hi: 'कांच के जग से कप में पानी भरा', as: 'কাঁচৰ জগৰ পৰা কাপত পানী ঢালিলে', bn: 'কাচের জগ থেকে কাপে জল ভরলেন', mni: 'গ্লাসকী জগদগী খাপতা ঈশিং হাপখি' }, isCorrect: true },
      { id: 'opt-2', icon: '🪑', text: { en: 'Immediately sat down on the chair', hi: 'तुरंत कुर्सी पर बैठ गए', as: 'লগে লগে চকীত বহিল', bn: 'সঙ্গে সঙ্গে চেয়ারে বসলেন', mni: 'খুদক্তা চৌকিদা ফমখি' }, isCorrect: false },
      { id: 'opt-3', icon: '🔑', text: { en: 'Picked up the car keys', hi: 'चाबियां उठाईं', as: 'চাবিৰ থোপা তুলি ল’লে', bn: 'গাড়ির চাবি তুললেন', mni: 'চাবি লৌখৎখি' }, isCorrect: false },
      { id: 'opt-4', icon: '🚪', text: { en: 'Walked out of the kitchen', hi: 'रसोई से बाहर चले गए', as: 'পাকঘৰৰ পৰা ওলাই গ’ল', bn: 'রান্নাঘর থেকে বেরিয়ে গেলেন', mni: 'চাকখুমদগী থোকখি' }, isCorrect: false }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'Right after picking up the red cup, the person poured fresh water into it from the glass pitcher.',
      hi: 'लाल कप उठाने के बाद उन्होंने कांच के जग से उसमें पानी भरा।',
      as: 'ৰঙা কাপটো তুলি লোৱাৰ পিছত তেখেতে কাঁচৰ জগৰ পৰা পানী ঢালিছিল।',
      bn: 'লাল কাপ তোলার পর তিনি কাচের জগ থেকে তাতে জল ভরেছিলেন।',
      mni: 'খাপ লৌখৎলবা মতুংদা জগদগী ঈশিং হাপখি।'
    }
  },

  // ===========================================================================
  // ROUND 2: 🛒 Grocery Market Routine
  // ===========================================================================
  {
    id: 'mm-m-001',
    roundIndex: 2,
    difficulty: 2,
    levelTier: 'easy',
    scenarioKey: 'GROCERY_MARKET',
    sceneType: 'GROCERY_MARKET',
    question: {
      en: 'How many yellow BANANAS were placed in the shopping basket?',
      hi: 'शॉपिंग बास्केट में कितने पीले केले रखे गए थे?',
      as: 'বজাৰৰ খৰাহীত কেইটা হালধীয়া কল থোৱা হৈছিল?',
      bn: 'বাজারের ঝুড়িতে কটি হলুদ কলা রাখা হয়েছিল?',
      mni: 'পৈলাদা য়াইঙাংবা চাফাবা চোম্প্রা কয়াম হাপখিগে?'
    },
    options: [
      { id: 'opt-1', icon: '🍌', text: { en: '1 Banana', hi: '1 केला', as: '১টা কল', bn: '১টি কলা', mni: 'চোম্প্রা ১' }, isCorrect: false },
      { id: 'opt-2', icon: '🍌🍌', text: { en: '2 Bananas', hi: '2 केले', as: '২টা কল', bn: '২টি কলা', mni: 'চোম্প্রা ২' }, isCorrect: true },
      { id: 'opt-3', icon: '🍌🍌🍌', text: { en: '3 Bananas', hi: '3 केले', as: '৩টা কল', bn: '৩টি কলা', mni: 'চোম্প্রা ৩' }, isCorrect: false },
      { id: 'opt-4', icon: '🍌🍌🍌🍌', text: { en: '4 Bananas', hi: '4 केले', as: '৪টা কল', bn: '৪টি কলা', mni: 'চোম্প্রা ৪' }, isCorrect: false }
    ],
    correctAnswerIndex: 1,
    explanation: {
      en: 'The elder selected exactly 2 ripe yellow bananas and gently placed them into the green woven basket.',
      hi: 'बुजुर्ग ने ठीक 2 पके पीले केले चुनकर हरी टोकरी में रखे थे।',
      as: 'আইতাই সঠিকভাৱে ২টা পকা হালধীয়া কল বাচি সেউজীয়া খৰাহীত থৈছিল।',
      bn: 'ব্যক্তিটি ঠিক ২টি পাকা হলুদ কলা বেছে সবুজ ঝুড়িতে রেখেছিলেন।',
      mni: 'মীওই অদুগী য়াইঙাংবা চাফাবা চোম্প্রা ২ খন্দুনা পৈলাদা হাপখি।'
    }
  },
  {
    id: 'mm-m-002',
    roundIndex: 2,
    difficulty: 2,
    levelTier: 'easy',
    scenarioKey: 'GROCERY_MARKET',
    sceneType: 'GROCERY_MARKET',
    question: {
      en: 'What item did the person pick up FIRST upon entering the market?',
      hi: 'बाजार में प्रवेश करने के बाद व्यक्ति ने सबसे पहले क्या लिया?',
      as: 'দোকানলৈ সোমাই প্ৰথমে কি বস্তু তুলি ল’লে?',
      bn: 'দোকানে ঢোকার পর ব্যক্তিটি সবার প্রথমে কী তুলে নিলেন?',
      mni: 'কৈথেলদা চঙলক্লগা অহানবদা করি পোৎ লৌখিগে?'
    },
    options: [
      { id: 'opt-1', icon: '🧺', text: { en: 'Green Woven Shopping Basket', hi: 'हरी बुनी हुई टोकरी', as: 'সেউজীয়া বজাৰৰ খৰাহী', bn: 'সবুজ বোনা ঝুড়ি', mni: 'অশেংবা পৈলা' }, isCorrect: true },
      { id: 'opt-2', icon: '🥛', text: { en: 'A pouch of yogurt', hi: 'दही की थैली', as: 'দৈৰ পেকেট', bn: 'দইয়ের প্যাকেট', mni: 'দহিগী পেকেত' }, isCorrect: false },
      { id: 'opt-3', icon: '👛', text: { en: 'A coin purse from his pocket', hi: 'सिक्कों का बटुआ', as: 'পইচাৰ বেগ', bn: 'পয়সার থলি', mni: 'শেলগী বেগ' }, isCorrect: false },
      { id: 'opt-4', icon: '🥕', text: { en: 'A bunch of fresh carrots', hi: 'गाजर का गुच्छा', as: 'গাজৰৰ মুঠা', bn: 'গাজরের আঁটি', mni: 'গাজৰগী মুথা' }, isCorrect: false }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'Upon entering the grocery market, the elder first took a green woven shopping basket from the wooden rack.',
      hi: 'बाजार में प्रवेश करते ही उन्होंने लकड़ी के स्टैंड से एक हरी टोकरी ली थी।',
      as: 'দোকানত সোমাই প্ৰথমে কাঠৰ ৰেকৰ পৰা সেউজীয়া খৰাহীটো লৈছিল।',
      bn: 'দোকানে ঢুকেই তিনি কাঠের তাক থেকে সবুজ ঝুড়িটি তুলে নিয়েছিলেন।',
      mni: 'কৈথেলদা চঙলক্লগা অহানবদা উগী স্তেন্দতগী অশেংবা পৈলা অদু লৌখি।'
    }
  },
  {
    id: 'mm-m-003',
    roundIndex: 2,
    difficulty: 3,
    levelTier: 'easy',
    scenarioKey: 'GROCERY_MARKET',
    sceneType: 'GROCERY_MARKET',
    question: {
      en: 'Which beverage packet was selected from the refrigerated shelf?',
      hi: 'फ्रिज वाली शेल्फ से कौन सा पैकेट चुना गया?',
      as: 'ফ্ৰিজৰ পৰা কিহৰ পেকেট বাছি ল’লে?',
      bn: 'ফ্রিজের তাক থেকে কোন প্যাকেটটি নেওয়া হয়েছিল?',
      mni: 'ফ্রিজদগী করিগী পেকেত খল্লগা লৌখিগে?'
    },
    options: [
      { id: 'opt-1', icon: '🥛', text: { en: 'Fresh Blue & White Milk Packet', hi: 'दूध का नीला-सफेद पैकेट', as: 'নীলা-বগা গাখীৰৰ পেকেট', bn: 'নীল-সাদা দুধের প্যাকেট', mni: 'নীলা-অঙৌবা শঙ্গোম পেকেত' }, isCorrect: true },
      { id: 'opt-2', icon: '🧃', text: { en: 'Orange Fruit Juice Box', hi: 'संतरे के जूस का डिब्बा', as: 'কমলা ৰসৰ কাৰ্টুন', bn: 'কমলার জুসের বাক্স', mni: 'কোমোলা জুস বাস্কা' }, isCorrect: false },
      { id: 'opt-3', icon: '🥫', text: { en: 'Canned Tomato Soup', hi: 'टमाटर का सूप', as: 'টমেটো চুৰুহাৰ টিন', bn: 'টমেটো স্যুপের কৌটো', mni: 'খামেন আসুপ কৌতো' }, isCorrect: false },
      { id: 'opt-4', icon: '🧈', text: { en: 'A block of yellow butter', hi: 'मक्खन की टिक्की', as: 'মাখনৰ চপটা', bn: 'মাখনের বার', mni: 'মখন' }, isCorrect: false }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The elder reached into the dairy cooler and took a fresh blue and white pouch of milk.',
      hi: 'उन्होंने डेयरी फ्रिज से दूध का एक ताजा पैकेट निकाला था।',
      as: 'তেখেতে ফ্ৰিজৰ পৰা সতেজ নীলা-বগা গাখীৰৰ পেকেটটো তুলি লৈছিল।',
      bn: 'তিনি ডেয়ারি ফ্রিজ থেকে নীল-সাদা তাজা দুধের প্যাকেটটি নিয়েছিলেন।',
      mni: 'ফ্রিজ মনুংদগী শঙ্গোমগী পেকেত অদু লৌথোকখি।'
    }
  },

  // ===========================================================================
  // ROUND 3: 🌳 Garden & Park Walk
  // ===========================================================================
  {
    id: 'mm-g-001',
    roundIndex: 3,
    difficulty: 2,
    levelTier: 'easy',
    scenarioKey: 'GARDEN_PARK',
    sceneType: 'GARDEN_PARK',
    question: {
      en: 'What COLOR was the blooming flower blossom in the garden?',
      hi: 'बगीचे में खिले हुए फूल का रंग क्या था?',
      as: 'বাগানত ফুলা ফুলপাহৰ ৰং কি আছিল?',
      bn: 'বাগানে ফোটা ফুলটির রঙ কী ছিল?',
      mni: 'লৈকোলদা শাত্লিবা লৈ অদুগী মচু করম্বা মচুনো?'
    },
    options: [
      { id: 'opt-1', icon: '🌺', text: { en: 'Bright Red', hi: 'चमकीला लाल', as: 'উজ্জ্বল ৰঙা', bn: 'উজ্জ্বল লাল', mni: 'ঙাল্লবা অঙাংবা' }, isCorrect: true },
      { id: 'opt-2', icon: '💜', text: { en: 'Deep Purple', hi: 'गहरा बैंगनी', as: 'গাঢ় বেঙুনীয়া', bn: 'গাঢ় বেগুনি', mni: 'অচৌবা বেঙ্গনী' }, isCorrect: false },
      { id: 'opt-3', icon: '🤍', text: { en: 'Pure White', hi: 'सफेद', as: 'বগা', bn: 'সাদা', mni: 'অঙৌবা' }, isCorrect: false },
      { id: 'opt-4', icon: '🌼', text: { en: 'Golden Yellow', hi: 'सुनहरा पीला', as: 'সোণালী হালধীয়া', bn: 'সোনালী হলুদ', mni: 'সোনার মচু' }, isCorrect: false }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'A vibrant, bright red blooming rose blossom stood out beside the wooden garden bench in the morning sunlight.',
      hi: 'बेंच के पास एक चमकीला लाल गुलाब का फूल खिला हुआ था।',
      as: 'চকীৰ কাষতে পুৱাৰ পোহৰত উজ্জ্বল ৰঙা গোলাপ ফুলপাহ ফুলি আছিল।',
      bn: 'বেঞ্চের পাশে সকালের আলোয় একটি উজ্জ্বল লাল গোলাপ ফুটেছিল।',
      mni: 'চৌকিগী নাকলদা ঙাল্লবা অঙাংবা গুলাপ লৈ শাতুনা লৈখি।'
    }
  },
  {
    id: 'mm-g-002',
    roundIndex: 3,
    difficulty: 2,
    levelTier: 'easy',
    scenarioKey: 'GARDEN_PARK',
    sceneType: 'GARDEN_PARK',
    question: {
      en: 'Where did the person sit down to rest during the garden walk?',
      hi: 'बगीचे में टहलने के दौरान व्यक्ति कहाँ आराम करने बैठे?',
      as: 'বাগানত ফুৰি থাকোঁতে মানুহগৰাকী ক’ত বহিল?',
      bn: 'বাগানে ঘোরার সময় ব্যক্তিটি কোথায় বসলেন?',
      mni: 'লৈকোলদা চৎপদা মীওই অদু কদাইদা ফমখিগে?'
    },
    options: [
      { id: 'opt-1', icon: '🪑', text: { en: 'On the Wooden Park Bench', hi: 'लकड़ी की पार्क बेंच पर', as: 'কাঠৰ পাৰ্কৰ চকীত', bn: 'কাঠের পার্কের বেঞ্চে', mni: 'উগী চৌকিদা' }, isCorrect: true },
      { id: 'opt-2', icon: '🌿', text: { en: 'Directly on the wet grass', hi: 'सीधे गीली घास पर', as: 'ঘাঁহনিৰ ওপৰত', bn: 'ঘাসের ওপর', mni: 'ঘাসকী মথক্তা' }, isCorrect: false },
      { id: 'opt-3', icon: '🧱', text: { en: 'On the stone wall border', hi: 'पत्थर की दीवार पर', as: 'শিলৰ দেৱালত', bn: 'পাথরের পাঁচিলে', mni: 'নূংগী দেৱালদা' }, isCorrect: false },
      { id: 'opt-4', icon: '⛺', text: { en: 'Inside a garden gazebo', hi: 'छतरी के नीचे', as: 'মণ্ডপৰ ভিতৰত', bn: 'মঞ্চের নিচে', mni: 'মণ্ডপ মনুংদা' }, isCorrect: false }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The person sat peacefully on a shaded wooden park bench along the stone garden walkway.',
      hi: 'व्यक्ति रास्ते के पास एक छायादार लकड़ी की बेंच पर बैठे थे।',
      as: 'তেখেতে বাটৰ কাষৰ কাঠৰ পাৰ্কৰ চকীত শান্তভাৱে বহিছিল।',
      bn: 'তিনি রাস্তার পাশে ছায়াময় কাঠের বেঞ্চে শান্তভাবে বসেছিলেন।',
      mni: 'মহাক্না উগী চৌকিদা নুংঙাইনা ফমখি।'
    }
  },
  {
    id: 'mm-g-003',
    roundIndex: 3,
    difficulty: 3,
    levelTier: 'easy',
    scenarioKey: 'GARDEN_PARK',
    sceneType: 'GARDEN_PARK',
    question: {
      en: 'What COLOR was the water bottle picked up from the bench?',
      hi: 'बेंच से उठाई गई पानी की बोतल का रंग क्या था?',
      as: 'চকীৰ পৰা তোলা পানীৰ বটলটোৰ ৰং কি আছিল?',
      bn: 'বেঞ্চ থেকে তোলা জলের বোতলের রঙ কী ছিল?',
      mni: 'চৌকিদগী লৌখৎখিবা ঈশিং বোতল অদুগী মচু করি মচুনো?'
    },
    options: [
      { id: 'opt-1', icon: '🩵', text: { en: 'Sky Blue', hi: 'आसमानी नीला', as: 'আকাশী নীলা', bn: 'আকাশি নীল', mni: 'অসামানী নীলা' }, isCorrect: true },
      { id: 'opt-2', icon: '🖤', text: { en: 'Charcoal Black', hi: 'काला', as: 'কলা', bn: 'কালো', mni: 'অমুবা' }, isCorrect: false },
      { id: 'opt-3', icon: '🟠', text: { en: 'Bright Orange', hi: 'नारंगी', as: 'কমলা ৰং', bn: 'কমলা', mni: 'কোমোলা মচু' }, isCorrect: false },
      { id: 'opt-4', icon: '🟣', text: { en: 'Violet', hi: 'बैंगनी', as: 'বেঙুনীয়া', bn: 'বেগুনি', mni: 'বেঙ্গনী' }, isCorrect: false }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The person picked up a reusable sky-blue water bottle from the bench corner.',
      hi: 'उन्होंने बेंच के कोने से एक आसमानी नीले रंग की पानी की बोतल उठाई थी।',
      as: 'তেখেতে চকীৰ কাষৰ পৰা আকাশী নীলা পানীৰ বটলটো তুলি লৈছিল।',
      bn: 'তিনি বেঞ্চের কোনা থেকে একটি আকাশি নীল জলের বোতল তুলেছিলেন।',
      mni: 'মহাক্না চৌকিদগী অসামানী নীলা ঈশিং বোতল অদু লৌখৎখি।'
    }
  },

  // ===========================================================================
  // ROUND 4: 🛏️ Bedroom Evening Routine
  // ===========================================================================
  {
    id: 'mm-b-001',
    roundIndex: 4,
    difficulty: 2,
    levelTier: 'easy',
    scenarioKey: 'BEDROOM_ROUTINE',
    sceneType: 'BEDROOM_ROUTINE',
    question: {
      en: 'Where were the house keys placed upon entering the bedroom?',
      hi: 'कमरे में आने के बाद चाबियां कहाँ रखी गईं?',
      as: 'কোঠালৈ সোমাই চাবিবোৰ ক’ত থোৱা হ’ল?',
      bn: 'ঘরে ঢোকার পর চাবিগুলো কোথায় রাখা হলো?',
      mni: 'কা মনুংদা চঙলক্লগা চাবি অদু কদাইদা থমখিগে?'
    },
    options: [
      { id: 'opt-1', icon: '🛏️', text: { en: 'On the Bedside Table', hi: 'बेड के पास वाली मेज पर', as: 'বিছনাৰ কাষৰ মেজত', bn: 'বিছানার পাশের টেবিলে', mni: 'ফমখুম নাকলগী তেবলদা' }, isCorrect: true },
      { id: 'opt-2', icon: '🚪', text: { en: 'Hung behind the door', hi: 'दरवाजे के पीछे खूंटी पर', as: 'দুৱাৰৰ পিছফালে', bn: 'দরজার পেছনে হুকে', mni: 'থোংগী মখালাদা' }, isCorrect: false },
      { id: 'opt-3', icon: '🪑', text: { en: 'Under the dressing chair', hi: 'ड्रेसिंग चेयर के नीचे', as: 'চকীৰ তলত', bn: 'চেয়ারের নিচে', mni: 'চৌকি মখাদা' }, isCorrect: false },
      { id: 'opt-4', icon: '🛋️', text: { en: 'Inside a suitcase', hi: 'सूटकेस के अंदर', as: 'ছুটকেচৰ ভিতৰত', bn: 'স্যুটকেসের ভেতরে', mni: 'সুতকেস মনুংদা' }, isCorrect: false }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The person neatly placed the house keys onto the wooden bedside table upon entering the bedroom.',
      hi: 'कमरे में आकर उन्होंने चाबियों को बिस्तर के पास वाली लकड़ी की मेज पर रखा था।',
      as: 'কোঠাত সোমাই তেখেতে চাবিৰ থোপাটো বিছনাৰ কাষৰ মেজত সজাই থৈছিল।',
      bn: 'ঘরে এসে তিনি চাবিগুলো বিছানার পাশের কাঠের টেবিলে রেখেছিলেন।',
      mni: 'কা মনুংদা চঙলক্লগা চাবি অদু তেবলদা থমখি।'
    }
  },
  {
    id: 'mm-b-002',
    roundIndex: 4,
    difficulty: 3,
    levelTier: 'easy',
    scenarioKey: 'BEDROOM_ROUTINE',
    sceneType: 'BEDROOM_ROUTINE',
    question: {
      en: 'What item was taken out from the wooden drawer?',
      hi: 'लकड़ी की दराज से क्या वस्तु निकाली गई?',
      as: 'কাঠৰ ড্ৰয়াৰৰ পৰা কি বস্তু উলিওৱা হ’ল?',
      bn: 'কাঠের ড্রয়ার থেকে কোন জিনিসটি বের করা হলো?',
      mni: 'উগী দ্রৱাৰদগী করি পোৎলম লৌথোকখিগে?'
    },
    options: [
      { id: 'opt-1', icon: '📖', text: { en: 'Hardcover Reading Book', hi: 'मोटी जिल्द वाली किताब', as: 'পঢ়া কিতাপ', bn: 'পড়ার বই', mni: 'পাবগী লাইরিক' }, isCorrect: true },
      { id: 'opt-2', icon: '🔦', text: { en: 'A metallic flashlight', hi: 'टॉर्च', as: 'টৰ্চলাইট', bn: 'টর্চলাইট', mni: 'তর্চ' }, isCorrect: false },
      { id: 'opt-3', icon: '🧣', text: { en: 'A knitted woolen scarf', hi: 'ऊनी मफलर', as: 'মফলাৰ', bn: 'উলের মাফলার', mni: 'মাফলার' }, isCorrect: false },
      { id: 'opt-4', icon: '📱', text: { en: 'A mobile phone charger', hi: 'फोन चार्जर', as: 'চাৰ্জাৰ', bn: 'মোবাইল চার্জার', mni: 'চার্জর' }, isCorrect: false }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The person opened the wooden nightstand drawer and took out a blue hardcover reading book.',
      hi: 'दराज खोलकर उन्होंने पढ़ने के लिए एक नीली किताब निकाली थी।',
      as: 'ড্ৰয়াৰটো খুলি তেখেতে এখন নীলা পঢ়া কিতাপ উলিয়াইছিল।',
      bn: 'ড্রয়ার খুলে তিনি পড়ার জন্য একটি নীল বই বের করেছিলেন।',
      mni: 'দ্রৱাৰ হাংদোক্তুনা পাবগী লাইরিক অদু লৌথোকখি।'
    }
  },
  {
    id: 'mm-b-003',
    roundIndex: 4,
    difficulty: 3,
    levelTier: 'easy',
    scenarioKey: 'BEDROOM_ROUTINE',
    sceneType: 'BEDROOM_ROUTINE',
    question: {
      en: 'What was the LAST action performed before ending the bedroom routine?',
      hi: 'शाम की दिनचर्या के अंत में सबसे आखिरी काम क्या किया गया?',
      as: 'শোৱাৰ আগত আটাইতকৈ শেষত কি কাম কৰা হ’ল?',
      bn: 'শোওয়ার আগে সবার শেষে কোন কাজটি করা হয়েছিল?',
      mni: 'অরোইবদা করি থবক তৌখিগে?'
    },
    options: [
      { id: 'opt-1', icon: '💡', text: { en: 'Turned off the bedside lamp', hi: 'बेडसाइड लैंप बंद किया', as: 'বিছনাৰ কাষৰ চাকি নুমুৱালে', bn: 'বেডসাইড ল্যাম্প বন্ধ করলেন', mni: 'লম্প মুত্থৎখি' }, isCorrect: true },
      { id: 'opt-2', icon: '🪟', text: { en: 'Closed the large balcony door', hi: 'बालकनी का दरवाजा बंद किया', as: 'বাৰাণ্ডাৰ দুৱাৰ বন্ধ কৰিলে', bn: 'ব্যালকনির দরজা বন্ধ করলেন', mni: 'থোং থিংখি' }, isCorrect: false },
      { id: 'opt-3', icon: '⏰', text: { en: 'Set the mechanical alarm clock', hi: 'अलार्म सेट किया', as: 'এলাৰ্ম লগালে', bn: 'অ্যালার্ম সেট করলেন', mni: 'এলম হাপখি' }, isCorrect: false },
      { id: 'opt-4', icon: '🚪', text: { en: 'Locked the main bedroom door', hi: 'मुख्य दरवाजा बंद किया', as: 'মূল দুৱাৰ বন্ধ কৰিলে', bn: 'ঘরের প্রধান দরজা লক করলেন', mni: 'মপূংওইবা থোং থিংখি' }, isCorrect: false }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'At the end of the evening scene, the person reached over and gently turned off the glowing bedside lamp.',
      hi: 'दृश्य के अंत में उन्होंने सोने से पहले जलते हुए लैंप को बंद कर दिया था।',
      as: 'দৃশ্যৰ শেষত তেখেতে হাত মেলি বিছনাৰ কাষৰ চাকিটো নুমুৱাই দিছিল।',
      bn: 'দৃশ্যের শেষে তিনি শোওয়ার আগে জ্বলন্ত ল্যাম্পটি বন্ধ করে দিয়েছিলেন।',
      mni: 'অরোইবদা মহাক্না লম্প অদু মুত্থৎখি।'
    }
  }
];
