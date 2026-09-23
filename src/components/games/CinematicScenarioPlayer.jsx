import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * SCENARIO SHOT DEFINITIONS FOR "MORNING IN THE KITCHEN"
 * Grounded in authentic objects: 3 red apples, 2 oranges, 1 red cup, 1 clear pitcher, The Daily Times newspaper, keys.
 */
export const KITCHEN_SHOTS = [
  {
    id: 1,
    startSec: 0.0,
    endSec: 1.8,
    label: {
      en: 'Enters kitchen',
      hi: 'रसोई में प्रवेश किया',
      as: 'পাকঘৰলৈ সোমাই আহিল',
      bn: 'রান্নাঘরে প্রবেশ করলেন',
      mni: 'চাকখুমদা চঙলকখি'
    },
    caption: {
      en: 'The elder walks warmly into the sunlit morning kitchen.',
      hi: 'बुजुर्ग सुबह की धूप वाली रसोई में आते हैं।',
      as: 'আইতা ৰাতিপুৱাৰ পোহৰ থকা পাকঘৰলৈ সোমাই আহিছে।',
      bn: 'ব্যক্তিটি শান্তভাবে সকালের রান্নাঘরে প্রবেশ করলেন।',
      mni: 'অয়ূককী চাকখুমদা নুংঙাইনা চঙলকখি।'
    },
    image: '/assets/images/cognitive/kitchen_shot_1.jpg',
    thumbnail: '/assets/images/cognitive/shot_1_enters_kitchen.jpg'
  },
  {
    id: 2,
    startSec: 1.8,
    endSec: 3.8,
    label: {
      en: 'Notices fruits & items',
      hi: 'फल और वस्तुएं देखीं',
      as: 'ফল আৰু বস্তুবোৰ লক্ষ্য কৰিলে',
      bn: 'ফল ও জিনিসপত্র দেখলেন',
      mni: 'হৈশিং অমসুং পোৎলমশিং য়েংখি'
    },
    caption: {
      en: 'On the counter: a wooden bowl with 3 red apples and 2 oranges, a red cup, newspaper, and keys.',
      hi: 'काउंटर पर: 3 सेब और 2 संतरे, एक लाल कप, अखबार और चाबियां।',
      as: 'কাউন্টাৰত: ৩টা ৰঙা আপেল, ২টা কমলা, ৰঙা কাপ, বাতৰি কাকত আৰু চাবি।',
      bn: 'কাউন্টারে: ৩টি লাল আপেল, ২টি কমলালেবু, লাল কাপ, খবরের কাগজ ও চাবি।',
      mni: 'কাউন্তৰদা: সেব ৩, কোমোলা ২, অঙাংবা খাপ, পাউচে অমসুং চাবি।'
    },
    image: '/assets/images/cognitive/kitchen_shot_2.jpg',
    thumbnail: '/assets/images/cognitive/shot_2_notices_fruits.jpg'
  },
  {
    id: 3,
    startSec: 3.8,
    endSec: 5.6,
    label: {
      en: 'Picks up red cup',
      hi: 'लाल कप उठाया',
      as: 'ৰঙা কাপটো তুলি ল’লে',
      bn: 'লাল কাপটি তুললেন',
      mni: 'অঙাংবা খাপ লৌখৎখি'
    },
    caption: {
      en: 'She reaches forward and picks up the bright red ceramic cup from the counter.',
      hi: 'वह आगे बढ़कर काउंटर से चमकदार लाल कप उठाती हैं।',
      as: 'তেখেতে কাউন্টাৰৰ পৰা উজ্বল ৰঙা কাপটো তুলি ল’লে।',
      bn: 'তিনি হাত বাড়িয়ে কাউন্টার থেকে উজ্জ্বল লাল কাপটি তুললেন।',
      mni: 'মহাক্না কাউন্তৰদগী অঙাংবা খাপ অদু লৌখৎখি।'
    },
    image: '/assets/images/cognitive/kitchen_shot_3.jpg',
    thumbnail: '/assets/images/cognitive/shot_3_picks_cup.jpg'
  },
  {
    id: 4,
    startSec: 5.6,
    endSec: 7.2,
    label: {
      en: 'Fills cup with water',
      hi: 'कप में पानी भरा',
      as: 'কাপত পানী ভৰালে',
      bn: 'কাপে জল ভরলেন',
      mni: 'খাপতা ঈশিং হাপখি'
    },
    caption: {
      en: 'She pours fresh water from the clear glass pitcher into her red cup.',
      hi: 'वह कांच के जग से लाल कप में ताजा पानी डालती हैं।',
      as: 'তেখেতে কাঁচৰ জগৰ পৰা ৰঙা কাপত পানী ঢালিলে।',
      bn: 'তিনি কাচের জগ থেকে লাল কাপে জল ঢাললেন।',
      mni: 'মহাক্না গ্লাসকী জগদগী খাপতা ঈশিং হাপখি।'
    },
    image: '/assets/images/cognitive/kitchen_shot_4.jpg',
    thumbnail: '/assets/images/cognitive/shot_4_fills_water.jpg'
  },
  {
    id: 5,
    startSec: 7.2,
    endSec: 8.8,
    label: {
      en: 'Places cup on table',
      hi: 'कप मेज पर रखा',
      as: 'কাপটো মেজত থলে',
      bn: 'কাপটি টেবিলে রাখলেন',
      mni: 'খাপ অদু মেজদা থমখি'
    },
    caption: {
      en: 'She gently sets the red cup down beside The Daily Times newspaper and keys.',
      hi: 'वह लाल कप को अखबार और चाबियों के पास रख देती हैं।',
      as: 'তেখেতে ৰঙা কাপটো বাতৰি কাকত আৰু চাবিৰ কাষত থ’লে।',
      bn: 'তিনি লাল কাপটি খবরের কাগজ ও চাবির পাশে রাখলেন।',
      mni: 'মহাক্না খাপ অদু পাউচে অমসুং চাবিগী নক্ননা থমখি।'
    },
    image: '/assets/images/cognitive/kitchen_shot_5.jpg',
    thumbnail: '/assets/images/cognitive/shot_5_places_cup.jpg'
  },
  {
    id: 6,
    startSec: 8.8,
    endSec: 10.0,
    label: {
      en: 'Sits on chair',
      hi: 'कुर्सी पर बैठ गईं',
      as: 'চকীত বহিল',
      bn: 'চেয়ারে বসলেন',
      mni: 'চৌকিদা ফমখি'
    },
    caption: {
      en: 'She sits down comfortably on the wooden chair by the window, holding her cup.',
      hi: 'वह खिड़की के पास कुर्सी पर बैठकर मुस्कुराती हैं।',
      as: 'তেখেতে খিৰিকীৰ কাষৰ চকীত বহি শান্তভাৱে হাঁহিলে।',
      bn: 'তিনি জানলার পাশের চেয়ারে শান্তভাবে বসলেন।',
      mni: 'মহাক্না থোংনাওগী নক্নবা চৌকিদা ফমদুনা নোক্তোকখি।'
    },
    image: '/assets/images/cognitive/kitchen_shot_6.jpg',
    thumbnail: '/assets/images/cognitive/shot_6_sits_chair.jpg'
  }
];

export default function CinematicScenarioPlayer({
  shots = KITCHEN_SHOTS,
  durationSeconds = 10,
  onVideoEnded = () => {},
  replaysRemaining = 2,
  onReplayUsed = () => {},
  autoPlay = true
}) {
  const { t, language } = useLanguage();

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);

  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimestampRef = useRef(null);

  const activeShotsList = (shots && shots.length > 0) ? shots : KITCHEN_SHOTS;
  const totalDuration = durationSeconds || 10;

  // Determine active shot based on currentTimeSec
  const currentShotIndex = Math.min(
    activeShotsList.length - 1,
    Math.max(0, activeShotsList.findIndex(s => currentTimeSec >= s.startSec && currentTimeSec < s.endSec))
  );
  const activeShot = activeShotsList[currentShotIndex !== -1 ? currentShotIndex : 0];

  // Helper for localized text
  const getLocalized = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en || '';
  };

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying || isEnded) return;

    const step = (timestamp) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const deltaSec = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      setCurrentTimeSec((prev) => {
        const nextTime = prev + deltaSec;
        if (nextTime >= totalDuration) {
          setIsPlaying(false);
          setIsEnded(true);
          onVideoEnded();
          return totalDuration;
        }
        return nextTime;
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimestampRef.current = null;
    };
  }, [isPlaying, isEnded, totalDuration, onVideoEnded]);

  // Controls
  const togglePlay = () => {
    if (isEnded) {
      handleReplay();
      return;
    }
    lastTimestampRef.current = null;
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSec = pct * totalDuration;
    setCurrentTimeSec(targetSec);
    setIsEnded(false);
    lastTimestampRef.current = null;
  };

  const handleShotClick = (shot) => {
    setCurrentTimeSec(shot.startSec);
    setIsEnded(false);
    lastTimestampRef.current = null;
    if (!isPlaying) setIsPlaying(true);
  };

  const handleReplay = () => {
    if (replaysRemaining <= 0 && isEnded) return;
    setCurrentTimeSec(0);
    setIsEnded(false);
    setIsPlaying(true);
    lastTimestampRef.current = null;
    onReplayUsed();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Format time MM:SS
  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = Math.min(100, (currentTimeSec / totalDuration) * 100);

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* 1. Large 16:9 Cinematic Video Display */}
      <div className="relative aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-2xl group select-none">
        
        {/* Active Shot Visual Scene with smooth cinematic Ken Burns motion */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {activeShotsList.map((shot, idx) => {
            const isCurrent = idx === currentShotIndex;
            return (
              <motion.div
                key={shot.id}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isCurrent ? 1 : 0,
                  scale: isCurrent ? 1.05 : 1.0
                }}
                transition={{
                  opacity: { duration: 0.6, ease: 'easeInOut' },
                  scale: { duration: (shot.endSec - shot.startSec) * 1.5, ease: 'linear' }
                }}
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: isCurrent ? 'auto' : 'none' }}
              >
                <img
                  src={shot.image}
                  alt={getLocalized(shot.label)}
                  className="w-full h-full object-cover object-center transform scale-105"
                  loading="eager"
                  decoding="sync"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
              </motion.div>
            );
          })}
        </div>

        {/* Live Subtitles Bar */}
        {showCaptions && activeShot && (
          <div className="absolute bottom-16 left-0 right-0 px-6 text-center pointer-events-none z-20">
            <motion.div
              key={activeShot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="inline-block px-5 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 text-white font-semibold text-sm md:text-base max-w-xl shadow-lg"
            >
              {getLocalized(activeShot.caption)}
            </motion.div>
          </div>
        )}

        {/* Big Center Play/Replay Overlay when paused or ended */}
        {(!isPlaying || isEnded) && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center cursor-pointer z-30 transition-all"
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="w-20 h-20 rounded-full bg-blue-600/95 text-white flex items-center justify-center shadow-2xl border-2 border-white/40 cursor-pointer"
            >
              {isEnded ? (
                <RotateCcw className="w-10 h-10 ml-0" />
              ) : (
                <Play className="w-10 h-10 ml-1.5" />
              )}
            </motion.button>
          </div>
        )}

        {/* Video Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center gap-3 z-30">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Time Display */}
          <span className="text-xs md:text-sm font-mono font-bold text-white/90 shrink-0 min-w-[76px]">
            {formatTime(currentTimeSec)} / {formatTime(totalDuration)}
          </span>

          {/* Blue Scrubber Slider */}
          <div
            onClick={handleSeek}
            className="relative flex-1 h-2.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer py-1 group/slider"
          >
            <div
              className="h-full bg-blue-500 rounded-full relative transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Scrubber Knob */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-md border border-blue-600 scale-100 group-hover/slider:scale-125 transition-transform" />
            </div>
          </div>

          {/* Replay Counter Badge */}
          {replaysRemaining !== undefined && (
            <button
              type="button"
              onClick={handleReplay}
              disabled={replaysRemaining <= 0}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                replaysRemaining > 0
                  ? 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                  : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
              }`}
              title="Replay Video"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{replaysRemaining} {t('games.memorymotion.replaysLeft') || 'Replays Left'}</span>
            </button>
          )}

          {/* Volume / Mute */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Scene / Event Timeline Filmstrip (6 Horizontal Shots directly matching the scenario) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5 pt-1">
        {activeShotsList.map((shot, idx) => {
          const isCurrent = idx === currentShotIndex;
          const isPast = currentTimeSec >= shot.endSec;

          return (
            <button
              key={shot.id}
              type="button"
              onClick={() => handleShotClick(shot)}
              className={`group relative rounded-xl sm:rounded-2xl overflow-hidden border-2 text-left transition-all cursor-pointer flex flex-col p-1 bg-slate-900 shadow-md ${
                isCurrent
                  ? 'border-cyan-400 dark:border-cyan-400 ring-2 ring-cyan-400/40 shadow-cyan-500/20 scale-[1.02]'
                  : isPast
                  ? 'border-slate-700/80 hover:border-slate-500 opacity-90'
                  : 'border-slate-800 hover:border-slate-600 opacity-70'
              }`}
            >
              {/* Thumbnail Frame */}
              <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-slate-950">
                <img
                  src={shot.image || shot.thumbnail}
                  alt={getLocalized(shot.label)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                
                {/* Active Glowing Highlight Badge */}
                {isCurrent && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-300 animate-pulse" />
                )}

                {/* Number Badge */}
                <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md text-[10px] font-black leading-none ${
                  isCurrent
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-black/75 text-white/90'
                }`}>
                  {shot.id}
                </div>
              </div>

              {/* Label */}
              <div className="p-1 px-1.5">
                <span className={`text-[11px] sm:text-[12px] font-bold block truncate leading-tight ${
                  isCurrent ? 'text-cyan-300' : 'text-slate-300'
                }`}>
                  {getLocalized(shot.label)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
