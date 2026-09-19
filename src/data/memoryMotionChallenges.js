/**
 * SmritiCare Memory Motion Challenge Dataset
 * 
 * Video-first cognitive training challenges covering Levels 1–10.
 * Designed for elderly users with culturally familiar North-Eastern & Indian daily themes.
 * Supports English (en), Hindi (hi), Assamese (as), Bengali (bn), Manipuri (mni).
 */

export const MEMORY_MOTION_CHALLENGES = [
  {
    id: 'mm-001',
    difficulty: 2,
    levelTier: 'easy',
    durationSeconds: 7,
    category: 'visual-memory',
    cognitiveSkill: 'recognition',
    questionType: 'direct-recall',
    sceneType: 'tea_pouring',
    videoUrl: '/assets/videos/memory-motion/tea-pouring.mp4',
    posterUrl: '/assets/images/companion-light.jpg',
    replayAllowed: true,
    maxReplays: 2,
    title: {
      en: 'Morning Tea Pouring',
      hi: 'सुबह की ताज़ा चाय',
      as: 'ৰাতিপুৱাৰ সতেজ চাহ',
      bn: 'সকালের তাজা চা',
      mni: 'য়ুক্কি অয়ূককী চা'
    },
    description: {
      en: 'A caregiver pours warm golden Assam tea from a metal kettle into a porcelain cup.',
      hi: 'केतली से कप में गरम चाय डाली जा रही है।',
      as: 'কেটলিৰ পৰা কাপত গৰম চাহ ঢালি থকা হৈছে।',
      bn: 'কেটলি থেকে কাপে গরম চা ঢালা হচ্ছে।',
      mni: 'কেতলীদগী খাপতা অশাংবা চা হাপ্লি।'
    },
    question: {
      en: 'What did the person pour into the cup?',
      hi: 'व्यक्ति ने कप में क्या डाला?',
      as: 'মানুহজনে কাপত কি ঢালিলে?',
      bn: 'ব্যক্তিটি কাপে কী ঢাললেন?',
      mni: 'মীওই অদুগী খাপতা করি হাপখিগে?'
    },
    options: [
      {
        id: 'opt-1',
        icon: '🍵',
        text: {
          en: 'Warm Golden Tea',
          hi: 'गरम ताज़ा चाय',
          as: 'গৰম সতেজ চাহ',
          bn: 'গরম তাজা চা',
          mni: 'অশাংবা সোণগী চা'
        },
        isCorrect: true
      },
      {
        id: 'opt-2',
        icon: '🍊',
        text: {
          en: 'Cold Orange Juice',
          hi: 'ठंडा संतरे का रस',
          as: 'ঠাণ্ডা কমলা ৰস',
          bn: 'ঠান্ডা কমলার রস',
          mni: 'অইংবা কমলাগি মহি'
        },
        isCorrect: false
      },
      {
        id: 'opt-3',
        icon: '🥛',
        text: {
          en: 'Glass of Milk',
          hi: 'दूध का गिलास',
          as: 'গাখীৰৰ গিলাচ',
          bn: 'দুধের গ্লাস',
          mni: 'শংগোই খাপ'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The person poured warm steaming tea from the traditional kettle into the cup.',
      hi: 'व्यक्ति ने केतली से कप में गरम चाय डाली थी।',
      as: 'মানুহজনে পৰম্পৰাগত কেটলিৰ পৰা কাপত গৰম চাহ ঢালিছিল।',
      bn: 'ব্যক্তিটি কেতলি থেকে কাপে গরম চা ঢেলেছিলেন।',
      mni: 'মীওই অদুগী কেতলীদগী খাপতা অশাংবা চা হাপখি।'
    }
  },
  {
    id: 'mm-002',
    difficulty: 2,
    levelTier: 'easy',
    durationSeconds: 8,
    category: 'visual-memory',
    cognitiveSkill: 'recognition',
    questionType: 'feature-identification',
    sceneType: 'flower_garden',
    videoUrl: '/assets/videos/memory-motion/flower-garden.mp4',
    posterUrl: '/assets/images/role-patient.jpg',
    replayAllowed: true,
    maxReplays: 2,
    title: {
      en: 'Puja Flower Gathering',
      hi: 'पूजा के फूल चुनना',
      as: 'পূজাৰ ফুল তোলা',
      bn: 'পূজোর ফুল তোলা',
      mni: 'পূজাগী হৈকৎ লোইবা'
    },
    description: {
      en: 'An elder gently picks bright yellow marigolds from a veranda flowerpot into a cane basket.',
      hi: 'बगीचे से पीले गेंदे के फूल चुने जा रहे हैं।',
      as: 'বাৰান্দাৰ ফুলৰ টাবৰ পৰা হালধীয়া গেন্ধা ফুল তোলা হৈছে।',
      bn: 'বারান্দার টব থেকে হলুদ গাঁদা ফুল তোলা হচ্ছে।',
      mni: 'য়ুমথোংদগী য়াইনা য়ৌরবা সানারৈ হৈকৎ লোইরি।'
    },
    question: {
      en: 'What color were the flowers picked from the garden?',
      hi: 'बगीचे से किस रंग के फूल चुने गए?',
      as: 'ফুলনিৰ পৰা কি ৰঙৰ ফুল তোলা হৈছিল?',
      bn: 'বাগান থেকে কোন রঙের ফুল তোলা হয়েছিল?',
      mni: 'লৈকোলদগী লোইখিবা লৈ অদু করম্বা মচুগীনো?'
    },
    options: [
      {
        id: 'opt-1',
        icon: '🌼',
        text: {
          en: 'Bright Yellow Marigolds',
          hi: 'चमकीले पीले गेंदे के फूल',
          as: 'উজ্জ্বল হালধীয়া গেন্ধা ফুল',
          bn: 'উজ্জ্বল হলুদ গাঁদা ফুল',
          mni: 'ঙাল্লবা য়াইনা য়ৌরবা সানারৈ'
        },
        isCorrect: true
      },
      {
        id: 'opt-2',
        icon: '🌹',
        text: {
          en: 'Deep Red Roses',
          hi: 'गहरे लाल गुलाब',
          as: 'গাঢ় ৰঙা গোলাপ',
          bn: 'গাঢ় লাল গোলাপ',
          mni: 'অঙাংবা গুলাপ'
        },
        isCorrect: false
      },
      {
        id: 'opt-3',
        icon: '🪻',
        text: {
          en: 'Purple Orchids',
          hi: 'बैंगनी आर्किड',
          as: 'বেঙুনীয়া কপৌফুল',
          bn: 'বেগুনী অর্কিড',
          mni: 'লৈরাং কপৌ'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The elder picked bright golden-yellow marigolds into the cane basket.',
      hi: 'बुजुर्ग ने डलिया में सुंदर पीले गेंदे के फूल चुने थे।',
      as: 'আইতাই বাঁহৰ খৰাহীত ধুনীয়া হালধীয়া গেন্ধা ফুল তুলিছিল।',
      bn: 'ঝুড়িতে সুন্দর উজ্জ্বল হলুদ গাঁদা ফুল তোলা হয়েছিল।',
      mni: 'পৈলাদা ধুনীয়া য়াইনা য়ৌরবা সানারৈ লোইখি।'
    }
  },
  {
    id: 'mm-003',
    difficulty: 3,
    levelTier: 'easy',
    durationSeconds: 8,
    category: 'visual-memory',
    cognitiveSkill: 'recall',
    questionType: 'direct-recall',
    sceneType: 'spice_box',
    videoUrl: '/assets/videos/memory-motion/spice-box.mp4',
    posterUrl: '/assets/images/caregiver-hero.jpg',
    replayAllowed: true,
    maxReplays: 2,
    title: {
      en: 'Kitchen Spice Box',
      hi: 'रसोई का मसाला डिब्बा',
      as: 'পাকঘৰৰ মচলাৰ চপটা',
      bn: 'রান্নাঘরের মশলার কৌটো',
      mni: 'চাকখুমগী মসল্লা বাস্কা'
    },
    description: {
      en: 'Opening a traditional circular brass spice box and picking green cardamom pods.',
      hi: 'पीतल के डिब्बे से हरी इलायची निकाली जा रही है।',
      as: 'পিতলৰ মচলাৰ চপটাৰ পৰা সেউজীয়া ইলাচী লোৱা হৈছে।',
      bn: 'পিতলের মশলার কৌটো থেকে সবুজ এলাচ তোলা হচ্ছে।',
      mni: 'পিত্তলগী বাস্কাদগী অশেংবা ইলাচী লৌখৎলি।'
    },
    question: {
      en: 'Which spice did the person pick from the round brass box?',
      hi: 'गोल डिब्बे से कौन सा मसाला निकाला गया?',
      as: 'ঘূৰণীয়া চপটাটোৰ পৰা কি মচলা লোৱা হৈছিল?',
      bn: 'গোল কৌটোটি থেকে কোন মশলাটি তোলা হয়েছিল?',
      mni: 'কোইবা বাস্কা অদুদগী করম্বা মসল্লা লৌখৎখিগে?'
    },
    options: [
      {
        id: 'opt-1',
        icon: '🫚',
        text: {
          en: 'Dry Ginger Root',
          hi: 'सूखा सोंठ / अदरक',
          as: 'শুকান আদা',
          bn: 'শুকনো আদা',
          mni: 'অকংবা শিঙ'
        },
        isCorrect: false
      },
      {
        id: 'opt-2',
        icon: '🌿',
        text: {
          en: 'Green Cardamom (Elaichi)',
          hi: 'हरी इलायची',
          as: 'সেউজীয়া ইলাচী',
          bn: 'সবুজ এলাচ',
          mni: 'অশেংবা ইলাচী'
        },
        isCorrect: true
      },
      {
        id: 'opt-3',
        icon: '🌶️',
        text: {
          en: 'Red Chilli Powder',
          hi: 'लाल मिर्च पाउडर',
          as: 'ৰঙা জলকীয়া গুড়ি',
          bn: 'লাল লঙ্কা গুঁড়ো',
          mni: 'অঙাংবা মোরোক গুন্দা'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 1,
    explanation: {
      en: 'Green cardamom pods were picked from the center section of the spice container.',
      hi: 'मसाले के डिब्बे के बीच वाले हिस्से से हरी इलायची निकाली गई थी।',
      as: 'মচলাৰ চপটাটোৰ মাজৰ অংশৰ পৰা সেউজীয়া ইলাচী লোৱা হৈছিল।',
      bn: 'মশলার কৌটোর মাঝখান থেকে সবুজ এলাচ নেওয়া হয়েছিল।',
      mni: 'বাস্কা অদুগী ময়ায়দগী অশেংবা ইলাচী লৌখৎখি।'
    }
  },
  {
    id: 'mm-004',
    difficulty: 4,
    levelTier: 'medium',
    durationSeconds: 10,
    category: 'sequence',
    cognitiveSkill: 'sequence',
    questionType: 'sequence-order',
    sceneType: 'diya_lighting',
    videoUrl: '/assets/videos/memory-motion/diya-lighting.mp4',
    posterUrl: '/assets/images/pattern-art.jpg',
    replayAllowed: true,
    maxReplays: 1,
    title: {
      en: 'Evening Sandhya Diya',
      hi: 'शाम का दीया जलाना',
      as: 'সন্ধ্যা চাকি জ্বলোৱা',
      bn: 'সন্ধ্যায় প্রদীপ জ্বালানো',
      mni: 'নুমিদাংগী থা সাকপা'
    },
    description: {
      en: 'Lighting a mustard oil clay diya, praying with folded hands, and placing it near the door.',
      hi: 'मिट्टी का दीया जलाकर दरवाजे के पास रखा गया।',
      as: 'মাটিৰ চাকিটো জ্বলাই দুৱাৰৰ কাষত ৰখা হৈছে।',
      bn: 'মাটির প্রদীপ জ্বালিয়ে দরজার কাছে রাখা হলো।',
      mni: 'লৈবাক্কী থা সাক্তুনা থোংগোলদা থম্লি।'
    },
    question: {
      en: 'What action happened immediately AFTER lighting the diya flame?',
      hi: 'दीया जलाने के तुरंत बाद क्या किया गया?',
      as: 'চাকিটো জ্বলোৱাৰ ঠিক পিছত কি কৰা হ’ল?',
      bn: 'প্রদীপ জ্বালানোর ঠিক পরেই কী করা হয়েছিল?',
      mni: 'থা সাক্লবা মতুংদা খূদক্তা করি তৌখিগে?'
    },
    options: [
      {
        id: 'opt-1',
        icon: '🙏',
        text: {
          en: 'Bowed with folded hands in prayer',
          hi: 'हाथ जोड़कर प्रणाम किया',
          as: 'হাতযোৰ কৰি সেৱা কৰিলে',
          bn: 'হাতজোড় করে প্রণাম করলেন',
          mni: 'খুৎ লোইনা খুরুমখি'
        },
        isCorrect: true
      },
      {
        id: 'opt-2',
        icon: '🚪',
        text: {
          en: 'Closed and locked the front door',
          hi: 'मुख्य दरवाजा बंद किया',
          as: 'মূল দুৱাৰখন বন্ধ কৰিলে',
          bn: 'প্রধান দরজা বন্ধ করলেন',
          mni: 'থোং পুংনা থিংজিনখি'
        },
        isCorrect: false
      },
      {
        id: 'opt-3',
        icon: '🔔',
        text: {
          en: 'Blew the conch shell loudly',
          hi: 'जोर से शंख बजाया',
          as: 'শংখ বজালে',
          bn: 'শঙ্খ বাজালেন',
          mni: 'শংখ খুংখি'
        },
        isCorrect: false
      },
      {
        id: 'opt-4',
        icon: '🧹',
        text: {
          en: 'Swept the threshold with broom',
          hi: 'झाड़ू लगाई',
          as: 'ঝাৰু দিলে',
          bn: 'ঝাড়ু দিলেন',
          mni: 'সম্বাল শেংদোকখি'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'Right after the diya was lit, the elder bowed reverently with folded hands before placing it.',
      hi: 'दीया जलाने के बाद बुजुर्ग ने हाथ जोड़कर प्रणाम किया था।',
      as: 'চাকি জ্বলোৱাৰ পিছতে আইতাই হাতযোৰ কৰি মূৰ দোৱাই সেৱা কৰিছিল।',
      bn: 'প্রদীপ জ্বালানোর পরেই শ্রদ্ধার সাথে হাতজোড় করে প্রণাম করা হয়েছিল।',
      mni: 'থা সাক্লবা মতুংদা খুৎ লোইনা শ্রদ্ধা তৌজখি।'
    }
  },
  {
    id: 'mm-005',
    difficulty: 5,
    levelTier: 'medium',
    durationSeconds: 11,
    category: 'attention',
    cognitiveSkill: 'attention',
    questionType: 'feature-identification',
    sceneType: 'silk_weaving',
    videoUrl: '/assets/videos/memory-motion/silk-weaving.mp4',
    posterUrl: '/assets/images/pattern-art.jpg',
    replayAllowed: true,
    maxReplays: 1,
    title: {
      en: 'Weaver’s Silk Spools',
      hi: 'बुनकर की रेशमी रीलों का चयन',
      as: 'তাঁতৰ ৰেচমৰ মাকো বাছনি',
      bn: 'তাঁতের রেশমি মাকু নির্বাচন',
      mni: 'খোংজাংগী লৈশাং মাকু'
    },
    description: {
      en: 'At a traditional handloom, selecting a brilliant golden Muga silk bobbin from a rack of threads.',
      hi: 'तांत पर सुनहरी रेशम की रील चुनी जा रही है।',
      as: 'তাঁতশালত ৰেকৰ পৰা সোণালী মুগা ৰেচমৰ মাকো লোৱা হৈছে।',
      bn: 'তাঁতের তাকে সোনালী মুগা রেশমের মাকু বাছা হচ্ছে।',
      mni: 'খোংজাংগী রেক অদুদগী সোণালী মুগা লৈশাং লৌরি।'
    },
    question: {
      en: 'Which color silk spool did the weaver pick from the loom rack?',
      hi: 'बुनकर ने रैक से किस रंग की रेशम की रील उठाई?',
      as: 'তাঁতীয়ে তাঁতশালৰ ৰেকৰ পৰা কি ৰঙৰ ৰেচমৰ মাকো ল’লে?',
      bn: 'তাঁতি তাঁত থেকে কোন রঙের রেশম মাকু তুলেছিলেন?',
      mni: 'খোংজাং রুদগী করম্বা মচুগী লৈশাং লৌখৎখিগে?'
    },
    options: [
      {
        id: 'opt-1',
        icon: '🧵',
        text: {
          en: 'Golden Assam Muga Silk',
          hi: 'सुनहरी असमिया मूंगा सिल्क',
          as: 'সোণালী অসমীয়া মুগা সূতা',
          bn: 'সোনালী আসাম মুগা রেশম',
          mni: 'সোণালী অসাম মুগা লৈশাং'
        },
        isCorrect: true
      },
      {
        id: 'opt-2',
        icon: '🧶',
        text: {
          en: 'Deep Indigo Blue Cotton',
          hi: 'गहरा नीला सूती धागा',
          as: 'গাঢ় নীল কপাহী সূতা',
          bn: 'গাঢ় নীল সুতি সুতো',
          mni: 'অচৌবা নীলা লৈশাং'
        },
        isCorrect: false
      },
      {
        id: 'opt-3',
        icon: '🧶',
        text: {
          en: 'Bright Silver Grey Yarn',
          hi: 'सफेद चमकीला धागा',
          as: 'ৰূপালী সূতা',
          bn: 'রূপোলী সুতো',
          mni: 'লুপা মচুগী লৈশাং'
        },
        isCorrect: false
      },
      {
        id: 'opt-4',
        icon: '🪡',
        text: {
          en: 'Emerald Green Wool',
          hi: 'हरा ऊनी धागा',
          as: 'সেউজীয়া উল সূতা',
          bn: 'সবুজ উলের সুতো',
          mni: 'অশেংবা উল'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The weaver picked the gleaming golden Muga silk bobbin to weave the border motif.',
      hi: 'बुनकर ने किनारे की बुनाई के लिए सुनहरी मूंगा रेशम की रील चुनी थी।',
      as: 'তাঁতীয়ে পাৰি ফুল বাছিবলৈ উজ্জ্বল সোণালী মুগা সূতাৰ মাকো লৈছিল।',
      bn: 'তাঁতি পাড়ের নকশার জন্য সোনালী মুগা রেশমের মাকু বেছে নিয়েছিলেন।',
      mni: 'খোংজাংগী পাৰি য়ৌনবা সোণালী মুগা লৈশাং লৌখৎখি।'
    }
  },
  {
    id: 'mm-006',
    difficulty: 5,
    levelTier: 'medium',
    durationSeconds: 12,
    category: 'visual-memory',
    cognitiveSkill: 'working-memory',
    questionType: 'detail-count',
    sceneType: 'fruit_tray',
    videoUrl: '/assets/videos/memory-motion/fruit-tray.mp4',
    posterUrl: '/assets/images/auth-patient.jpg',
    replayAllowed: true,
    maxReplays: 1,
    title: {
      en: 'Bell-Metal Xorai Fruits',
      hi: 'सराई पर फल सजाना',
      as: 'শৰাইত ফল-মূল সজোৱা',
      bn: 'শরাইয়ে ফল সাজানো',
      mni: 'খোংজেম্বদা হৈ-মরোং থম্বা'
    },
    description: {
      en: 'Arranging fresh ripe bananas and red apples onto a traditional pedestal bell-metal xorai.',
      hi: 'पीतल की सराई में केले और सेब सजाए जा रहे हैं।',
      as: 'পিতলৰ শৰাইখনত পকা কল আৰু ৰঙা আপেল সজাই থকা হৈছে।',
      bn: 'পিতলের শরাইতে কলা এবং আপেল সাজানো হচ্ছে।',
      mni: 'খোংজেম্বদা চাফাবা চোম্প্রা অমসুং সেব থম্লি।'
    },
    question: {
      en: 'How many bananas were placed onto the xorai tray?',
      hi: 'सराई में कितने केले रखे गए थे?',
      as: 'শৰাইখনত কেইটা কল ৰখা হৈছিল?',
      bn: 'শরাইয়ের ওপর কয়টি কলা রাখা হয়েছিল?',
      mni: 'খোংজেম্ব অদুগী মথক্তা চাফাবা চোম্প্রা কয়া থমখিগে?'
    },
    options: [
      {
        id: 'opt-1',
        icon: '🍌',
        text: {
          en: 'Exactly 3 Ripe Bananas',
          hi: 'ठीक ३ पके केले',
          as: 'ঠিক ৩টা পকা কল',
          bn: 'ঠিক ৩টি পাকা কলা',
          mni: 'মচেৎ ৩ চাফাবা চোম্প্রা'
        },
        isCorrect: true
      },
      {
        id: 'opt-2',
        icon: '🍌',
        text: {
          en: 'Just 1 Single Banana',
          hi: 'सिर्फ १ अकेला केला',
          as: 'কেৱল ১টা কল',
          bn: 'মাত্র ১টি কলা',
          mni: 'অমাখক চাফাবা চোম্প্রা'
        },
        isCorrect: false
      },
      {
        id: 'opt-3',
        icon: '🍌',
        text: {
          en: '5 Bananas in a Bunch',
          hi: '५ केलों का गुच्छा',
          as: '৫টা কলৰ থোকা',
          bn: '৫টি কলার ছড়া',
          mni: 'চোম্প্রা ৫'
        },
        isCorrect: false
      },
      {
        id: 'opt-4',
        icon: '🍎',
        text: {
          en: 'Zero bananas (only apples)',
          hi: 'कोई केला नहीं (सिर्फ सेब)',
          as: 'কোনো কল নাছিল (কেৱল আপেল)',
          bn: 'কোনো কলা নেই (শুধু আপেল)',
          mni: 'চোম্প্রা লৈত্ৰে'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'Three ripe bananas were placed neatly around the single red apple on the xorai.',
      hi: 'सराई में एक लाल सेब के साथ ठीक ३ पके केले रखे गए थे।',
      as: 'শৰাইখনত ৰঙা আপেলটোৰ কাষত ধুনীয়াকৈ ৩টা পকা কল সজাই ৰখা হৈছিল।',
      bn: 'শরাইয়ের ওপর একটি লাল আপেলের সাথে ঠিক ৩টি পাকা কলা রাখা হয়েছিল।',
      mni: 'খোংজেম্বদা সেব অমগা লোয়ননা চাফাবা চোম্প্রা ৩ থমখি।'
    }
  },
  {
    id: 'mm-007',
    difficulty: 6,
    levelTier: 'medium',
    durationSeconds: 12,
    category: 'sequence',
    cognitiveSkill: 'sequence',
    questionType: 'sequence-order',
    sceneType: 'reading_glasses',
    videoUrl: '/assets/videos/memory-motion/reading-glasses.mp4',
    posterUrl: '/assets/images/patient-ramesh.jpg',
    replayAllowed: true,
    maxReplays: 1,
    title: {
      en: 'Morning Newspaper Routine',
      hi: 'अखबार पढ़ने की सुबह',
      as: 'বাতৰি কাকত পঢ়াৰ পুৱা',
      bn: 'সকালের খবরের কাগজ পড়া',
      mni: 'অয়ূককী পৌচে পাপা'
    },
    description: {
      en: 'Putting on reading spectacles, opening the daily newspaper, and picking up a pencil to mark.',
      hi: 'चश्मा पहनकर अखबार खोला गया और पेंसिल से निशान लगाया।',
      as: 'চশমা পিন্ধি বাতৰি কাকত মেলি পেন্সিলেৰে দাগ দিয়া হ’ল।',
      bn: 'চশমা পরে খবরের কাগজ খুলে পেনসিল দিয়ে দাগ দেওয়া হলো।',
      mni: 'মিৎচশমা উপতুনা পৌচে পাখি।'
    },
    question: {
      en: 'Which action happened FIRST in the video clip?',
      hi: 'वीडियो में सबसे पहले क्या काम हुआ?',
      as: 'ভিডিঅ’টোত আটাইতকৈ প্ৰথমতে কি কাম হ’ল?',
      bn: 'ভিডিওটিতে সবার প্রথমে কোন কাজটি হয়েছিল?',
      mni: 'ভিডিও অসিদা অহানবদা করি তৌখিগে?'
    },
    options: [
      {
        id: 'opt-1',
        icon: '👓',
        text: {
          en: 'Put on reading spectacles from the case',
          hi: 'केस से निकाल कर पढ़ने का चश्मा पहना',
          as: 'খাপৰ পৰা চশমাযোৰ পিন্ধিলে',
          bn: 'খাপ থেকে চশমা বের করে পরলেন',
          mni: 'কেস অদুদগী মিৎচশমা লৌথোক্তুনা উপখি'
        },
        isCorrect: true
      },
      {
        id: 'opt-2',
        icon: '📰',
        text: {
          en: 'Folded the newspaper into half',
          hi: 'अखबार को आधा मोड़ा',
          as: 'বাতৰি কাকতখন ভাঁজ কৰিলে',
          bn: 'খবরের কাগজটি ভাঁজ করলেন',
          mni: 'পৌচে অদু তংখাইদা থংজিনখি'
        },
        isCorrect: false
      },
      {
        id: 'opt-3',
        icon: '✏️',
        text: {
          en: 'Sharpened the pencil with sharpener',
          hi: 'पेंसिल छीली',
          as: 'পেন্সিল কটাৰে কাটিলে',
          bn: 'পেনসিল শার্প করলেন',
          mni: 'পেন্সিল শেংখি'
        },
        isCorrect: false
      },
      {
        id: 'opt-4',
        icon: '☕',
        text: {
          en: 'Spilled tea on the wooden table',
          hi: 'मेज पर चाय गिराई',
          as: 'মেজত চাহ পেলালে',
          bn: 'টেবিলে চা ফেললেন',
          mni: 'চা পুংখ্রে'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'First, the elder took the spectacles out of the case and wore them before reading.',
      hi: 'सबसे पहले बुजुर्ग ने केस से चश्मा निकाल कर पहना था।',
      as: 'প্ৰথমতে ককাদেউতাই চশমাৰ খাপৰ পৰা চশমা উলিয়াই পিন্ধি লৈছিল।',
      bn: 'প্রথমে চশমার কেস থেকে চশমা বের করে পরেছিলেন।',
      mni: 'অহানবদা কেসতগী মিৎচশমা লৌথোক্তুনা উপখি।'
    }
  },
  {
    id: 'mm-008',
    difficulty: 7,
    levelTier: 'hard',
    durationSeconds: 14,
    category: 'attention',
    cognitiveSkill: 'sequence',
    questionType: 'sequence-order',
    sceneType: 'pond_birds',
    videoUrl: '/assets/videos/memory-motion/pond-birds.mp4',
    posterUrl: '/assets/images/hero-light.jpg',
    replayAllowed: false,
    maxReplays: 0,
    title: {
      en: 'Lakeside Heron & Kingfisher',
      hi: 'झील किनारे बगुला और किलकिला पक्षी',
      as: 'পুখুৰীৰ পাৰৰ বগলী আৰু মাছৰোকা',
      bn: 'পুকুর পাড়ে বক ও মাছরাঙা',
      mni: 'পাতকী তোবা অমসুং ঙালেকপা'
    },
    description: {
      en: 'By a calm lotus pond, a white crane lands softly on bamboo poles, followed by a blue kingfisher.',
      hi: 'शांत तालाब में पहले सफेद बगुला बैठा, फिर नीली किलकिला पक्षी आई।',
      as: 'পুখুৰীৰ বাঁহৰ খুঁটাত প্ৰথমে বগা বগলী বহিল, তাৰ পিছত মাছৰোকা উৰি আহিল।',
      bn: 'শান্ত পুকুরের বাঁশের খুঁটিতে প্রথমে সাদা বক বসল, তারপর মাছরাঙা এল।',
      mni: 'পাতকী ৱাকু অমদা অঙৌবা তোবা হন্না তাখি, মতুংদা ঙালেকপা তাখি।'
    },
    question: {
      en: 'Which bird arrived at the pond pole FIRST, before the others?',
      hi: 'दूसरों से पहले, सबसे पहले कौन सा पक्षी बाँस पर आकर बैठा?',
      as: 'আনবোৰৰ আগত, বাঁহৰ খুঁটাত আটাইতকৈ প্ৰথমতে কোনটো চৰাই বহিল?',
      bn: 'অন্যদের আগে, বাঁশের খুঁটিতে সবার প্রথমে কোন পাখিটি এসে বসল?',
      mni: 'অতৈগী মাংঙোইদা, অহানবদা করম্বা উচেক অদু তাখিগে?'
    },
    options: [
      {
        id: 'opt-1',
        icon: '🦩',
        text: {
          en: 'The Graceful White Heron / Crane',
          hi: 'सफेद शांत बगुला',
          as: 'শান্ত ধুনীয়া বগা বগলী',
          bn: 'শান্ত সুন্দর সাদা বক',
          mni: 'অঙৌবা শান্ত তোবা'
        },
        isCorrect: true
      },
      {
        id: 'opt-2',
        icon: '🐦',
        text: {
          en: 'The Little Blue Kingfisher',
          hi: 'नीली छोटी किलकिला पक्षी',
          as: 'নীলা মাছৰোকা চৰাই',
          bn: 'নীল মাছরাঙা পাখি',
          mni: 'নীলা ঙালেকপা'
        },
        isCorrect: false
      },
      {
        id: 'opt-3',
        icon: '🦆',
        text: {
          en: 'A Brown Wild Teal Duck',
          hi: 'भूरे रंग की बत्तख',
          as: 'বাদামী বনৰীয়া হাঁহ',
          bn: 'বাদামী বুনো হাঁস',
          mni: 'ঙানু'
        },
        isCorrect: false
      },
      {
        id: 'opt-4',
        icon: '🦅',
        text: {
          en: 'A Large Flying Eagle',
          hi: 'बड़ा उड़ता हुआ चील',
          as: 'উৰি থকা ডাঙৰ চিলনী',
          bn: 'উড়ন্ত বড় চিল',
          mni: 'উমাংগী মুইবি'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The tall white heron landed gracefully on the bamboo pole first, followed moments later by the kingfisher.',
      hi: 'सफेद बगुला सबसे पहले बाँस पर उतरा था, उसके बाद छोटी किलकिला आई थी।',
      as: 'বগা বগলীটোৱে প্ৰথমে বাঁহৰ খুঁটাত বহিছিল, তাৰ কিছু সময় পিছত মাছৰোকাটো আহিল।',
      bn: 'সাদা বকটি প্রথমে বাঁশের খুঁটিতে এসে বসেছিল, তারপর মাছরাঙা এল।',
      mni: 'অঙৌবা তোবা অদু অহানবদা তাখি, মতুংদা ঙালেকপা তাখি।'
    }
  },
  {
    id: 'mm-009',
    difficulty: 8,
    levelTier: 'hard',
    durationSeconds: 15,
    category: 'sequence',
    cognitiveSkill: 'sequence',
    questionType: 'sequence-order',
    sceneType: 'paan_folding',
    videoUrl: '/assets/videos/memory-motion/paan-folding.mp4',
    posterUrl: '/assets/images/role-caregiver.jpg',
    replayAllowed: false,
    maxReplays: 0,
    title: {
      en: 'Traditional Tamul-Paan Offering',
      hi: 'पारंपरिक ताम्बूल-पान तैयार करना',
      as: 'তামোল-পান সজোৱা পৰম্পৰা',
      bn: 'ঐতিহ্যবাহী পান সাজানো',
      mni: 'তাম্বুল পান শেম্বা'
    },
    description: {
      en: 'Preparing a traditional guest offering: washing the betel leaf, adding chuna, placing sliced areca nut, and folding.',
      hi: 'मेहमानों के लिए पान का पत्ता धोकर चूना, सुपारी रख कर मोड़ा गया।',
      as: 'অতিথিক যাচিবলৈ পান পাত ধুই চূণ আৰু তামোল দি সুন্দৰকৈ ভাঁজ কৰা হৈছে।',
      bn: 'অতিথির জন্য পান ধুয়ে চুন ও সুপারি দিয়ে ভাঁজ করা হলো।',
      mni: 'পান পাতা শেংদোক্তুনা তাম্বুল পান শেম্লি।'
    },
    question: {
      en: 'What ingredient was placed onto the leaf AFTER the white lime paste (chuna)?',
      hi: 'सफेद चूना लगाने के बाद पत्ते पर क्या रखा गया?',
      as: 'বগা চূণ লগোৱাৰ ঠিক পিছত পান পাতত কি দিয়া হ’ল?',
      bn: 'সাদা চুন লাগানোর ঠিক পরে পানের ওপর কী দেওয়া হয়েছিল?',
      mni: 'অঙৌবা চুন হাপ্লবা মতুংদা করি হাপখিগে?'
    },
    options: [
      {
        id: 'opt-1',
        icon: '🌰',
        text: {
          en: 'Thinly sliced fresh betel nut (Tamul)',
          hi: 'बारीक कटी सुपारी (ताम्बूल)',
          as: 'মিহিকৈ কটা কেঁচা তামোল',
          bn: 'কুচানো সুপারি (তাম্বুল)',
          mni: 'অতেংবা কুপ্না শেম্বা কুবা'
        },
        isCorrect: true
      },
      {
        id: 'opt-2',
        icon: '🧂',
        text: {
          en: 'A pinch of table salt',
          hi: 'सफेद नमक',
          as: 'নিমখ',
          bn: 'এক চিমটে নুন',
          mni: 'থুম'
        },
        isCorrect: false
      },
      {
        id: 'opt-3',
        icon: '🧄',
        text: {
          en: 'Crushed garlic cloves',
          hi: 'लहसुन',
          as: 'নহৰু',
          bn: 'রসুন',
          mni: 'চনম'
        },
        isCorrect: false
      },
      {
        id: 'opt-4',
        icon: '🍬',
        text: {
          en: 'Sweet sugar candy crystals',
          hi: 'मिश्री के दाने',
          as: 'মিচিৰিৰ দানা',
          bn: 'মিছরির দানা',
          mni: 'চিনি'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'Immediately after spreading a touch of white lime paste, the sliced fresh areca nut was placed on the leaf.',
      hi: 'सफेद चूना लगाने के तुरंत बाद बारीक कटी सुपारी पत्ते पर रखी गई थी।',
      as: 'চকা চুন লগোৱাৰ ঠিক পিছতে মিহিকৈ কাটি থোৱা কেঁচা তামোল দিয়া হৈছিল।',
      bn: 'সাদা চুন দেওয়ার পরপরই কুচানো তাজা সুপারি পানের ওপর রাখা হয়েছিল।',
      mni: 'চুন হাপ্লবা মতুংদা কুপ্না শেম্বা কুবা হাপখি।'
    }
  },
  {
    id: 'mm-010',
    difficulty: 9,
    levelTier: 'advanced',
    durationSeconds: 16,
    category: 'attention',
    cognitiveSkill: 'working-memory',
    questionType: 'detail-count',
    sceneType: 'temple_bell',
    videoUrl: '/assets/videos/memory-motion/temple-bell.mp4',
    posterUrl: '/assets/images/auth-clinician.jpg',
    replayAllowed: false,
    maxReplays: 0,
    title: {
      en: 'Temple Bell Resonance',
      hi: 'मंदिर की घंटी की गूँज',
      as: 'মন্দিৰৰ কাঁহৰ ঘণ্টাৰ গুঞ্জন',
      bn: 'মন্দিরের কাঁসার ঘণ্টার ধ্বনি',
      mni: 'লাইশংগী ঘণ্টা'
    },
    description: {
      en: 'Ringing the heavy brass temple bell with clear pauses, counting distinct acoustic chimes.',
      hi: 'मंदिर की पीतल की घंटी को ध्यान से बजाया जा रहा है।',
      as: 'মন্দিৰৰ কাঁহৰ গধুৰ ঘণ্টা স্পষ্ট বিৰতিত কেইবাবাৰো কোবোৱা হৈছে।',
      bn: 'মন্দিরের ভারী কাঁসার ঘণ্টা স্পষ্ট বিরতিতে বাজানো হচ্ছে।',
      mni: 'লাইশংগী পিত্তলগী ঘণ্টা অদু কয়ারক খুংখিগে তাবা।'
    },
    question: {
      en: 'How many distinct times did the person ring the heavy brass bell?',
      hi: 'व्यक्ति ने पीतल की घंटी को स्पष्ट रूप से कितनी बार बजाया?',
      as: 'মানুহজনে পিতলৰ ঘণ্টাটি স্পষ্টভাৱে মুঠতে কেইবাৰ কোবালে?',
      bn: 'ব্যক্তিটি কাঁসার ঘণ্টাটি স্পষ্টভাবে মোট কতবার বাজিয়েছিলেন?',
      mni: 'মীওই অদুগী ঘণ্টা অদু ময়েং তানা কয়ারক খুংখিগে?'
    },
    options: [
      {
        id: 'opt-1',
        icon: '🔔',
        text: {
          en: 'Exactly 3 Reverberant Strikes',
          hi: 'ठीक ३ बार गूँजती आवाज़',
          as: 'ঠিক ৩ বাৰ স্পষ্ট কোব',
          bn: 'ঠিক ৩ বার ঘণ্টার ধ্বনি',
          mni: 'মচেৎ ৩ রক ঘণ্টা খুংখি'
        },
        isCorrect: true
      },
      {
        id: 'opt-2',
        icon: '🔔',
        text: {
          en: 'Only 1 Single Strike',
          hi: 'सिर्फ १ बार',
          as: 'কেৱল ১ বাৰ',
          bn: 'মাত্র ১ বার',
          mni: 'অমারকখক'
        },
        isCorrect: false
      },
      {
        id: 'opt-3',
        icon: '🔔',
        text: {
          en: '5 Continuous Strikes',
          hi: '५ बार लगातार',
          as: '৫ বাৰ একেৰাহে',
          bn: '৫ বার একটানা',
          mni: 'মচেৎ ৫ রক'
        },
        isCorrect: false
      },
      {
        id: 'opt-4',
        icon: '🔔',
        text: {
          en: '7 Fast Strikes',
          hi: '७ बार तेज़ी से',
          as: '৭ বাৰ খৰকৈ',
          bn: '৭ বার দ্রুত',
          mni: 'মচেৎ ৭ রক'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The devotee struck the resonant temple bell exactly 3 times with clear pauses between each chime.',
      hi: 'भक्त ने मंदिर की घंटी को ठीक ३ बार स्पष्ट ठहराव के साथ बजाया था।',
      as: 'ভক্তজনে মন্দিৰৰ ঘণ্টাটি ঠিক ৩ বাৰ ধীৰে ধীৰে সুন্দৰকৈ কোবাইছিল।',
      bn: 'ভক্তটি মন্দিরের ঘণ্টাটি স্পষ্টভাবে ঠিক ৩ বার বাজিয়েছিলেন।',
      mni: 'ঘণ্টা অদু তোঙান তোঙান্না মচেৎ ৩ রক খুংখি।'
    }
  },
  {
    id: 'mm-011',
    difficulty: 10,
    levelTier: 'advanced',
    durationSeconds: 18,
    category: 'working-memory',
    cognitiveSkill: 'working-memory',
    questionType: 'detail-count',
    sceneType: 'market_basket',
    videoUrl: '/assets/videos/memory-motion/market-basket.mp4',
    posterUrl: '/assets/images/companion-dark.jpg',
    replayAllowed: false,
    maxReplays: 0,
    title: {
      en: 'Weekly Village Haat Basket',
      hi: 'साप्ताहिक हाट की टोकरी',
      as: 'সাপ্তাহিক গাঁৱৰ হাটৰ খৰাহী',
      bn: 'সাপ্তাহিক গ্রামীণ হাটের ঝুড়ি',
      mni: 'য়ুমথোং কৈথেলগী পৈলা'
    },
    description: {
      en: 'At the village weekly market, packing purple brinjals, green bottle gourd, and red tomatoes, then counting coins.',
      hi: 'सब्जी मंडी में बैंगन, लौकी और टमाटर थैले में रखकर सिक्के गिने गए।',
      as: 'গাঁৱৰ হাটত বেঙেনা, লাউ আৰু বিলাহী খৰাহীত ভৰাই মুদ্ৰা হিচাপ কৰা হ’ল।',
      bn: 'গ্রামের হাটে বেগুন, লাউ ও টমেটো ঝুড়িতে ভরে কয়েন গোনা হলো।',
      mni: 'কৈথেলদা খোম্বা বেঙেনা, লৌ অমসুং তোমাতো পৈলাদা হাপতুনা শেল কান্দা।'
    },
    question: {
      en: 'Which vegetable was placed into the woven basket LAST, right before the coins?',
      hi: 'सिक्के गिनने से ठीक पहले, टोकरी में सबसे आखिर में कौन सी सब्जी रखी गई?',
      as: 'মুদ্ৰা হিচাপ কৰাৰ ঠিক আগতে, খৰাহীত সকলোতকৈ শেষত কি শাক-পাচলি ভৰোৱা হৈছিল?',
      bn: 'কয়েন গোনার ঠিক আগে, ঝুড়িতে সবার শেষে কোন সবজিটি রাখা হয়েছিল?',
      mni: 'শেল কান্দ্রিঙৈ মমাংদা, পৈলাদা খ্বাইদগী অরোইবদা হাপখিবা মনা-মশিং করম্বনো?'
    },
    options: [
      {
        id: 'opt-1',
        icon: '🍅',
        text: {
          en: 'Two Bright Red Tomatoes',
          hi: 'दो लाल पके टमाटर',
          as: 'দুটা ৰঙা পকা বিলাহী',
          bn: 'দুটি লাল পাকা টমেটো',
          mni: 'অঙাংবা তোমাতো অনী'
        },
        isCorrect: true
      },
      {
        id: 'opt-2',
        icon: '🍆',
        text: {
          en: 'A Long Purple Brinjal / Eggplant',
          hi: 'एक लंबा बैंगनी बैंगन',
          as: 'এটা দীঘল বেঙুনীয়া বেঙেনা',
          bn: 'একটি লম্বা বেগুন',
          mni: 'অশাংবা বেঙেনা অমখক'
        },
        isCorrect: false
      },
      {
        id: 'opt-3',
        icon: '🥒',
        text: {
          en: 'A Pale Green Bottle Gourd (Lau)',
          hi: 'एक हरी लौकी',
          as: 'এটা জাতি লাউ',
          bn: 'একটি সবুজ লাউ',
          mni: 'অশেংবা লৌ অমখক'
        },
        isCorrect: false
      },
      {
        id: 'opt-4',
        icon: '🥔',
        text: {
          en: 'A Sack of Fresh Potatoes',
          hi: 'आलू की पोटली',
          as: 'আলুৰ টোপোলা',
          bn: 'আলুর পোটলা',
          mni: 'আলুগী পোট'
        },
        isCorrect: false
      }
    ],
    correctAnswerIndex: 0,
    explanation: {
      en: 'The brinjal and gourd went in first; the two red tomatoes were placed carefully on top last before handling coins.',
      hi: 'बैंगन और लौकी पहले रखे गए थे; सिक्के निकालने से पहले सबसे अंत में दो टमाटर रखे गए।',
      as: 'বেঙেনা আৰু লাউ প্ৰথমে ভৰোৱা হৈছিল; মুদ্ৰা ওলোৱাৰ আগে আগে শেষত দুটা ৰঙা বিলাহী সাৱধানে ওপৰত থোৱা হৈছিল।',
      bn: 'বেগুন এবং লাউ প্রথমে রাখা হয়েছিল; কয়েন গোনার ঠিক আগে সবার শেষে দুটি লাল টমেটো উপরে রাখা হয়েছিল।',
      mni: 'বেঙেনা অমসুং লৌ অহানবদা হাপখি, অরোইবদা তোমাতো অনী মথক্তা হাপখি।'
    }
  }
];

export function getChallengeById(id) {
  return MEMORY_MOTION_CHALLENGES.find(c => c.id === id);
}

export function getChallengesForLevel(level) {
  const target = Math.max(1, Math.min(10, Math.round(level)));
  return MEMORY_MOTION_CHALLENGES.filter(c => Math.abs(c.difficulty - target) <= 1.5);
}

export const memoryMotionChallenges = MEMORY_MOTION_CHALLENGES;

export default MEMORY_MOTION_CHALLENGES;

