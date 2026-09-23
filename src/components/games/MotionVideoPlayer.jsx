import React from 'react';
import HTML5CognitiveVideoPlayer from './HTML5CognitiveVideoPlayer';

/**
 * MotionVideoPlayer
 * 
 * Video-first cognitive activity player powered by native HTML5 Video Engine.
 * Plays authentic continuous MP4/WebM video scenarios with audio, scrubber seeking,
 * replay support, and interactive timeline synchronization.
 */
export default function MotionVideoPlayer({
  challenge,
  onVideoEnded,
  replaysRemaining = 2,
  onReplayUsed,
  autoPlay = true
}) {
  return (
    <HTML5CognitiveVideoPlayer
      challenge={challenge}
      onVideoEnded={onVideoEnded}
      replaysRemaining={replaysRemaining}
      onReplayUsed={onReplayUsed}
      autoPlay={autoPlay}
    />
  );
}
