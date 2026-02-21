const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// 1. 미들웨어 설정
app.use(cors()); // 리액트(Port 5173)와의 통신 허용
app.use(express.json()); // JSON 데이터 파싱

// 2. 임시 데이터베이스 (실제 DB 연결 전까지 사용)
const users = [
  { email: 'demo@example.com', password: 'demo1234' }
];

// 3. API 엔드포인트 정의

/**
 * [POST] 발표 분석 요청
 * 리액트의 LoadingAnalysis에서 보낸 자기평가 데이터를 받아 분석 결과를 반환합니다.
 */
app.post('/api/analysis', (req, res) => {
  const { selfEvaluation } = req.body;
  
  // 리액트 컴포넌트 구조에 맞춘 가공 데이터
  const analysisData = {
    overallScore: 88,
    duration: "05:20",
    strengths: ["매우 일정한 말하기 속도", "청중과의 자연스러운 시선 처리"],
    improvements: ["손동작이 다소 과함", "문장 끝맺음이 흐릿함"],

    // FeedbackCard 컴포넌트들을 위한 상세 데이터
    detailedFeedback: [
      {
        category: '시선 처리',
        score: 85,
        feedback: '전반적으로 청중과 좋은 아이컨택을 유지했습니다. 다만, 발표 중반부에 슬라이드를 자주 보는 경향이 있었습니다.',
        suggestions: ['슬라이드 내용을 더 숙지하여 자신감 있게 청중을 바라보세요', '청중의 여러 방향을 골고루 응시하세요'],
        color: 'from-blue-500 to-cyan-500'
      },
      {
        category: '음성 분석',
        score: 78,
        feedback: '음량은 적절했으나 말하는 속도가 다소 빠릅니다. 긴장하면 단어 사이의 간격이 좁아지는 특징이 보입니다.',
        suggestions: ['중요한 문장 뒤에는 1~2초간 멈춰보세요', '복식 호흡을 통해 속도를 조절해 보세요'],
        color: 'from-purple-500 to-pink-500'
      },
      {
        category: '자세 및 제스처',
        score: 92,
        feedback: '안정적인 자세와 적절한 손동작이 매우 훌륭합니다. 강조하고 싶은 부분에서 제스처를 잘 활용하셨습니다.',
        suggestions: ['현재의 자연스러운 스타일을 유지하세요', '무대 중앙을 넓게 활용해 보세요'],
        color: 'from-green-500 to-emerald-500'
      },
      {
        category: '발표 내용',
        score: 88,
        feedback: '논리적인 전개가 훌륭하며 핵심 메시지가 명확합니다. 서론과 결론의 연결이 매끄럽습니다.',
        suggestions: ['구체적인 사례나 데이터를 인용하면 더 설득력이 높아집니다'],
        color: 'from-orange-500 to-red-500'
      }
    ],
    
    // 차트용 데이터 (자기평가 점수 반영)
    comparisonData: [
      { category: '시선 처리', self: (selfEvaluation?.eyeContact || 0) * 20, ai: 85 },
      { category: '자세', self: (selfEvaluation?.posture || 0) * 20, ai: 92 },
      { category: '음성', self: (selfEvaluation?.voice || 0) * 20, ai: 78 },
      { category: '내용', self: (selfEvaluation?.content || 0) * 20, ai: 88 }
    ]
  };

  console.log('--- 새로운 분석 요청 수신 ---');
  console.log('자기평가 데이터:', selfEvaluation);
  
  res.status(201).json({ message: '분석 완료', data: analysisData });
});

/**
 * [POST] 로그인 API
 */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    res.json({ message: '환영합니다!', user: { email: user.email } });
  } else {
    res.status(401).json({ message: '이메일 또는 비밀번호가 틀렸습니다.' });
  }
});

/**
 * [POST] 회원가입 API
 */
app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;
  console.log('신규 회원가입 요청:', email);
  res.status(201).json({ message: '회원가입이 완료되었습니다.' });
});

/**
 * [GET] 마이페이지 통계 데이터
 * MyPage.tsx에서 컴포넌트 로드 시 호출합니다.
 */
app.get('/api/my-stats', (req, res) => {
  res.json({
    userStats: {
      name: '김발표',
      email: 'presentation@example.com',
      joinDate: '2026년 2월',
      totalPresentations: 15,
      averageScore: 86,
      bestScore: 92,
      improvementRate: '+12%'
    },
    categoryStats: [
      { category: '시선 처리', average: 85, best: 92, color: 'bg-blue-500' },
      { category: "음성 분석", average: 78, best: 85, color: "bg-purple-500" },
      { category: "자세 및 제스처", average: 92, best: 95, color: "bg-green-500" },
      { category: "발표 내용", average: 88, best: 93, color: "bg-orange-500" }
    ],
    recentAchievements: [
      { title: "첫 발표 완료", icon: "🎉", date: "2024-01-15" },
      { title: "평균 80점 돌파", icon: "🔥", date: "2024-01-20" },
      { title: "10회 연습 달성", icon: "💪", date: "2024-01-25" },
      { title: "완벽한 시선 처리", icon: "👀", date: "2024-01-28" }
    ]
  });
});

/**
 * [GET] 분석 이력 목록 (사이드바 등에서 활용 가능)
 */
app.get('/api/analysis', (req, res) => {
  res.json([
    { id: 1, title: 'AI 챗봇 서비스 개발', score: 86, date: '2024-01-28' },
    { id: 2, title: '머신러닝 프로젝트 소개', score: 82, date: '2024-01-27' }
  ]);
});

// [GET] 서비스 전체 통계 API (랜딩 페이지용)
app.get('/api/service-stats', (req, res) => {
  res.json({
    totalAnalyzed: 1240,     // 총 분석된 발표 수
    activeUsers: 450,       // 활동 중인 유저 수
    averageImprovement: 24  // 평균 실력 향상도(%)
  });
});

// 4. 서버 실행
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`내일은 발표왕 로컬 서버가 가동되었습니다.`);
  console.log(`주소: http://localhost:${PORT}`);
  console.log(`=========================================`);
});