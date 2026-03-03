import { useState, useRef, useEffect } from 'react';
import { Upload, Video, X, Presentation, Target, Users, Clock, MessageSquare, CheckCircle } from 'lucide-react';

interface PresentationSetupProps {
  onSubmit: (data: any) => void;
  existingFormData?: any;
  isRetry?: boolean;
}

export function PresentationSetup({ onSubmit, existingFormData, isRetry = false }: PresentationSetupProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef<HTMLDivElement>(null);
  const purposeRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<{ video?: string; topic?: string; purpose?: string }>({});

  const [formData, setFormData] = useState({
    topic: existingFormData?.topic || '',
    purpose: existingFormData?.purpose || '',
    criteria: existingFormData?.criteria || {} as Record<string, number>,
    audienceKnowledge: existingFormData?.audienceKnowledge || '',
    timeLimit: existingFormData?.timeLimit || '',
    feedbackTone: existingFormData?.feedbackTone || ''
  });

  const purposes = [
    { value: 'personal', label: '개인과제', icon: '📝' },
    { value: 'team', label: '팀프로젝트', icon: '👥' },
    { value: 'info', label: '정보공유', icon: '💡' },
    { value: 'proposal', label: '제안발표', icon: '🎯' }
  ];

  const criteriaOptions = [
    { value: 'accuracy', label: '정확성' },
    { value: 'logic', label: '논리성' },
    { value: 'delivery', label: '전달력' }
  ];

  const [hiddenCriteria, setHiddenCriteria] = useState<string[]>([]);

  // existingFormData가 변경될 때 formData를 리셋
  useEffect(() => {
    setFormData({
      topic: existingFormData?.topic || '',
      purpose: existingFormData?.purpose || '',
      criteria: existingFormData?.criteria || {} as Record<string, number>,
      audienceKnowledge: existingFormData?.audienceKnowledge || '',
      timeLimit: existingFormData?.timeLimit || '',
      feedbackTone: existingFormData?.feedbackTone || ''
    });
    setHiddenCriteria([]);
  }, [existingFormData]);

  const knowledgeLevels = [
    { value: 'none', label: '없음', desc: '처음 듣는 주제' },
    { value: 'low', label: '적음', desc: '기초 지식 보유' },
    { value: 'medium', label: '보통', desc: '일반적 이해' },
    { value: 'high', label: '많음', desc: '전문가 수준' }
  ];

  const feedbackTones = [
    { value: 'default', label: '기본', icon: '😊', desc: '균형잡힌 피드백' },
    { value: 'kind', label: '다정', icon: '🥰', desc: '격려와 응원 중심' },
    { value: 'honest', label: '솔직', icon: '🤔', desc: '직설적이고 명확한' },
    { value: 'strict', label: '냉소', icon: '😤', desc: '엄격하고 날카로운' }
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setErrors(prev => ({ ...prev, video: undefined }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setErrors(prev => ({ ...prev, video: undefined }));
    }
  };

  const handleCriteriaToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.includes(value)
        ? prev.criteria.filter(c => c !== value)
        : [...prev.criteria, value]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { video?: string; topic?: string; purpose?: string } = {};
    if (!videoFile) newErrors.video = '발표 영상을 필수로 첨부해주세요.';
    if (!formData.topic.trim()) newErrors.topic = '발표 주제를 필수로 기입해주세요.';
    if (!formData.purpose) newErrors.purpose = '발표 목적을 필수로 선택해주세요.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // 첫 번째 에러 필드로 스크롤
      if (newErrors.video) {
        videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.topic) {
        topicRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => topicRef.current?.querySelector('input')?.focus(), 400);
      } else if (newErrors.purpose) {
        purposeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    onSubmit({ ...formData, videoFile });
  };

  const handleCriteriaChange = (criterion: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [criterion]: numValue
      }
    }));
  };

  const getTotalScore = () => {
    return Object.values(formData.criteria).reduce((sum, score) => sum + score, 0);
  };

  const removeBasicCriteria = (criterionValue: string) => {
    // hiddenCriteria에 추가
    setHiddenCriteria(prev => [...prev, criterionValue]);
    // formData.criteria에서 해당 값 제거
    setFormData(prev => {
      const newCriteria = { ...prev.criteria };
      delete newCriteria[criterionValue];
      return {
        ...prev,
        criteria: newCriteria
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 rounded-2xl mb-4">
            <Presentation className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            {isRetry ? '재발표 연습' : '발표 연습 시작하기'}
          </h1>
          <p className="text-slate-600 text-lg">
            {isRetry 
              ? '새로운 발표 영상을 업로드하여 다시 연습해보세요' 
              : 'AI가 당신의 발표를 분석하고 피드백을 제공합니다'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 영상 업로드 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200" ref={videoRef}>
            <div className="flex items-center gap-3 mb-4">
              <Video className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">발표 영상 업로드</h2>
            </div>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : videoFile
                  ? 'border-green-500 bg-green-50'
                  : errors.video
                  ? 'border-red-500 bg-red-50'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {videoFile ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{videoFile.name}</p>
                    <p className="text-sm text-slate-600">
                      {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoFile(null);
                    }}
                    className="ml-4 p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className={`w-12 h-12 mx-auto mb-3 ${errors.video ? 'text-red-400' : 'text-slate-400'}`} />
                  <p className="text-slate-700 font-semibold mb-1">
                    클릭하거나 파일을 드래그하여 업로드
                  </p>
                  <p className="text-sm text-slate-500">
                    MP4, MOV, AVI 등 비디오 파일 지원
                  </p>
                </div>
              )}
            </div>
            {errors.video && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠</span> {errors.video}
              </p>
            )}
          </div>

          {/* 발표 기본 정보 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="space-y-5">
              {/* 발표 주제 */}
              <div ref={topicRef}>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  발표 주제 <span className="text-red-500">*</span>
                  {isRetry && <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">이전 설정 유지</span>}
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => {
                    setFormData({ ...formData, topic: e.target.value });
                    if (errors.topic) setErrors(prev => ({ ...prev, topic: undefined }));
                  }}
                  placeholder="예: 인공지능 기반 챗봇 서비스 개발"
                  disabled={isRetry}
                  className={`w-full px-4 py-3 border rounded-lg outline-none transition-all ${
                    isRetry 
                      ? 'bg-slate-100 text-slate-700 cursor-not-allowed border-slate-300' 
                      : errors.topic
                      ? 'border-red-500 focus:ring-2 focus:ring-red-300'
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  }`}
                />
                {errors.topic && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.topic}
                  </p>
                )}
              </div>

              {/* 발표 유형 */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  발표 유형
                </label>
                <div className="px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-700">
                  전공 발표
                </div>
              </div>

              {/* 발표 목적 */}
              <div ref={purposeRef}>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  발표 목적 <span className="text-red-500">*</span>
                  {isRetry && <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">이전 설정 유지</span>}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {purposes.map((purpose) => (
                    <button
                      key={purpose.value}
                      type="button"
                      onClick={() => {
                        if (!isRetry) {
                          setFormData({ ...formData, purpose: purpose.value });
                          if (errors.purpose) setErrors(prev => ({ ...prev, purpose: undefined }));
                        }
                      }}
                      disabled={isRetry}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.purpose === purpose.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : isRetry
                          ? 'border-slate-200 bg-slate-100 cursor-not-allowed'
                          : errors.purpose
                          ? 'border-red-400 hover:border-red-500 hover:bg-red-50'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{purpose.icon}</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {purpose.label}
                      </div>
                    </button>
                  ))}
                </div>
                {errors.purpose && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.purpose}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 평가 기준 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-slate-900">발표 평가 기준</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">선택사항</span>
              {isRetry && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">이전 설정 유지</span>}
            </div>
            <p className="text-sm text-slate-600 mb-4">
              각 평가 기준의 비중을 입력하세요 (총합 100점, 입력하지 않으면 기본 기준 적용)
            </p>
            <div className="space-y-3 mb-4">
              {criteriaOptions
                .filter(option => !hiddenCriteria.includes(option.value))
                .map((option) => (
                <div key={option.value} className="flex items-center gap-3">
                  <label className="flex-1 text-sm font-medium text-slate-700">
                    {option.label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.criteria[option.value] || ''}
                    onChange={(e) => handleCriteriaChange(option.value, e.target.value)}
                    placeholder="0"
                    disabled={isRetry}
                    className={`w-20 px-3 py-2 border border-slate-300 rounded-lg outline-none text-center ${
                      isRetry
                        ? 'bg-slate-100 cursor-not-allowed'
                        : 'focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                    }`}
                  />
                  <span className="text-slate-600 text-sm w-6">점</span>
                  <button
                    type="button"
                    onClick={() => removeBasicCriteria(option.value)}
                    disabled={isRetry}
                    className={`px-3 py-2 border border-slate-300 rounded-lg text-sm transition-all ${
                      isRetry
                        ? 'bg-slate-100 cursor-not-allowed text-slate-400'
                        : 'hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                    }`}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
            <div className={`p-3 rounded-lg text-center font-semibold ${
              getTotalScore() === 100 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : getTotalScore() === 0
                ? 'bg-slate-100 text-slate-600 border border-slate-300'
                : 'bg-orange-100 text-orange-700 border border-orange-300'
            }`}>
              {getTotalScore() === 0 ? '기본 기준으로 평가됩니다' : `총합: ${getTotalScore()} / 100점`}
            </div>
          </div>

          {/* 청중 배경지식 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-slate-900">예상 청중의 배경지식</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">선택사항</span>
              {isRetry && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">이전 설정 유지</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {knowledgeLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => !isRetry && setFormData({ ...formData, audienceKnowledge: level.value })}
                  disabled={isRetry}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.audienceKnowledge === level.value
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : isRetry
                      ? 'border-slate-200 bg-slate-100 cursor-not-allowed'
                      : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-slate-900 mb-1">
                    {level.label}
                  </div>
                  <div className="text-xs text-slate-600">
                    {level.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 제한시간 & 피드백 말투 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 발표 제한시간 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-bold text-slate-900">발표 제한시간</h2>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">선택사항</span>
                {isRetry && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">유지</span>}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                  placeholder="10"
                  min="1"
                  max="120"
                  disabled={isRetry}
                  className={`flex-1 px-4 py-3 border border-slate-300 rounded-lg outline-none transition-all ${
                    isRetry
                      ? 'bg-slate-100 cursor-not-allowed'
                      : 'focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                  }`}
                />
                <span className="text-slate-700 font-medium">분</span>
              </div>
            </div>

            {/* 피드백 말투 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-pink-600" />
                <h2 className="text-xl font-bold text-slate-900">피드백 말투</h2>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">선택사항</span>
                {isRetry && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">유지</span>}
              </div>
              <select
                value={formData.feedbackTone}
                onChange={(e) => setFormData({ ...formData, feedbackTone: e.target.value })}
                disabled={isRetry}
                className={`w-full px-4 py-3 border border-slate-300 rounded-lg outline-none transition-all ${
                  isRetry
                    ? 'bg-slate-100 cursor-not-allowed'
                    : 'focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white'
                }`}
              >
                <option value="">기본 말투</option>
                {feedbackTones.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.icon} {tone.label} - {tone.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="group px-10 py-4 bg-blue-900 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-blue-800 transition-all duration-300 flex items-center gap-3"
            >
              <span>분석 시작하기</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}