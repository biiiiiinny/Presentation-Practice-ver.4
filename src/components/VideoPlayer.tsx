import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';

interface IssueSegment {
  start: number; // 초 단위
  end: number;
  type: 'voice' | 'posture';
  label: string;
  color: string;
}

interface VideoPlayerProps {
  videoUrl: string;
  currentTime?: number; // 외부에서 시간 변경 요청
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export function VideoPlayer({ videoUrl, currentTime, onTimeUpdate, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [internalTime, setInternalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverIssue, setHoverIssue] = useState<IssueSegment | null>(null);

  // 문제 구간 데이터 (Mock)
  const issueSegments: IssueSegment[] = [
    { start: 90, end: 120, type: 'voice', label: '말하기 속도 빠름 (380자/분)', color: 'bg-red-500' },
    { start: 180, end: 200, type: 'posture', label: '선 이탈', color: 'bg-orange-500' },
    { start: 250, end: 280, type: 'voice', label: '음량 불균형', color: 'bg-yellow-500' },
    { start: 350, end: 380, type: 'posture', label: '자세 흔들림', color: 'bg-orange-500' },
  ];

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

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
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
    if (!isDragging) {
      setHoverTime(null);
      setHoverIssue(null);
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
    <div className={`relative bg-black w-full h-full ${className}`}>
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

      {/* 비디오 클릭 영역 (컨트롤 제외) */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={togglePlay}
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
                    className={`absolute top-0 h-full ${segment.color} opacity-80`}
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

            {/* 10초 뒤로 */}
            <button
              onClick={() => skip(-10)}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* 10초 앞으로 */}
            <button
              onClick={() => skip(10)}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* 시간 표시 */}
            <div className="text-white text-sm font-medium font-mono">
              {formatTime(internalTime)} / {formatTime(duration)}
            </div>

            <div className="flex-1" />

            {/* 음소거 */}
            <button
              onClick={toggleMute}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}