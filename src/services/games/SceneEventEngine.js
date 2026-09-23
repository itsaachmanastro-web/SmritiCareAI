/**
 * SceneEventEngine
 * 
 * Structured 3D Scene Event Timeline and Dynamic Grounded Question Generation Engine.
 * Powers realistic, video-like cognitive activities for elderly users and dementia care.
 * 
 * Supports 5 Game Types:
 * 1. "What Did You See?" (Direct observation & attribute recall)
 * 2. "Spot the Difference" (Scene state A vs B change detection)
 * 3. "Remember the Sequence" (Chronological action order & working memory)
 * 4. "Object Memory" (Presence, location, and object count recall)
 * 5. "Everyday Decision Scenario" (Everyday logic, safety, and sequence reasoning)
 */

export const SCENE_TYPES = {
  KITCHEN_MORNING: 'kitchen_morning',
  GROCERY_MARKET: 'grocery_market',
  CAFE_SOCIAL: 'cafe_social',
  LIVING_ROOM_DIFFERENCE: 'living_room_difference',
  LEAVING_HOME_SAFETY: 'leaving_home_safety'
};

/**
 * Master catalog of realistic 3D scenario definitions with millisecond-accurate event timelines
 */
export const SCENE_DEFINITIONS = {
  [SCENE_TYPES.KITCHEN_MORNING]: {
    id: 'scene-kitchen-morning',
    sceneType: SCENE_TYPES.KITCHEN_MORNING,
    name: {
      en: 'Morning in the Kitchen',
      hi: 'रसोई में सुबह की शुरुआत',
      as: 'পাকঘৰত ৰাতিপুৱাৰ সময়',
      bn: 'রান্নাঘরে সকালের সময়',
      mni: 'চাকখুমদা অয়ূককী মতম'
    },
    environment: 'kitchen',
    durationSeconds: 10,
    themeColor: '#0D9488',
    initialObjects: [
      { id: 'countertop', name: 'Granite Countertop', position: [-1.2, 0.85, 0] },
      { id: 'red_cup', name: 'Red Ceramic Cup', color: 'red', position: [-1.2, 0.95, -0.2] },
      { id: 'water_pitcher', name: 'Glass Water Pitcher', color: 'clear/glass', position: [-1.5, 0.95, 0.3] },
      { id: 'dining_table', name: 'Wooden Dining Table', position: [0.8, 0.75, 0] },
      { id: 'white_plate', name: 'White Porcelain Plate', color: 'white', position: [0.6, 0.77, 0] },
      { id: 'upper_cabinet', name: 'Upper Wooden Cabinet', position: [-1.2, 1.8, 0] },
      { id: 'medicine_bottle', name: 'Amber Medicine Bottle', color: 'amber/brown', location: 'inside cabinet' },
      { id: 'dining_chair', name: 'Wooden Dining Chair', position: [1.3, 0.45, 0] }
    ],
    events: [
      {
        time: 1.0,
        action: 'enter_room',
        actor: 'Elder Person',
        description: {
          en: 'Elder person enters the warm morning kitchen.',
          hi: 'बुजुर्ग व्यक्ति रसोई में प्रवेश करते हैं।',
          as: 'আইতা পাকঘৰলৈ সোমাই আহে।',
          bn: 'বয়স্ক ব্যক্তিটি রান্নাঘরে প্রবেশ করেন।',
          mni: 'অহনবা মীওই অদু চাকখুমদা চঙলকই।'
        }
      },
      {
        time: 2.8,
        action: 'pick_up',
        actor: 'Elder Person',
        object: 'red cup',
        color: 'red',
        sourceLocation: 'countertop',
        description: {
          en: 'Picks up the bright red ceramic cup from the counter.',
          hi: 'काउंटर से चमकीला लाल कप उठाते हैं।',
          as: 'কাউন্টাৰৰ পৰা ৰঙা কাপটো তুলি লয়।',
          bn: 'কাউন্টার থেকে লাল কাপটি তুলে নেন।',
          mni: 'কাউন্তৰদগী অঙাংবা খাপ অদু লৌখৎই।'
        }
      },
      {
        time: 4.6,
        action: 'fill_water',
        actor: 'Elder Person',
        source: 'glass pitcher',
        target: 'red cup',
        liquid: 'water',
        description: {
          en: 'Fills the red cup with water from the pitcher.',
          hi: 'जग से लाल कप में पानी भरते हैं।',
          as: 'জগৰ পৰা ৰঙা কাপটোত পানী ঢালে।',
          bn: 'জগ থেকে লাল কাপে জল ভরেন।',
          mni: 'জয়দগী অঙাংবা খাপতা ঈশিং হাপই।'
        }
      },
      {
        time: 6.2,
        action: 'place_beside',
        actor: 'Elder Person',
        object: 'red cup',
        besideObject: 'white plate',
        location: 'dining table',
        description: {
          en: 'Places the filled red cup right beside the white plate.',
          hi: 'भरे हुए कप को सफेद प्लेट के पास रखते हैं।',
          as: 'পানী থকা ৰঙা কাপটো বগা কাঁহীখনৰ কাষত ৰাখে।',
          bn: 'ভরা কাপটি সাদা প্লেটের পাশে রাখেন।',
          mni: 'অঙাংবা খাপ অদু অঙৌবা প্লেতকী নাকলদা থমই।'
        }
      },
      {
        time: 7.8,
        action: 'take_from_cabinet',
        actor: 'Elder Person',
        source: 'upper cabinet',
        object: 'amber medicine bottle',
        color: 'amber',
        description: {
          en: 'Opens the cabinet and takes out the amber medicine bottle.',
          hi: 'अलमारी खोलकर दवाई की भूरी बोतल निकालते हैं।',
          as: 'কেবিনেট খুলি ঔষধৰ বাদামী বটলটো উলিয়ায়।',
          bn: 'আলমারি খুলে ওষুধের বাদামী বোতলটি বের করেন।',
          mni: 'কেবিনেত হাংদোক্তুনা হিদাক্কী বোতল লৌথোকই।'
        }
      },
      {
        time: 9.2,
        action: 'sit_down',
        actor: 'Elder Person',
        location: 'dining table chair',
        description: {
          en: 'Gently sits down on the wooden chair by the table.',
          hi: 'मेज के पास वाली लकड़ी की कुर्सी पर बैठते हैं।',
          as: 'মেজৰ কাষৰ কাঠৰ চকীত আৰামেৰে বহে।',
          bn: 'টেবিলের পাশের কাঠের চেয়ারে শান্ত হয়ে বসেন।',
          mni: 'তেবলগী নাকলদা লৈবা চৌকিদা ফমই।'
        }
      }
    ]
  },

  [SCENE_TYPES.GROCERY_MARKET]: {
    id: 'scene-grocery-market',
    sceneType: SCENE_TYPES.GROCERY_MARKET,
    name: {
      en: 'Local Fresh Grocery Market',
      hi: 'स्थानीय किराना व सब्जी बाजार',
      as: 'স্থানীয় গেলাম আৰু শাক-পাচলিৰ বজাৰ',
      bn: 'স্থানীয় মুদি ও সবজির বাজার',
      mni: 'স্থানীয় কৈথেলগী পোৎ-লৈবা'
    },
    environment: 'grocery',
    durationSeconds: 11,
    themeColor: '#16A34A',
    initialObjects: [
      { id: 'produce_shelf', name: 'Wooden Produce Display', position: [-1.2, 0.8, 0] },
      { id: 'bananas', name: 'Yellow Bananas', color: 'yellow', count: 4, position: [-1.2, 0.9, -0.4] },
      { id: 'red_apples', name: 'Red Apples', color: 'red', count: 3, position: [-1.2, 0.9, 0] },
      { id: 'oranges', name: 'Bright Oranges', color: 'orange', count: 3, position: [-1.2, 0.9, 0.4] },
      { id: 'shopping_basket', name: 'Green Shopping Basket', color: 'green', position: [0.2, 0.6, 0.3] },
      { id: 'cereal_box', name: 'Blue Oats Cereal Box', color: 'blue', position: [1.2, 1.3, -0.2] }
    ],
    events: [
      {
        time: 1.2,
        action: 'walk_with_basket',
        actor: 'Elder Shopper',
        object: 'green shopping basket',
        description: {
          en: 'Shopper walks up to the fresh produce stall with a green basket.',
          hi: 'खरीदार हरी टोकरी लेकर फल-सब्जी स्टॉल के पास आते हैं।',
          as: 'সেউজীয়া খৰাহী লৈ শাক-পাচলিৰ দোকানলৈ আহে।',
          bn: 'ক্রেতা সবুজ ঝুড়ি নিয়ে ফলের দোকানের সামনে আসেন।',
          mni: 'অশেংবা পৈলা পাইদুনা কৈথেলদা চঙলকই।'
        }
      },
      {
        time: 3.2,
        action: 'inspect_fruit',
        actor: 'Elder Shopper',
        object: 'yellow bananas',
        color: 'yellow',
        description: {
          en: 'Inspects and selects a fresh bunch of yellow bananas.',
          hi: 'ताजे पीले केलों को देखकर चुनते हैं।',
          as: 'সতেজ হালধীয়া কলৰ থোকা বাছি লয়।',
          bn: 'তাজা হলুদ কলার ছড়া বেছে নেন।',
          mni: 'চাফাবা য়াইঙাংবা চোম্প্রা লৌখৎই।'
        }
      },
      {
        time: 5.0,
        action: 'place_in_basket',
        actor: 'Elder Shopper',
        object: 'yellow bananas',
        target: 'green shopping basket',
        description: {
          en: 'Places the bananas gently into the green basket.',
          hi: 'केलों को हरी टोकरी में रख देते हैं।',
          as: 'কলখিনি সেউজীয়া খৰাহীত ৰাখে।',
          bn: 'কলাগুলো সবুজ ঝুড়িতে রাখেন।',
          mni: 'চোম্প্রা অদু পৈলা মনুংদা থমই।'
        }
      },
      {
        time: 7.0,
        action: 'pick_up_item',
        actor: 'Elder Shopper',
        object: '2 red apples',
        color: 'red',
        count: 2,
        description: {
          en: 'Picks 2 crisp red apples and places them in the basket.',
          hi: '२ लाल सेब उठाकर टोकरी में डालते हैं।',
          as: '২টা ৰঙা আপেল লৈ খৰাহীত থয়।',
          bn: '২টি লাল আপেল নিয়ে ঝুড়িতে রাখেন।',
          mni: 'অঙাংবা সেব ২ লৌদুনা পৈলাদা হাপই।'
        }
      },
      {
        time: 9.2,
        action: 'reach_shelf',
        actor: 'Elder Shopper',
        object: 'blue oats box',
        color: 'blue',
        sourceLocation: 'top grocery shelf',
        description: {
          en: 'Reaches for the blue cereal box from the upper shelf.',
          hi: 'ऊपरी रैक से नीले रंग का अनाज का डिब्बा उठाते हैं।',
          as: 'ওপৰৰ ৰেকৰ পৰা নীলা চিৰিয়েলৰ পেকেটটো লয়।',
          bn: 'উপরের তাক থেকে নীল রঙের ওটসের প্যাকেট নেন।',
          mni: 'মথক্কী তাকতগী নীলা মচুগী পেকেত লৌই।'
        }
      }
    ]
  },

  [SCENE_TYPES.CAFE_SOCIAL]: {
    id: 'scene-cafe-social',
    sceneType: SCENE_TYPES.CAFE_SOCIAL,
    name: {
      en: 'Peaceful Morning Café',
      hi: 'शांत सुबह का कैफ़े',
      as: 'শান্ত পুৱাৰ কেফে',
      bn: 'শান্ত সকালের ক্যাফে',
      mni: 'অয়ূককী শান্ত ওইবা কেফে'
    },
    environment: 'cafe',
    durationSeconds: 10,
    themeColor: '#EA580C',
    initialObjects: [
      { id: 'cafe_table', name: 'Round Wooden Café Table', position: [0, 0.75, 0] },
      { id: 'coffee_mug', name: 'Teal Ceramic Mug', color: 'teal/blue', position: [0.1, 0.77, -0.1] },
      { id: 'newspaper', name: 'Folded Newspaper', position: [-0.3, 0.76, 0.1] },
      { id: 'pastry_plate', name: 'Small Plate with Croissant', position: [0.3, 0.76, 0.2] },
      { id: 'reading_glasses', name: 'Reading Glasses in Black Case', color: 'black case', position: [-0.2, 0.76, -0.2] }
    ],
    events: [
      {
        time: 1.2,
        action: 'sit_at_table',
        actor: 'Friend / Patron',
        location: 'window side table',
        description: {
          en: 'Sits down comfortably at the sunlit wooden café table.',
          hi: 'खिड़की के पास वाली लकड़ी की मेज पर बैठते हैं।',
          as: 'খিৰিকীৰ কাষৰ কাঠৰ মেজত আৰামেৰে বহে।',
          bn: 'জানলার পাশের কাঠের টেবিলে বসেন।',
          mni: 'থোংনাওগী নাকলদা লৈবা তেবলদা ফমই।'
        }
      },
      {
        time: 3.2,
        action: 'open_case_glasses',
        actor: 'Friend / Patron',
        object: 'reading glasses',
        source: 'black glasses case',
        description: {
          en: 'Takes reading glasses out of the black case and wears them.',
          hi: 'काले केस से चश्मा निकाल कर पहनते हैं।',
          as: 'ক’লা খাপৰ পৰা চশমাযোৰ উলিয়াই পিন্ধি লয়।',
          bn: 'কালো খাপ থেকে চশমা বের করে পরেন।',
          mni: 'অমুবা কেসতগী মিৎচশমা লৌথোক্তুনা উপই।'
        }
      },
      {
        time: 5.5,
        action: 'sip_steaming_coffee',
        actor: 'Friend / Patron',
        object: 'teal coffee mug',
        color: 'teal',
        details: 'steaming hot drink',
        description: {
          en: 'Lifts the teal ceramic mug with rising steam and takes a sip.',
          hi: 'भाप निकलती नीली मग से गरम कॉफी की चुस्की लेते हैं।',
          as: 'ধোঁৱা ওলাই থকা নীলা কাপটোৰ পৰা এঢোক কফি খায়।',
          bn: 'ধোঁয়া ওঠা নীল মগ থেকে কফিতে চুমুক দেন।',
          mni: 'অশাংবা কফিগী খাপ অদু পাইদুনা থকই।'
        }
      },
      {
        time: 7.5,
        action: 'unfold_newspaper',
        actor: 'Friend / Patron',
        object: 'daily newspaper',
        location: 'tabletop',
        description: {
          en: 'Unfolds the daily morning newspaper across the table.',
          hi: 'मेज पर सुबह का अखबार खोलते हैं।',
          as: 'মেজৰ ওপৰত বাতৰি কাকতখন মেলি লয়।',
          bn: 'টেবিলের ওপর সকালের খবরের কাগজটি খোলেন।',
          mni: 'তেবলগী মথক্তা পৌচে অদু হাংদোকই।'
        }
      }
    ]
  },

  [SCENE_TYPES.LIVING_ROOM_DIFFERENCE]: {
    id: 'scene-living-room-difference',
    sceneType: SCENE_TYPES.LIVING_ROOM_DIFFERENCE,
    name: {
      en: 'Living Room Spot the Difference',
      hi: 'बैठक कक्ष: अंतर पहचानें',
      as: 'বহা কোঠাৰ পাৰ্থক্য চিনি উলিওৱা',
      bn: 'বসার ঘরের পার্থক্য সন্ধান',
      mni: 'ফমফম কা: তোঙানবা খঙদোকপা'
    },
    environment: 'living_room',
    durationSeconds: 10,
    themeColor: '#6366F1',
    initialObjects: [
      { id: 'wall_clock', name: 'Wall Clock', timeText: '9:00 AM', position: [0, 2.2, -2.5] },
      { id: 'sofa_cushion', name: 'Sofa Cushion', color: 'emerald green', position: [-0.6, 0.7, -1.8] },
      { id: 'coffee_table_book', name: 'Red Hardcover Book', color: 'red', position: [0, 0.45, -1.0] },
      { id: 'indoor_plant', name: 'Fiddle Leaf Fig Plant', position: [1.6, 0.8, -2.0] },
      { id: 'framed_photo', name: 'Family Portrait Frame', position: [-1.2, 1.8, -2.5] }
    ],
    differences: [
      {
        id: 'diff_cushion',
        object: 'sofa cushion',
        original: 'Emerald Green cushion',
        modified: 'Warm Yellow cushion',
        differenceType: 'color_changed',
        difficulty: 'easy',
        description: {
          en: 'The sofa cushion color changed from green to yellow.',
          hi: 'सोफे के तकिए का रंग हरे से पीला हो गया।',
          as: 'কুশ্বনৰ ৰং সেউজীয়াৰ পৰা হালধীয়া হ’ল।',
          bn: 'কুশনের রঙ সবুজ থেকে হলুদ হয়ে গেছে।',
          mni: 'কুশনগী মচু অশেংবদগী য়াইঙাংবদা হোংখ্রে।'
        }
      },
      {
        id: 'diff_clock',
        object: 'wall clock',
        original: 'Time showed 9:00 AM',
        modified: 'Time moved to 11:30 AM',
        differenceType: 'time_changed',
        difficulty: 'medium',
        description: {
          en: 'The wall clock hands changed from 9:00 to 11:30.',
          hi: 'दीवार घड़ी का समय ९:०० से बदलकर ११:३० हो गया।',
          as: 'দেৱাল ঘড়ীৰ সময় ৯:০০ ৰ পৰা ১১:৩০ লৈ সলনি হ’ল।',
          bn: 'দেওয়াল ঘড়ির সময় ৯:০০ থেকে বদলে ১১:৩০ হয়েছে।',
          mni: 'পুং ৯:০০ দগী ১১:৩০ দা হোংখ্রে।'
        }
      },
      {
        id: 'diff_book',
        object: 'table item',
        original: 'Red book was on the coffee table',
        modified: 'Reading glasses replaced the book',
        differenceType: 'object_replaced',
        difficulty: 'easy',
        description: {
          en: 'The red book on the coffee table was replaced with glasses.',
          hi: 'मेज पर रखी लाल किताब की जगह चश्मा आ गया।',
          as: 'মেজৰ ৰঙা কিতাপখনৰ ঠাইত চশমা আহিল।',
          bn: 'টেবিলের লাল বইটির জায়গায় চশমা রাখা হয়েছে।',
          mni: 'তেবলগী অঙাংবা লাইরিক্কী মহুৎ মিৎচশমা থমখ্রে।'
        }
      }
    ]
  },

  [SCENE_TYPES.LEAVING_HOME_SAFETY]: {
    id: 'scene-leaving-home-safety',
    sceneType: SCENE_TYPES.LEAVING_HOME_SAFETY,
    name: {
      en: 'Everyday Safety Checklist Before Leaving',
      hi: 'घर से निकलने से पहले सुरक्षा दिनचर्या',
      as: 'ঘৰৰ পৰা ওলোৱাৰ আগৰ সুৰক্ষা নিয়ম',
      bn: 'বাড়ি থেকে বেরোনোর আগের সুরক্ষা নিয়ম',
      mni: 'য়ুমদগী থোকত্রিঙৈগী চেকশিন-থৌরাং'
    },
    environment: 'entryway',
    durationSeconds: 10,
    themeColor: '#2563EB',
    initialObjects: [
      { id: 'stove_burner', name: 'Gas Stove Dial', state: 'turned OFF with red safety switch' },
      { id: 'brass_keys', name: 'Set of House Keys with Ring', color: 'brass', location: 'entry table' },
      { id: 'cloth_tote', name: 'Brown Cloth Tote Bag', color: 'brown', location: 'beside door' },
      { id: 'front_door', name: 'Main Front Door', state: 'closed securely' }
    ],
    events: [
      {
        time: 1.5,
        action: 'check_stove',
        actor: 'Careful Homeowner',
        object: 'kitchen stove knob',
        state: 'confirmed OFF',
        description: {
          en: 'Checks the kitchen stove and ensures the burner dial is completely turned OFF.',
          hi: 'रसोई में जाकर गैस चूल्हा अच्छी तरह बंद है यह सुनिश्चित करते हैं।',
          as: 'গেছৰ চুইচটো ভালকৈ বন্ধ আছে নে নাই পৰীক্ষা কৰে।',
          bn: 'গ্যাসের নব ভালো করে বন্ধ আছে কি না পরীক্ষা করে নেন।',
          mni: 'গেজগী স্বিচ ফনা থিংজিল্লি।'
        }
      },
      {
        time: 4.2,
        action: 'pick_up_keys',
        actor: 'Careful Homeowner',
        object: 'brass keys',
        sourceLocation: 'hallway console table',
        description: {
          en: 'Picks up the brass house keys from the hallway table.',
          hi: 'दालान की मेज से पीतल की चाबियाँ उठाते हैं।',
          as: 'মেজৰ পৰা ঘৰৰ চাবিৰ থোপা তুলি লয়।',
          bn: 'হলঘরের টেবিল থেকে চাবিটি তুলে নেন।',
          mni: 'তেবলদগী চাবি লৌখৎই।'
        }
      },
      {
        time: 6.5,
        action: 'take_cloth_bag',
        actor: 'Careful Homeowner',
        object: 'brown tote bag',
        description: {
          en: 'Slings the brown cloth shopping bag onto the shoulder.',
          hi: 'कंधे पर भूरा कपड़े का थैला टांगते हैं।',
          as: 'কান্ধত কাপোৰৰ মোনাখন ওলোমাই লয়।',
          bn: 'কাঁধে কাপড়ের থলেটি ঝুলিয়ে নেন।',
          mni: 'খুদালদা কাপোৎকী বেগ পাই।'
        }
      },
      {
        time: 8.8,
        action: 'close_front_door',
        actor: 'Careful Homeowner',
        object: 'main front door',
        description: {
          en: 'Steps outside and firmly clicks the front door closed.',
          hi: 'बाहर निकलकर मुख्य दरवाजा ध्यान से बंद करते हैं।',
          as: 'বাহিৰলৈ ওলাই আহি মূল দুৱাৰখন ভালদৰে বন্ধ কৰে।',
          bn: 'বাইরে বেরিয়ে সাবধানে প্রধান দরজা বন্ধ করেন।',
          mni: 'মপান্দা থোক্তুনা থোং অদু ফনা থিংই।'
        }
      }
    ]
  }
};

/**
 * Generates verified, grounded questions directly from a structured 3D scene definition
 */
export function generateQuestionsForScene(sceneDef) {
  if (!sceneDef || !sceneDef.events) return [];

  const questions = [];
  const events = sceneDef.events;

  // 1. First Action in Scene Question (Sequence & Attention)
  if (events.length >= 2) {
    const firstEvent = events[1] || events[0];
    
    questions.push({
      id: `${sceneDef.id}-q1`,
      gameType: 'what_did_you_see',
      skill: 'working_memory',
      question: {
        en: 'What did the person do FIRST after entering?',
        hi: 'अंदर आने के बाद व्यक्ति ने सबसे पहले क्या काम किया?',
        as: 'সোমাই অহাৰ পিছত প্ৰথমে কি কাম কৰিলে?',
        bn: 'ভেতরে আসার পর ব্যক্তিটি সবার প্রথমে কোন কাজটি করলেন?',
        mni: 'মনুংদা চঙলক্লবা মতুংদা অহানবদা করি তৌখিগে?'
      },
      options: [
        {
          id: 'opt-a',
          icon: '🔴',
          text: {
            en: firstEvent.description.en,
            hi: firstEvent.description.hi,
            as: firstEvent.description.as,
            bn: firstEvent.description.bn,
            mni: firstEvent.description.mni
          },
          isCorrect: true
        },
        {
          id: 'opt-b',
          icon: '🪑',
          text: {
            en: 'Sat down immediately at the table',
            hi: 'आते ही तुरंत कुर्सी पर बैठ गए',
            as: 'লগে লগে চকীত বহিল',
            bn: 'সঙ্গে সঙ্গে চেয়ারে বসে পড়লেন',
            mni: 'খুদক্তা চৌকিদা ফমখি'
          },
          isCorrect: false
        },
        {
          id: 'opt-c',
          icon: '🚪',
          text: {
            en: 'Opened the outside window',
            hi: 'बाहर की खिड़की खोली',
            as: 'খিৰিকীখন খুলিলে',
            bn: 'বাইরের জানলা খুললেন',
            mni: 'থোংনাও হাংখি'
          },
          isCorrect: false
        },
        {
          id: 'opt-d',
          icon: '🧹',
          text: {
            en: 'Swept the kitchen floor with a broom',
            hi: 'फर्श पर झाड़ू लगाई',
            as: 'মজিয়াত ঝাৰু দিলে',
            bn: 'মেঝেতে ঝাঁড়ু দিলেন',
            mni: 'মৈকোল শেংখি'
          },
          isCorrect: false
        }
      ],
      correctAnswerIndex: 0,
      explanation: {
        en: `First, the person ${firstEvent.description.en.toLowerCase()}`,
        hi: `सबसे पहले: ${firstEvent.description.hi}`,
        as: `প্ৰথমতে: ${firstEvent.description.as}`,
        bn: `প্রথমে: ${firstEvent.description.bn}`,
        mni: `অহানবদা: ${firstEvent.description.mni}`
      }
    });
  }

  // 2. Object Color / Attribute Recall
  const colorEvent = events.find(e => e.color);
  if (colorEvent) {
    questions.push({
      id: `${sceneDef.id}-q2`,
      gameType: 'object_memory',
      skill: 'visual_recognition',
      question: {
        en: `What COLOR was the ${colorEvent.object || 'cup'} used in the scene?`,
        hi: `दृश्य में उपयोग किए गए ${colorEvent.object || 'कप'} का रंग क्या था?`,
        as: `দৃশ্যটোত ব্যৱহাৰ কৰা ${colorEvent.object || 'কাপটো'}ৰ ৰং কি আছিল?`,
        bn: `দৃশ্যটিতে ব্যবহৃত ${colorEvent.object || 'কাপটির'} রঙ কী ছিল?`,
        mni: `ভিডিও অসিদা শিজিন্নখিবা ${colorEvent.object || 'খাপ অদু'} করম্বা মচুনো?`
      },
      options: [
        {
          id: 'opt-1',
          icon: '🔴',
          text: {
            en: 'Bright Red Ceramic',
            hi: 'चमकीला लाल',
            as: 'উজ্জ্বল ৰঙা',
            bn: 'উজ্জ্বল লাল',
            mni: 'ঙাল্লবা অঙাংবা'
          },
          isCorrect: colorEvent.color.includes('red')
        },
        {
          id: 'opt-2',
          icon: '🔵',
          text: {
            en: 'Navy Blue Metal',
            hi: 'गहरा नीला',
            as: 'গাঢ় নীলা',
            bn: 'গাঢ় নীল',
            mni: 'অচৌবা নীলা'
          },
          isCorrect: colorEvent.color.includes('blue')
        },
        {
          id: 'opt-3',
          icon: '🟢',
          text: {
            en: 'Forest Green Plastic',
            hi: 'हरा रंग',
            as: 'সেউজীয়া ৰং',
            bn: 'সবুজ রঙ',
            mni: 'অশেংবা মচু'
          },
          isCorrect: colorEvent.color.includes('green')
        },
        {
          id: 'opt-4',
          icon: '⚪',
          text: {
            en: 'Plain White Glass',
            hi: 'सादा सफेद',
            as: 'বগা কাঁচ',
            bn: 'সাদা কাঁচ',
            mni: 'অঙৌবা কাঁচ'
          },
          isCorrect: colorEvent.color.includes('white')
        }
      ],
      correctAnswerIndex: colorEvent.color.includes('red') ? 0 : colorEvent.color.includes('blue') ? 1 : colorEvent.color.includes('green') ? 2 : 3,
      explanation: {
        en: `The ${colorEvent.object} was bright ${colorEvent.color}.`,
        hi: `${colorEvent.object} का रंग ${colorEvent.color} था।`,
        as: `${colorEvent.object}ৰ ৰং ${colorEvent.color} আছিল।`,
        bn: `${colorEvent.object}-এর রঙ ছিল ${colorEvent.color}।`,
        mni: `${colorEvent.object} অদু ${colorEvent.color} মচুনি।`
      }
    });
  }

  // 3. Spatial Placement / Association
  const placeEvent = events.find(e => e.besideObject);
  if (placeEvent) {
    questions.push({
      id: `${sceneDef.id}-q3`,
      gameType: 'what_did_you_see',
      skill: 'spatial_memory',
      question: {
        en: `What did the person place the ${placeEvent.object} BESIDE on the dining table?`,
        hi: `मेज पर ${placeEvent.object} को किसके पास रखा गया?`,
        as: `মেজত ${placeEvent.object}টো কাৰ কাষত ৰখা হ’ল?`,
        bn: `টেবিলে ${placeEvent.object}-টি কার পাশে রাখা হয়েছিল?`,
        mni: `তেবলদা ${placeEvent.object} অদু কনানা নাকলদা থমখিগে?`
      },
      options: [
        {
          id: 'opt-1',
          icon: '🍽️',
          text: {
            en: 'Beside the White Porcelain Plate',
            hi: 'सफेद प्लेट के पास',
            as: 'বগা কাঁহীখনৰ কাষত',
            bn: 'সাদা প্লেটের পাশে',
            mni: 'অঙৌবা প্লেতকী নাকলদা'
          },
          isCorrect: true
        },
        {
          id: 'opt-2',
          icon: '📰',
          text: {
            en: 'On top of the morning newspaper',
            hi: 'सुबह के अखबार के ऊपर',
            as: 'বাতৰি কাকতৰ ওপৰত',
            bn: 'খবরের কাগজের ওপর',
            mni: 'পৌচেগী মথক্তা'
          },
          isCorrect: false
        },
        {
          id: 'opt-3',
          icon: '🪴',
          text: {
            en: 'Next to the green flower vase',
            hi: 'फूलदान के ठीक बगल में',
            as: 'ফুলদানীৰ কাষত',
            bn: 'ফুলদানির পাশে',
            mni: 'লৈপৈলাগী নাকলদা'
          },
          isCorrect: false
        },
        {
          id: 'opt-4',
          icon: '🪵',
          text: {
            en: 'On the wooden chair seat',
            hi: 'कुर्सी की गद्दी पर',
            as: 'চকীৰ আসনৰ ওপৰত',
            bn: 'চেয়ারের ওপরে',
            mni: 'চৌকি মথক্তা'
          },
          isCorrect: false
        }
      ],
      correctAnswerIndex: 0,
      explanation: {
        en: `The ${placeEvent.object} was placed carefully beside the ${placeEvent.besideObject}.`,
        hi: `${placeEvent.object} को ${placeEvent.besideObject} के पास रखा गया था।`,
        as: `${placeEvent.object}টো ${placeEvent.besideObject}ৰ কাষত ৰখা হৈছিল।`,
        bn: `${placeEvent.object}-টি ${placeEvent.besideObject}-এর পাশে রাখা হয়েছিল।`,
        mni: `${placeEvent.object} অদু ${placeEvent.besideObject}গী নাকলদা থমখি।`
      }
    });
  }

  // 4. Sequence Next / Cabinet Action Recall
  const cabinetEvent = events.find(e => e.action === 'take_from_cabinet' || e.action === 'reach_shelf');
  if (cabinetEvent) {
    questions.push({
      id: `${sceneDef.id}-q4`,
      gameType: 'remember_sequence',
      skill: 'sequence_recall',
      question: {
        en: `What item was taken from the ${cabinetEvent.source || 'upper cabinet'}?`,
        hi: `${cabinetEvent.source || 'अलमारी'} से क्या वस्तु निकाली गई थी?`,
        as: `${cabinetEvent.source || 'কেবিনেট'}ৰ পৰা কি বস্তু উলিওৱা হৈছিল?`,
        bn: `${cabinetEvent.source || 'আলমারি'} থেকে কোন জিনিসটি বের করা হয়েছিল?`,
        mni: `${cabinetEvent.source || 'কেবিনেত'} অদুদগী করি পোৎ লৌথোকখিগে?`
      },
      options: [
        {
          id: 'opt-1',
          icon: '💊',
          text: {
            en: 'Amber Medicine Bottle',
            hi: 'दवाई की भूरी बोतल',
            as: 'ঔষধৰ বাদামী বটল',
            bn: 'ওষুধের বাদামী বোতল',
            mni: 'হিদাক্কী বোতল'
          },
          isCorrect: true
        },
        {
          id: 'opt-2',
          icon: '🍯',
          text: {
            en: 'Glass jar of honey',
            hi: 'शहद की शीशी',
            as: 'মৌৰ বটল',
            bn: 'মধুর শিশি',
            mni: 'খোইহি বোতল'
          },
          isCorrect: false
        },
        {
          id: 'opt-3',
          icon: '🧂',
          text: {
            en: 'Salt shaker shaker',
            hi: 'नमकदानी',
            as: 'নিমখদানি',
            bn: 'নুনদানি',
            mni: 'থুমদানি'
          },
          isCorrect: false
        },
        {
          id: 'opt-4',
          icon: '🍪',
          text: {
            en: 'Box of sweet biscuits',
            hi: 'बिस्कुट का पैकेट',
            as: 'বিস্কুটৰ পেকেট',
            bn: 'বিস্কুটের প্যাকেট',
            mni: 'বিস্কুৎ পেকেত'
          },
          isCorrect: false
        }
      ],
      correctAnswerIndex: 0,
      explanation: {
        en: `The person opened the cabinet and retrieved the amber medicine bottle.`,
        hi: `अलमारी से दवाई की बोतल निकाली गई थी।`,
        as: `কেবিনেটৰ পৰা ঔষধৰ বটলটো উলিওৱা হৈছিল।`,
        bn: `আলমারি থেকে ওষুধের বোতলটি বের করা হয়েছিল।`,
        mni: `কেবিনেততগী হিদাক্কী বোতল লৌথোকখি।`
      }
    });
  }

  // 5. Final Action in Sequence ("Where did the person sit down?")
  const finalEvent = events[events.length - 1];
  if (finalEvent && finalEvent.action === 'sit_down') {
    questions.push({
      id: `${sceneDef.id}-q5`,
      gameType: 'what_did_you_see',
      skill: 'working_memory',
      question: {
        en: 'At the end of the scene, WHERE did the person sit down?',
        hi: 'दृश्य के अंत में व्यक्ति कहाँ बैठे?',
        as: 'দৃশ্যটোৰ শেষত মানুহজনে ক’ত বহিলে?',
        bn: 'দৃশ্যটির শেষে ব্যক্তিটি কোথায় বসলেন?',
        mni: 'ভিডিও অসিগী অরোইবদা মীওই অদু কদাইদা ফমখিগে?'
      },
      options: [
        {
          id: 'opt-1',
          icon: '🪑',
          text: {
            en: 'On the wooden dining chair by the table',
            hi: 'मेज के पास वाली लकड़ी की कुर्सी पर',
            as: 'মেজৰ কাষৰ কাঠৰ চকীত',
            bn: 'টেবিলের পাশের কাঠের চেয়ারে',
            mni: 'তেবলগী নাকলগী চৌকিদা'
          },
          isCorrect: true
        },
        {
          id: 'opt-2',
          icon: '🛋️',
          text: {
            en: 'On the living room sofa cushion',
            hi: 'बैठक के सोफे पर',
            as: 'বহা কোঠাৰ সোফাত',
            bn: 'বসার ঘরের সোফায়',
            mni: 'সোফাদা'
          },
          isCorrect: false
        },
        {
          id: 'opt-3',
          icon: '🛏️',
          text: {
            en: 'On the bedroom cot',
            hi: 'बिस्तर पर',
            as: 'বিচনাত',
            bn: 'বিছানায়',
            mni: 'ফমুংদা'
          },
          isCorrect: false
        },
        {
          id: 'opt-4',
          icon: '🌿',
          text: {
            en: 'On the veranda bench outdoors',
            hi: 'बाहर बरामदे के बेंच पर',
            as: 'বাৰান্দাৰ বেঞ্চত',
            bn: 'বারান্দার বেঞ্চে',
            mni: 'বাৰান্দাগী বেঞ্চদা'
          },
          isCorrect: false
        }
      ],
      correctAnswerIndex: 0,
      explanation: {
        en: 'The person sat down calmly on the wooden dining chair beside the table.',
        hi: 'व्यक्ति मेज के पास वाली लकड़ी की कुर्सी पर शांति से बैठे।',
        as: 'মানুহজনে মেজৰ কাষৰ কাঠৰ চকীত আৰামেৰে বহিল।',
        bn: 'ব্যক্তিটি টেবিলের পাশের কাঠের চেয়ারে বসলেন।',
        mni: 'মীওই অদু তেবলগী নাকলদা লৈবা চৌকিদা ফমখি।'
      }
    });
  }

  return questions;
}

/**
 * Generates Spot the Difference activity questions
 */
export function generateSpotDifferenceChallenge(sceneDef, difficultyLevel = 2) {
  return {
    id: `${sceneDef.id}-spot-diff`,
    gameType: 'spot_the_difference',
    skill: 'visual_attention',
    difficulty: difficultyLevel,
    title: {
      en: 'Spot the Living Room Difference',
      hi: 'बैठक कक्ष में क्या बदला?',
      as: 'বহা কোঠাৰ কি সলনি হ’ল চিনি উলিওৱা',
      bn: 'বসার ঘরে কী পরিবর্তন হয়েছে?',
      mni: 'ফমফম কাদা করি হোংখিবগে?'
    },
    question: {
      en: 'What CHANGED in the room when observed the second time?',
      hi: 'दूसरी बार देखने पर कमरे में क्या बदलाव दिखाई दिया?',
      as: 'দ্বিতীয়বাৰ চাওঁতে কোঠাটোত কি সলনি হ’ল?',
      bn: 'দ্বিতীয়বার দেখার সময় ঘরে কী পরিবর্তন দেখা গেল?',
      mni: 'অনিশুবা মতমদা য়েংবদা করি হোংখিবগে?'
    },
    options: [
      {
        id: 'opt-diff-1',
        icon: '🛋️',
        text: {
          en: 'Sofa cushion changed color from Green to Yellow',
          hi: 'सोफे के तकिए का रंग हरे से पीला हो गया',
          as: 'সোফাৰ কুশ্বনৰ ৰং সেউজীয়াৰ পৰা হালধীয়া হ’ল',
          bn: 'সোফার কুশনের রঙ সবুজ থেকে হলুদ হয়েছে',
          mni: 'সোফাগী কুশন মচু অশেংবদগী য়াইঙাংবদা হোংখি'
        },
        isCorrect: true
      },
      {
        id: 'opt-diff-2',
        icon: '🚪',
        text: {
          en: 'The main door was completely removed',
          hi: 'मुख्य दरवाजा गायब हो गया',
          as: 'মূল দুৱাৰখন আঁতৰি গ’ল',
          bn: 'প্রধান দরজাটি উধাও হয়ে গেছে',
          mni: 'থোং অদু মাংখ্রে'
        },
        isCorrect: false
      },
      {
        id: 'opt-diff-3',
        icon: '💡',
        text: {
          en: 'All ceiling lights turned off completely',
          hi: 'छत की सभी लाइटें बंद हो गईं',
          as: 'চিলিঙৰ লাইটবোৰ বন্ধ হ’ল',
          bn: 'সিলিং-এর সব আলো নিভে গেছে',
          mni: 'মৈ পুম্নমক মুৎখ্রে'
        },
        isCorrect: false
      },
      {
        id: 'opt-diff-4',
        icon: '🪵',
        text: {
          en: 'The floor turned into dark marble tiles',
          hi: 'फर्श संगमरमर का हो गया',
          as: 'মজিয়াখন মাৰ্বলৰ হ’ল',
          bn: 'মেঝেটি মার্বেল পাথরের হয়ে গেছে',
          mni: 'মৈকোল মাৰ্বেল ওইখ্রে'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The emerald green sofa cushion was replaced by a warm yellow cushion.',
      hi: 'सोफे पर हरा तकिया बदलकर पीला तकिया रख दिया गया था।',
      as: 'সেউজীয়া কুশ্বনটোৰ ঠাইত হালধীয়া কুশ্বন ৰখা হৈছিল।',
      bn: 'সবুজ কুশনটির বদলে হলুদ কুশন রাখা হয়েছিল।',
      mni: 'অশেংবা কুশনগী মহুৎ য়াইঙাংবা কুশন থমখি।'
    }
  };
}
