/**
 * CognitiveVideoService — Modular Cognitive Video Asset Pipeline
 * 
 * Manages authentic continuous MP4/WebM video asset resolution, 
 * scenario timelines, thumbnails, and grounded question metadata for 4 complete rounds.
 */

export const COGNITIVE_SCENARIOS = {
  // ROUND 1: Morning in the Kitchen
  KITCHEN_MORNING: {
    id: 'kitchen-morning-v1',
    scenarioKey: 'KITCHEN_MORNING',
    roundIndex: 1,
    title: {
      en: 'Morning in the Kitchen',
      hi: 'रसोई में सुबह',
      as: 'পাকঘৰৰ ৰাতিপুৱা',
      bn: 'সকালের রান্নাঘর',
      mni: 'চাকখুমগী অয়ূক'
    },
    videoMp4: '/assets/videos/memory-motion/kitchen_morning_scenario.mp4',
    videoWebm: '/assets/videos/memory-motion/kitchen_morning_scenario.webm',
    poster: '/assets/images/cognitive/kitchen_shot_1.jpg',
    durationSeconds: 12.0,
    shots: [
      { id: 1, startSec: 0.0, endSec: 2.0, label: { en: 'Enters kitchen', hi: 'रसोई में प्रवेश किया', as: 'পাকঘৰলৈ সোমাই আহিল', bn: 'রান্নাঘরে প্রবেশ করলেন', mni: 'চাকখুমদা চঙলকখি' }, thumbnail: '/assets/images/cognitive/shot_1_enters_kitchen.jpg' },
      { id: 2, startSec: 2.0, endSec: 4.2, label: { en: 'Notices fruits & items', hi: 'फल और वस्तुएं देखीं', as: 'ফল আৰু বস্তুবোৰ লক্ষ্য কৰিলে', bn: 'ফল ও জিনিসপত্র দেখলেন', mni: 'হৈশিং অমসুং পোৎলমশিং য়েংখি' }, thumbnail: '/assets/images/cognitive/shot_2_notices_fruits.jpg' },
      { id: 3, startSec: 4.2, endSec: 6.2, label: { en: 'Picks up red cup', hi: 'लाल कप उठाया', as: 'ৰঙা কাপটো তুলি ল’লে', bn: 'লাল কাপটি তুললেন', mni: 'অঙাংবা খাপ লৌখৎখি' }, thumbnail: '/assets/images/cognitive/shot_3_picks_cup.jpg' },
      { id: 4, startSec: 6.2, endSec: 8.2, label: { en: 'Fills cup with water', hi: 'कप में पानी भरा', as: 'কাপত পানী ভৰালে', bn: 'কাপে জল ভরলেন', mni: 'খাপতা ঈশিং হাপখি' }, thumbnail: '/assets/images/cognitive/shot_4_fills_water.jpg' },
      { id: 5, startSec: 8.2, endSec: 10.0, label: { en: 'Places cup on table', hi: 'कप मेज पर रखा', as: 'কাপটো মেজত থলে', bn: 'কাপটি টেবিলে রাখলেন', mni: 'খাপ অদু মেজদা থমখি' }, thumbnail: '/assets/images/cognitive/shot_5_places_cup.jpg' },
      { id: 6, startSec: 10.0, endSec: 12.0, label: { en: 'Sits on chair', hi: 'कुर्सी पर बैठ गईं', as: 'চকীত বহিল', bn: 'চেয়ারে বসলেন', mni: 'চৌকিদা ফমখি' }, thumbnail: '/assets/images/cognitive/shot_6_sits_chair.jpg' }
    ],
    metadata: {
      objects: ['3 Red Apples', '2 Oranges', '1 Red Cup', '1 Water Pitcher', 'The Daily Times Newspaper', 'Keys', 'Chair'],
      actions: ['Enters kitchen', 'Observes fruits & items', 'Picks up red cup', 'Fills cup with water', 'Places cup beside newspaper & keys', 'Sits on chair holding cup']
    }
  },

  // ROUND 2: Grocery Market Routine
  GROCERY_MARKET: {
    id: 'grocery-market-v2',
    scenarioKey: 'GROCERY_MARKET',
    roundIndex: 2,
    title: {
      en: 'Grocery Market Routine',
      hi: 'बाजार की खरीदारी',
      as: 'বজাৰৰ শাক-পাচলি',
      bn: 'বাজারের কেনাকাটা',
      mni: 'কৈথেলগী পোৎ-লৈবা'
    },
    videoMp4: '/assets/videos/memory-motion/grocery_market_scenario.mp4',
    videoWebm: '/assets/videos/memory-motion/grocery_market_scenario.webm',
    poster: '/assets/images/cognitive/market_shot_1.jpg',
    durationSeconds: 12.0,
    shots: [
      { id: 1, startSec: 0.0, endSec: 2.4, label: { en: 'Enters market', hi: 'बाजार में आए', as: 'দোকানত সোমাল', bn: 'দোকানে ঢুকলেন', mni: 'কৈথেলদা চঙলকখি' }, thumbnail: '/assets/images/cognitive/market_thumb_1.jpg' },
      { id: 2, startSec: 2.4, endSec: 4.8, label: { en: 'Picks green basket', hi: 'हरी टोकरी ली', as: 'সেউজীয়া খৰাহী ল’লে', bn: 'সবুজ ঝুড়ি নিলেন', mni: 'অশেংবা পৈলা লৌখি' }, thumbnail: '/assets/images/cognitive/market_thumb_2.jpg' },
      { id: 3, startSec: 4.8, endSec: 7.2, label: { en: 'Selects 2 bananas', hi: '2 केले चुने', as: '২টা কল ল’লে', bn: '২টি কলা নিলেন', mni: 'কোমোলা ২ খলখি' }, thumbnail: '/assets/images/cognitive/market_thumb_3.jpg' },
      { id: 4, startSec: 7.2, endSec: 9.6, label: { en: 'Picks milk packet', hi: 'दूध का पैकेट लिया', as: 'গাখীৰৰ পেকেট ল’লে', bn: 'দুধের প্যাকেট নিলেন', mni: 'শঙ্গোমগী পেকেত লৌখি' }, thumbnail: '/assets/images/cognitive/market_thumb_4.jpg' },
      { id: 5, startSec: 9.6, endSec: 12.0, label: { en: 'Checkout counter', hi: 'बिलिंग काउंटर पर रखा', as: 'কাউন্টাৰত থ’লে', bn: 'কাউন্টারে রাখলেন', mni: 'কাউন্তৰদা থমখি' }, thumbnail: '/assets/images/cognitive/market_thumb_5.jpg' }
    ],
    metadata: {
      objects: ['Green Shopping Basket', '2 Ripe Bananas', 'Fresh Milk Packet', 'Wooden Checkout Counter'],
      actions: ['Enters grocery market', 'Picks up green shopping basket', 'Selects 2 yellow bananas into basket', 'Takes fresh milk packet from dairy shelf', 'Places items on wooden checkout counter to pay']
    }
  },

  // ROUND 3: Garden & Park Walk
  GARDEN_PARK: {
    id: 'garden-park-v3',
    scenarioKey: 'GARDEN_PARK',
    roundIndex: 3,
    title: {
      en: 'Garden & Park Walk',
      hi: 'बगीचे की सैर',
      as: 'বাগানৰ শান্ত খোজ',
      bn: 'বাগানের শান্ত ভ্রমণ',
      mni: 'লৈকোলগী চৎবা'
    },
    videoMp4: '/assets/videos/memory-motion/garden_park_scenario.mp4',
    videoWebm: '/assets/videos/memory-motion/garden_park_scenario.webm',
    poster: '/assets/images/cognitive/garden_shot_1.jpg',
    durationSeconds: 12.0,
    shots: [
      { id: 1, startSec: 0.0, endSec: 2.4, label: { en: 'Walks in garden', hi: 'बगीचे में टहले', as: 'বাগানত খোজ কাঢ়িলে', bn: 'বাগানে হাঁটলেন', mni: 'লৈকোলদা চৎখি' }, thumbnail: '/assets/images/cognitive/garden_thumb_1.jpg' },
      { id: 2, startSec: 2.4, endSec: 4.8, label: { en: 'Sits on bench', hi: 'बेंच पर बैठे', as: 'চকীত বহিল', bn: 'বেঞ্চে বসলেন', mni: 'চৌকিদা ফমখি' }, thumbnail: '/assets/images/cognitive/garden_thumb_2.jpg' },
      { id: 3, startSec: 4.8, endSec: 7.2, label: { en: 'Notices red flower', hi: 'लाल फूल देखा', as: 'ৰঙা ফুল লক্ষ্য কৰিলে', bn: 'লাল ফুল দেখলেন', mni: 'অঙাংবা লৈ য়েংখি' }, thumbnail: '/assets/images/cognitive/garden_thumb_3.jpg' },
      { id: 4, startSec: 7.2, endSec: 9.6, label: { en: 'Feeds birds on lawn', hi: 'पक्षियों को दाना दिया', as: 'চৰাইক দানা দিলে', bn: 'পাখিদের দানা দিলেন', mni: 'উচেকশিংদা চানবা পীখি' }, thumbnail: '/assets/images/cognitive/garden_thumb_4.jpg' },
      { id: 5, startSec: 9.6, endSec: 12.0, label: { en: 'Picks blue bottle', hi: 'नीली बोतल उठाई', as: 'নীলা বটল তুলি ল’লে', bn: 'নীল বোতল তুললেন', mni: 'নীলা বোতল লৌখি' }, thumbnail: '/assets/images/cognitive/garden_thumb_5.jpg' }
    ],
    metadata: {
      objects: ['Wooden Park Bench', 'Bright Red Flower Blossom', 'Birds on Grass', 'Sky Blue Water Bottle'],
      actions: ['Walks onto garden path', 'Sits on wooden park bench', 'Notices bright red flower blossom', 'Gently scatters grains to feed birds', 'Picks up sky-blue water bottle from bench']
    }
  },

  // ROUND 4: Bedroom Evening Routine
  BEDROOM_ROUTINE: {
    id: 'bedroom-routine-v4',
    scenarioKey: 'BEDROOM_ROUTINE',
    roundIndex: 4,
    title: {
      en: 'Bedroom Evening Routine',
      hi: 'शाम की दिनचर्या',
      as: 'শোৱা কোঠাৰ সন্ধিয়াৰ নিয়ম',
      bn: 'শোবার ঘরের নিয়ম',
      mni: 'ফমখুমগী নুমিদাংগী থবক'
    },
    videoMp4: '/assets/videos/memory-motion/bedroom_routine_scenario.mp4',
    videoWebm: '/assets/videos/memory-motion/bedroom_routine_scenario.webm',
    poster: '/assets/images/cognitive/bedroom_shot_1.jpg',
    durationSeconds: 12.0,
    shots: [
      { id: 1, startSec: 0.0, endSec: 2.4, label: { en: 'Enters bedroom', hi: 'कमरे में आए', as: 'কোঠালৈ সোমাল', bn: 'ঘরে ঢুকলেন', mni: 'কা মনুংদা চঙখি' }, thumbnail: '/assets/images/cognitive/bedroom_thumb_1.jpg' },
      { id: 2, startSec: 2.4, endSec: 4.8, label: { en: 'Places keys on table', hi: 'मेज पर चाबियां रखीं', as: 'মেজত চাবি থ’লে', bn: 'টেবিলে চাবি রাখলেন', mni: 'তেবলদা চাবি থমখি' }, thumbnail: '/assets/images/cognitive/bedroom_thumb_2.jpg' },
      { id: 3, startSec: 4.8, endSec: 7.2, label: { en: 'Takes reading book', hi: 'किताब निकाली', as: 'কিতাপ উলিয়ালে', bn: 'বই বের করলেন', mni: 'লাইরিক লৌথোকখি' }, thumbnail: '/assets/images/cognitive/bedroom_thumb_3.jpg' },
      { id: 4, startSec: 7.2, endSec: 9.6, label: { en: 'Places glasses by book', hi: 'चश्मा किताब के पास रखा', as: 'চশমা কিতাপৰ কাষত থ’লে', bn: 'চশমা বইয়ের পাশে রাখলেন', mni: 'চশমা লাইরিক্কী নাকলদা থমখি' }, thumbnail: '/assets/images/cognitive/bedroom_thumb_4.jpg' },
      { id: 5, startSec: 9.6, endSec: 12.0, label: { en: 'Turns off lamp', hi: 'लैंप बंद किया', as: 'চাকি নুমুৱালে', bn: 'ল্যাম্প বন্ধ করলেন', mni: 'লম্প মুত্থৎখি' }, thumbnail: '/assets/images/cognitive/bedroom_thumb_5.jpg' }
    ],
    metadata: {
      objects: ['Bedside Table', 'House Keys', 'Hardcover Reading Book', 'Reading Glasses', 'Bedside Lamp'],
      actions: ['Enters bedroom', 'Places house keys on bedside table', 'Opens wooden drawer and takes out reading book', 'Places reading glasses beside book', 'Turns off bedside lamp']
    }
  }
};

/**
 * Array of 4 scenarios for the 4 rounds of a complete cognitive session.
 */
export const ROUND_SCENARIOS = [
  COGNITIVE_SCENARIOS.KITCHEN_MORNING,
  COGNITIVE_SCENARIOS.GROCERY_MARKET,
  COGNITIVE_SCENARIOS.GARDEN_PARK,
  COGNITIVE_SCENARIOS.BEDROOM_ROUTINE
];

/**
 * Resolves the real video source for a given cognitive challenge or round index.
 */
export function getScenarioVideo(challengeOrKeyOrRound) {
  if (typeof challengeOrKeyOrRound === 'number') {
    const idx = Math.max(0, Math.min(ROUND_SCENARIOS.length - 1, challengeOrKeyOrRound - 1));
    return ROUND_SCENARIOS[idx];
  }

  if (typeof challengeOrKeyOrRound === 'string') {
    const k = challengeOrKeyOrRound.toUpperCase();
    return COGNITIVE_SCENARIOS[k] || COGNITIVE_SCENARIOS.KITCHEN_MORNING;
  }

  const scenarioKey = (challengeOrKeyOrRound?.sceneType || challengeOrKeyOrRound?.scenarioKey || 'KITCHEN_MORNING').toUpperCase();
  return COGNITIVE_SCENARIOS[scenarioKey] || COGNITIVE_SCENARIOS.KITCHEN_MORNING;
}
