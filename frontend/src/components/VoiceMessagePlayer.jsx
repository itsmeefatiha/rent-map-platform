import React, { useState, useRef, useEffect } from 'react';

export const VoiceMessagePlayer = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate waveform bars (simulated - in production, you'd analyze the audio)
  const generateWaveform = () => {
    const bars = 20;
    const heights = [];
    for (let i = 0; i < bars; i++) {
      // Random heights for visualization (in production, use actual audio analysis)
      heights.push(Math.random() * 40 + 10);
    }
    return heights;
  };

  const [waveformHeights] = useState(generateWaveform());

  return (
    <div className="flex items-center space-x-3 px-4 py-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-9 h-9 rounded-full bg-black hover:bg-gray-900 flex items-center justify-center transition-colors shadow-sm"
      >
        {isPlaying ? (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Waveform Visualization */}
      <div className="flex items-end space-x-1.5 h-12 flex-1 min-w-0">
        {waveformHeights.map((height, index) => {
          const isActive = isPlaying && audioDuration > 0 && index < (currentTime / audioDuration) * waveformHeights.length;
          return (
            <div
              key={index}
              className="w-1.5 bg-black rounded-full transition-all duration-200"
              style={{
                height: `${height}%`,
                minHeight: '6px',
                maxHeight: '32px',
                opacity: isActive ? 1 : 0.5
              }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span className="text-xs text-gray-700 dark:text-gray-300 font-medium flex-shrink-0 min-w-[2.5rem] text-right">
        {formatTime(audioDuration || currentTime)}
      </span>
    </div>
  );
};

