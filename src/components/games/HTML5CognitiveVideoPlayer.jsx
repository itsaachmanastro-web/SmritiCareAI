import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
  Sparkles,
  Eye
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getScenarioVideo } from '../../services/games/CognitiveVideoService.js';

export default function HTML5CognitiveVideoPlayer({
  challenge,
  onVideoEnded = () => {},
  replaysRemaining = 2,
  onReplayUsed = () => {},
  autoPlay = true
}) {
  const { t, language } = useLanguage();

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const scenario = getScenarioVideo(challenge);
  const shots = scenario?.shots || [];

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [duration, setDuration] = useState(scenario.durationSeconds || 12);
  const [isEnded, setIsEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determine active shot index from real video currentTime
  const currentShotIndex = Math.min(
    shots.length - 1,
    Math.max(0, shots.findIndex(s => currentTimeSec >= s.startSec && currentTimeSec < s.endSec))
  );
  const activeShot = shots[currentShotIndex !== -1 ? currentShotIndex : 0];

  // Helper for localized text
  const getLocalized = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en || '';
  };

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (dur && !isNaN(dur) && dur > 0) {
        setDuration(dur);
      }
      setIsLoading(false);
      setHasError(false);

      if (autoPlay) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Autoplay prevented by browser:', err);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTimeSec(videoRef.current.currentTime);
      if (isLoading) setIsLoading(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
    onVideoEnded();
  };

  const handleError = () => {
    console.warn('Video failed to load from primary source, checking fallback...');
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  // User controls
  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isEnded) {
      handleReplay();
      return;
    }

    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.warn);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSec = pct * duration;

    videoRef.current.currentTime = targetSec;
    setCurrentTimeSec(targetSec);
    setIsEnded(false);
  };

  const handleShotClick = (shot) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = shot.startSec;
    setCurrentTimeSec(shot.startSec);
    setIsEnded(false);
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
    }
  };

  const handleReplay = () => {
    if (!videoRef.current) return;
    if (replaysRemaining <= 0 && isEnded) return;

    videoRef.current.currentTime = 0;
    setCurrentTimeSec(0);
    setIsEnded(false);
    videoRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(console.warn);

    onReplayUsed();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
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

  // Time format MM:SS
  const formatTime = (sec) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = Math.min(100, (currentTimeSec / (duration || 1)) * 100);

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* 1. HTML5 Native Video Player Display */}
      <div className="relative aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-2xl group select-none">
        
        {/* Actual Video Tag */}
        <video
          ref={videoRef}
          poster={scenario.poster}
          playsInline
          preload="auto"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onError={handleError}
          className="w-full h-full object-cover"
        >
          <source src={scenario.videoMp4} type="video/mp4" />
          <source src={scenario.videoWebm} type="video/webm" />
          Your browser does not support the video tag.
        </video>

        {/* Loading Buffer Overlay */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20 pointer-events-none text-white">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <span className="text-sm font-bold text-slate-200">
              {t('games.memorymotion.preparingActivity') || 'Preparing your memory activity...'}
            </span>
          </div>
        )}

        {/* Error Fallback with Retry */}
        {hasError && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-4 z-25 p-6 text-center text-white">
            <AlertCircle className="w-12 h-12 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold">
                {t('games.memorymotion.videoLoadError') || 'Video could not be loaded.'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Please click below to reload the cognitive video scenario.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm text-white shadow-lg cursor-pointer transition-colors"
            >
              {t('common.retry') || 'Retry'}
            </button>
          </div>
        )}

        {/* Big Center Play/Replay Overlay when paused or ended */}
        {(!isPlaying || isEnded) && !isLoading && !hasError && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center cursor-pointer z-20 transition-all"
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="w-20 h-20 rounded-full bg-blue-600/95 text-white flex items-center justify-center shadow-2xl border-2 border-white/40 cursor-pointer"
            >
              {isEnded ? (
                <RotateCcw className="w-10 h-10" />
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
            {formatTime(currentTimeSec)} / {formatTime(duration)}
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
            onClick={toggleMute}
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

      {/* 2. Scene / Event Timeline Filmstrip (Directly tracking real video playback) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5 pt-1">
        {shots.map((shot, idx) => {
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
                  src={shot.thumbnail}
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
