import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume1, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import type { IssueSegment } from '../contexts/AppContext';

const SEGMENT_COLOR: Record<IssueSegment['type'], string> = {
  voice: 'bg-red-500',
  posture: 'bg-orange-500',
};

interface VideoPlayerProps {
  videoUrl: string;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  className?: string;
  issueSegments?: IssueSegment[];
}

export function VideoPlayer({ videoUrl, currentTime, onTimeUpdate, className, issueSegments = [] }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [internalTime, setInternalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverIssue, setHoverIssue] = useState<IssueSegment | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const prevVolumeRef = useRef(1);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'seek-back' | 'seek-forward'; animKey: number } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setInternalTime(time);
      onTimeUpdate?.(time);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      console.log("비디오 로드됨 - Duration:", video.duration);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
    };
  }, [onTimeUpdate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-5);
          showFeedback('seek-back');
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(5);
          showFeedback('seek-forward');
          break;
        case 'ArrowUp': {
          e.preventDefault();
          const videoUp = videoRef.current;
          if (!videoUp) break;
          const newVol = Math.min(1, parseFloat((videoUp.volume + 0.1).toFixed(1)));
          videoUp.volume = newVol;
          videoUp.muted = false;
          setVolume(newVol);
          setIsMuted(false);
          if (newVol > 0) prevVolumeRef.current = newVol;
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const videoDown = videoRef.current;
          if (!videoDown) break;
          const newVol = Math.max(0, parseFloat((videoDown.volume - 0.1).toFixed(1)));
          videoDown.volume = newVol;
          videoDown.muted = newVol === 0;
          setVolume(newVol);
          setIsMuted(newVol === 0);
          if (newVol > 0) prevVolumeRef.current = newVol;
          break;
        }
        case 'm':
        case 'M': {
          const videoM = videoRef.current;
          if (!videoM) break;
          if (videoM.muted || videoM.volume === 0) {
            const restored = prevVolumeRef.current > 0 ? prevVolumeRef.current : 1;
            videoM.muted = false;
            videoM.volume = restored;
            setVolume(restored);
            setIsMuted(false);
          } else {
            prevVolumeRef.current = videoM.volume;
            videoM.muted = true;
            setIsMuted(true);
          }
          break;
        }
        case ' ': {
          e.preventDefault();
          const videoSpace = videoRef.current;
          if (!videoSpace) break;
          if (videoSpace.paused) {
            videoSpace.play();
            setIsPlaying(true);
          } else {
            videoSpace.pause();
            setIsPlaying(false);
          }
          break;
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // 외부에서 currentTime prop이 변경되면 비디오 시간 변경
  useEffect(() => {
    const video = videoRef.current;
    if (!video || currentTime === undefined) return;
    
    // 현재 시간과 요 시간이 크게 다를 경우에만 변경
    if (Math.abs(video.currentTime - currentTime) > 1) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted || volume === 0) {
      const restored = prevVolumeRef.current > 0 ? prevVolumeRef.current : 1;
      video.muted = false;
      video.volume = restored;
      setVolume(restored);
      setIsMuted(false);
    } else {
      prevVolumeRef.current = volume;
      video.muted = true;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const val = parseFloat(e.target.value);
    video.volume = val;
    video.muted = val === 0;
    setVolume(val);
    setIsMuted(val === 0);
    if (val > 0) prevVolumeRef.current = val;
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video) return;

    const rect = bar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    setHoverTime(time);

    // 호버된 위치의 문제 구간 찾기
    const issue = issueSegments.find(seg => time >= seg.start && time <= seg.end);
    setHoverIssue(issue || null);
  };

  const handleProgressBarMouseLeave = () => {
    setHoverTime(null);
    setHoverIssue(null);
  };

  const showFeedback = (type: 'seek-back' | 'seek-forward') => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ type, animKey: Date.now() });
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 700);
  };


  const handleVideoAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      const rect = e.currentTarget.getBoundingClientRect();
      const isLeftHalf = e.clientX < rect.left + rect.width / 2;
      if (isLeftHalf) {
        skip(-5);
        showFeedback('seek-back');
      } else {
        skip(5);
        showFeedback('seek-forward');
      }
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        togglePlay();
      }, 220);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercent = () => (duration > 0 ? (internalTime / duration) * 100 : 0);
  const getBufferedPercent = () => (duration > 0 ? (buffered / duration) * 100 : 0);

  return (
    <div ref={containerRef} className={`relative bg-black w-full h-full ${className}`}>
      <style>{`
        @keyframes feedbackFadeUp {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          60%  { opacity: 1; transform: translate(-50%, -60%) scale(1.08); }
          100% { opacity: 0; transform: translate(-50%, -70%) scale(0.95); }
        }
        .feedback-anim { animation: feedbackFadeUp 0.7s ease forwards; }
      `}</style>
      {/* 비디오 - 여러 포맷 지원 */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        preload="metadata"
        playsInline
      >
        <source src={videoUrl} type="video/mp4" />
        <source src={videoUrl} type="video/quicktime" />
        <source src={videoUrl} type="video/webm" />
        브라우저가 비디오를 지원하지 않습니다.
      </video>

      {/* 중앙 재생 버튼 (일시정지 시에만 표시) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <button
            onClick={togglePlay}
            className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors pointer-events-auto"
          >
            <Play className="w-10 h-10 text-white ml-1" />
          </button>
        </div>
      )}

      {/* 클릭/더블클릭 피드백 */}
      {feedback && (
        <div
          key={feedback.animKey}
          className="feedback-anim absolute z-[25] pointer-events-none top-1/2"
          style={{
            left: feedback.type === 'seek-back' ? '25%' : feedback.type === 'seek-forward' ? '75%' : '50%',
          }}
        >
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-5 py-3 text-white font-bold flex flex-col items-center gap-1">
            {feedback.type === 'seek-back' && (
              <>
                <span className="text-2xl">«</span>
                <span className="text-sm">-5초</span>
              </>
            )}
            {feedback.type === 'seek-forward' && (
              <>
                <span className="text-2xl">»</span>
                <span className="text-sm">+5초</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 비디오 클릭 영역 (컨트롤 제외) */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleVideoAreaClick}
      />

      {/* 컨트롤 바 - 완전히 하단에 고정 */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-4 pt-16 pb-4 z-30"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* 재생바 */}
          <div className="mb-2 relative">
            <div
              ref={progressBarRef}
              className="relative h-2 bg-slate-700 rounded-full cursor-pointer group/bar"
              onClick={handleProgressBarClick}
              onMouseMove={handleProgressBarMouseMove}
              onMouseLeave={handleProgressBarMouseLeave}
            >
              {/* 버퍼된 구간 */}
              <div
                className="absolute top-0 left-0 h-full bg-slate-500 rounded-full transition-all"
                style={{ width: `${getBufferedPercent()}%` }}
              />

              {/* 문제 구간 표시 (트랙에 직접 그리기) - duration이 있을 때만 */}
              {duration > 0 && issueSegments.map((segment, idx) => {
                const startPercent = ((segment.start / duration) * 100) || 0;
                const widthPercent = (((segment.end - segment.start) / duration) * 100) || 0;
                return (
                  <div
                    key={idx}
                    className={`absolute top-0 h-full ${SEGMENT_COLOR[segment.type]} opacity-80`}
                    style={{
                      left: `${Math.max(0, Math.min(100, startPercent))}%`,
                      width: `${Math.max(0, Math.min(100, widthPercent))}%`,
                    }}
                  />
                );
              })}

              {/* 재생된 구간 */}
              <div
                className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
                style={{ width: `${getProgressPercent()}%` }}
              />

              {/* 현재 위치 핸들 */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover/bar:scale-100 transition-transform z-10"
                style={{ left: `${getProgressPercent()}%`, marginLeft: '-8px' }}
              />

              {/* 호버 시 툴팁 */}
              {hoverTime !== null && (
                <div
                  className="absolute -top-16 transform -translate-x-1/2 z-20 pointer-events-none"
                  style={{ left: `${(hoverTime / duration) * 100}%` }}
                >
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm font-medium whitespace-nowrap">
                    <div className="text-center mb-1">{formatTime(hoverTime)}</div>
                    {hoverIssue && (
                      <div className={`text-xs mt-1 px-2 py-1 rounded ${hoverIssue.type === 'voice' ? 'bg-red-600' : 'bg-orange-600'}`}>
                        {hoverIssue.label}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 컨트롤 버튼들 */}
          <div className="flex items-center gap-4">
            {/* 재생/일시정지 */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            {/* 볼륨 */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {(isMuted || volume === 0)
                  ? <VolumeX className="w-5 h-5" />
                  : volume < 0.5
                    ? <Volume1 className="w-5 h-5" />
                    : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-white cursor-pointer"
              />
            </div>

            {/* 시간 표시 */}
            <div className="text-white text-sm font-medium font-mono">
              {formatTime(internalTime)} / {formatTime(duration)}
            </div>

            <div className="flex-1" />

            {/* 전체화면 */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}