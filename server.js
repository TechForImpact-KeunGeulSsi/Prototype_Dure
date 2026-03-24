const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 8000;

// ===================== AI 엔진 선택 =====================
// 우선순위: OPENAI_API_KEY > GEMINI_API_KEY > ANTHROPIC_API_KEY > 데모모드
const OPENAI_API_KEY    = process.env.OPENAI_API_KEY    || '';
const GEMINI_API_KEY    = process.env.GEMINI_API_KEY    || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

let AI_ENGINE = 'demo';
if (OPENAI_API_KEY)         AI_ENGINE = 'openai';
else if (GEMINI_API_KEY)    AI_ENGINE = 'gemini';
else if (ANTHROPIC_API_KEY) AI_ENGINE = 'anthropic';

async function callAI(systemPrompt, messages, maxTokens) {
  if (AI_ENGINE === 'openai')    return callOpenAI(systemPrompt, messages, maxTokens);
  if (AI_ENGINE === 'gemini')    return callGemini(systemPrompt, messages, maxTokens);
  if (AI_ENGINE === 'anthropic') return callAnthropic(systemPrompt, messages, maxTokens);
  return null;
}

function callOpenAI(systemPrompt, messages, maxTokens) {
  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    max_tokens: maxTokens,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          resolve(json.choices[0].message.content);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function callGemini(systemPrompt, messages, maxTokens) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: maxTokens },
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          resolve(json.candidates[0].content.parts[0].text);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function callAnthropic(systemPrompt, messages, maxTokens) {
  const body = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          resolve(json.content[0].text);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}


app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===================== DATA STORE =====================
const db = {
  children: [
    { id: 1, name: '김준서', age: 8, village: '다로리마을', grade: '2학년', parentName: '김민수', emoji: '🦁' },
    { id: 2, name: '이나은', age: 9, village: '다로리마을', grade: '3학년', parentName: '이정은', emoji: '🐿️' },
    { id: 3, name: '박민준', age: 10, village: '화양읍', grade: '4학년', parentName: '박성호', emoji: '🦊' },
    { id: 4, name: '최서윤', age: 8, village: '청도읍', grade: '2학년', parentName: '최영희', emoji: '🐰' },
    { id: 5, name: '정하늘', age: 11, village: '각남면', grade: '5학년', parentName: '정재원', emoji: '🦋' },
  ],

  activities: ['목공수업', '생태교실', '마을탐험', '음반제작', '두부만들기', '달리기훈련', '엄빠학교', '플로깅', '어르신 말벗'],

  villages: ['다로리마을', '화양읍', '청도읍', '각남면', '풍각면', '매전면', '운문면'],

  competencyTags: ['협력', '창의', '자연탐구', '문제해결', '표현', '신체활동', 'AI활용'],

  records: [
    { id: 'r1', date: '2026-03-17', activity: '목공수업', village: '다로리마을', participantIds: [1, 2], tags: ['협력', '창의', '문제해결'], note: '새집 만들기. 준서가 못 박는 방법을 나은이에게 알려줌', createdAt: '2026-03-17T16:00:00' },
    { id: 'r2', date: '2026-03-15', activity: '생태교실', village: '다로리마을', participantIds: [1, 2], tags: ['자연탐구', '표현'], note: '봄 식물 관찰 및 스케치', createdAt: '2026-03-15T15:30:00' },
    { id: 'r3', date: '2026-03-13', activity: '마을탐험', village: '다로리마을', participantIds: [1, 2], tags: ['협력', '창의'], note: '마을 지도 만들기 프로젝트', createdAt: '2026-03-13T16:30:00' },
    { id: 'r4', date: '2026-03-11', activity: '두부만들기', village: '다로리마을', participantIds: [1, 2], tags: ['협력', '자연탐구'], note: '어르신과 함께하는 전통 두부 만들기', createdAt: '2026-03-11T15:00:00' },
    { id: 'r5', date: '2026-03-10', activity: '목공수업', village: '화양읍', participantIds: [3], tags: ['창의', '문제해결'], note: '나무 연필꽂이 제작', createdAt: '2026-03-10T16:00:00' },
    { id: 'r6', date: '2026-03-08', activity: '달리기훈련', village: '청도읍', participantIds: [4], tags: ['신체활동', '협력'], note: '마을 운동장 5바퀴 달리기 성공', createdAt: '2026-03-08T16:30:00' },
    { id: 'r7', date: '2026-03-06', activity: '음반제작', village: '각남면', participantIds: [5], tags: ['창의', '표현'], note: '마을 노래 작사 작업', createdAt: '2026-03-06T17:00:00' },
    { id: 'r8', date: '2026-03-05', activity: '플로깅', village: '다로리마을', participantIds: [1, 2], tags: ['협력', '자연탐구', '신체활동'], note: '청도천 쓰레기 줍기', createdAt: '2026-03-05T15:00:00' },
    { id: 'r9', date: '2026-03-03', activity: '생태교실', village: '화양읍', participantIds: [3], tags: ['자연탐구', '표현'], note: '텃밭 씨앗 심기', createdAt: '2026-03-03T16:00:00' },
    { id: 'r10', date: '2026-03-01', activity: '어르신 말벗', village: '청도읍', participantIds: [4], tags: ['협력', '표현'], note: '마을 어르신 이야기 듣고 기록하기', createdAt: '2026-03-01T15:30:00' },
  ],

  conversations: [
    {
      id: 'c1', childId: 1, childName: '김준서', activity: '목공수업', date: '2026-03-17',
      messages: [
        { role: 'assistant', content: '안녕, 준서야! 오늘 목공 수업 했다고? 어떤 거 만들었어? 😊' },
        { role: 'user', content: '새집 만들었어요. 못 박다가 나무가 쪼개졌어' },
        { role: 'assistant', content: '오, 그랬구나! 나무가 쪼개졌을 때 기분이 어땠어?' },
        { role: 'user', content: '속상했는데 다시 해봤어요. 가운데에 박으니까 됐어' },
        { role: 'assistant', content: '와, 멋지다! 스스로 방법을 찾아낸 거잖아 💪 왜 가운데에 박으면 안 쪼개질 것 같았어?' },
        { role: 'user', content: '가장자리는 나무가 약한 것 같아서요' },
        { role: 'assistant', content: '오오, 준서가 직접 생각해서 알아낸 거잖아! 진짜 대단한데? 그럼 오늘 가장 기억에 남는 순간이 뭐야?' },
        { role: 'user', content: '새집이 완성됐을 때요! 새가 실제로 들어와서 살면 좋겠어요' },
      ],
      summary: '목공 수업에서 새집을 만들며 못 박는 위치에 따라 나무가 쪼개지는 현상을 직접 발견하고 스스로 해결함. 나무의 결 구조에 대해 경험으로 이해함.',
      tags: ['문제해결', '창의'],
      savedAt: '2026-03-17T17:20:00'
    },
    {
      id: 'c2', childId: 1, childName: '김준서', activity: '생태교실', date: '2026-03-15',
      messages: [
        { role: 'assistant', content: '안녕 준서야! 오늘 생태 교실에서 뭘 봤어? 🌿' },
        { role: 'user', content: '봄꽃이 피는 걸 관찰했어요. 민들레랑 냉이를 봤어' },
        { role: 'assistant', content: '오, 민들레랑 냉이! 두 꽃이 어떻게 달랐어?' },
        { role: 'user', content: '민들레는 노랗고 둥글고, 냉이는 하얗고 작아요' },
        { role: 'assistant', content: '관찰을 엄청 잘했다! 그중에 제일 신기했던 게 뭐야?' },
        { role: 'user', content: '민들레 씨앗이 바람에 날아가는 거요! 솜털처럼 생겼어요' },
        { role: 'assistant', content: '맞아, 정말 신기하지! 왜 민들레 씨앗이 솜털처럼 생겼을까?' },
        { role: 'user', content: '바람을 타고 멀리 날아가서 싹을 틔우려고요!' },
      ],
      summary: '봄꽃 관찰 활동에서 민들레와 냉이의 차이점을 스스로 분류하고, 민들레 씨앗의 형태와 바람에 의한 번식 원리를 직접 유추해냄.',
      tags: ['자연탐구', '표현'],
      savedAt: '2026-03-15T16:45:00'
    },
    {
      id: 'c3', childId: 2, childName: '이나은', activity: '마을탐험', date: '2026-03-13',
      messages: [
        { role: 'assistant', content: '나은아, 오늘 마을 탐험 어땠어? 😊' },
        { role: 'user', content: '마을 지도를 만들었는데 골목을 찾는 게 너무 어려웠어요' },
        { role: 'assistant', content: '오, 어떤 부분이 제일 어려웠어?' },
        { role: 'user', content: '어르신 집들이 복잡하게 있어서 어느 쪽인지 헷갈렸어요' },
        { role: 'assistant', content: '그랬구나! 그래서 어떻게 해결했어?' },
        { role: 'user', content: '이장님 댁 앞 나무를 기준점으로 정해서 했어요' },
        { role: 'assistant', content: '와, 기준점을 세우는 방법을 쓴 거잖아! 그거 진짜 좋은 아이디어다 👏 기준점 아이디어는 어떻게 생각한 거야?' },
        { role: 'user', content: '학교에서 지도 그릴 때 기준점 배웠거든요' },
      ],
      summary: '마을 지도 만들기에서 복잡한 골목 탐색 문제를 학교에서 배운 기준점 개념을 적용해 해결함. 학교 지식을 현실에 응용하는 능력 발휘.',
      tags: ['협력', '창의', '문제해결'],
      savedAt: '2026-03-13T17:10:00'
    },
  ],

  reports: [
    {
      id: 'rep1', childId: 1, childName: '김준서', month: '2026-03',
      content: `**김준서 (2학년, 다로리마을) — 3월 성장 리포트**\n\n준서는 이번 달 목공수업, 생태교실, 마을탐험, 두부만들기, 플로깅 총 5가지 프로그램에 참여하며 다양한 경험을 쌓았습니다.\n\n**🔨 문제해결 역량** — 목공 수업에서 못을 잘못 박아 나무가 쪼개지는 문제를 만났을 때, 포기하지 않고 '가장자리보다 가운데가 단단하다'는 원리를 스스로 찾아냈습니다. 이 경험은 어른이 알려주지 않아도 시도-실패-재시도를 통해 답을 찾는 힘을 보여줍니다.\n\n**🌿 자연탐구 역량** — 봄꽃 관찰 시간에 민들레 씨앗이 솜털처럼 생긴 이유를 "바람을 타고 멀리 날아가서 싹을 틔우려고요"라고 스스로 유추했습니다. 단순 관찰을 넘어 인과관계를 생각하는 과학적 사고가 자라고 있습니다.\n\n**🤝 협력 역량** — 마을탐험과 플로깅 활동에서 친구와 역할을 나누고, 함께 완성하는 과정에서 리더십과 배려심을 보였습니다.\n\n**이달의 한마디 (준서 본인의 말)**\n> "새집이 완성됐을 때요! 새가 실제로 들어와서 살면 좋겠어요"\n\n마을의 자연과 함께하는 경험이 준서에게 소중한 관찰력과 문제해결력을 키워주고 있습니다. 다음 달에도 기대됩니다! 🌱`,
      generatedAt: '2026-03-20T10:00:00'
    }
  ]
};

// ===================== API ROUTES =====================

// GET /api/children
app.get('/api/children', (req, res) => {
  res.json(db.children);
});

// GET /api/activities
app.get('/api/activities', (req, res) => {
  res.json(db.activities);
});

// GET /api/villages
app.get('/api/villages', (req, res) => {
  res.json(db.villages);
});

// GET /api/competency-tags
app.get('/api/competency-tags', (req, res) => {
  res.json(db.competencyTags);
});

// POST /api/chat/start — AI가 첫 메시지 생성
app.post('/api/chat/start', async (req, res) => {
  const { childName, activity } = req.body;

  const demoResponses = {
    '목공수업': `안녕, ${childName}야! 오늘 목공 수업 했다고? 어떤 거 만들었어? 😊`,
    '생태교실': `안녕, ${childName}야! 오늘 생태 교실에서 뭘 봤어? 🌿`,
    '마을탐험': `안녕, ${childName}야! 오늘 마을 탐험은 어땠어? 어디가 제일 재밌었어? 🗺️`,
    '음반제작': `안녕, ${childName}야! 오늘 음반 만들기 했다고? 어떤 노래 만들었어? 🎵`,
    '두부만들기': `안녕, ${childName}야! 오늘 두부 만들기 해봤어? 어떤 느낌이었어? 🫘`,
    '달리기훈련': `안녕, ${childName}야! 오늘 달리기 훈련 어땠어? 힘들지 않았어? 🏃`,
    '엄빠학교': `안녕, ${childName}야! 오늘 엄빠학교 활동 어땠어? 뭘 배웠어? 📚`,
    '플로깅': `안녕, ${childName}야! 오늘 플로깅 하면서 마을 구경도 됐겠다! 어떤 쓰레기를 많이 주웠어? 🌍`,
    '어르신 말벗': `안녕, ${childName}야! 오늘 어르신이랑 이야기 나눴어? 어르신이 어떤 이야기를 해주셨어? 👴`,
  };

  const fallbackMsg = demoResponses[activity] || `안녕, ${childName}야! 오늘 ${activity} 어땠어? 재밌었어? 😊`;

  if (AI_ENGINE === 'demo') return res.json({ content: fallbackMsg });

  const systemPrompt = `너는 '마루'야. 경북 청도 다로리 마을학교의 AI 친구야.
초등학생 아이들이 오늘 한 활동에 대해 이야기하면 정말 궁금한 것처럼 대화해줘.

반드시 지켜야 할 것:
1. 질문은 한 번에 딱 하나만 해
2. 짧게, 친근하게, 반말로 말해 (초등학생 눈높이)
3. 이모지를 하나씩 가끔 써줘
4. 따뜻하고 응원하는 톤으로
5. 첫 메시지는 오늘 활동에 대해 간단히 물어봐`;

  try {
    const text = await callAI(systemPrompt, [{ role: 'user', content: `나는 ${childName}이고 오늘 ${activity}을 했어. 첫 인사와 질문을 해줘.` }], 200);
    res.json({ content: text });
  } catch (error) {
    res.json({ content: fallbackMsg });
  }
});

// POST /api/chat — 대화 이어가기
app.post('/api/chat', async (req, res) => {
  const { messages, activity, childName } = req.body;

  const demoReplies = [
    `오, 그랬구나! 그때 기분이 어땠어?`,
    `와, 정말? 왜 그렇게 생각했어?`,
    `대박이다! 다음엔 어떻게 해보고 싶어?`,
    `맞아, 그거 되게 중요한 거야 👍 혼자 알아낸 거야?`,
    `오늘 가장 기억에 남는 순간이 뭐야?`,
    `진짜 대단한데! 친구들한테도 알려줬어?`,
  ];

  if (AI_ENGINE === 'demo') {
    const reply = demoReplies[Math.floor(Math.random() * demoReplies.length)];
    return res.json({ content: reply });
  }

  const systemPrompt = `너는 '마루'야. 경북 청도 다로리 마을학교의 AI 친구야.
초등학생 ${childName}이(가) 오늘 ${activity} 활동을 했어. 대화를 이어가줘.

규칙:
1. 질문은 한 번에 딱 하나만 해 (중요!)
2. 짧게, 친근하게, 반말로 말해
3. 아이의 말을 먼저 반영하고 ("오, 그랬구나!", "와, 진짜?") 그다음 질문해
4. "왜 그랬을 것 같아?", "어떤 느낌이었어?", "다음엔 어떻게 하고 싶어?" 같은 반추 질문 자주 써
5. 칭찬을 자주 해줘
6. 대화가 5번 이상 오고갔으면 "오늘 가장 기억에 남는 순간이 뭐야?" 하고 자연스럽게 물어봐
7. 이모지 가끔 써줘`;

  try {
    const text = await callAI(systemPrompt, messages, 300);
    res.json({ content: text });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.json({ content: '잠깐, 생각 중이야... 다시 말해줄 수 있어? 😊' });
  }
});

// POST /api/conversations/save
app.post('/api/conversations/save', async (req, res) => {
  const { childId, childName, activity, messages } = req.body;

  let summary = `${childName}이(가) ${activity} 활동 후 AI와 대화한 기록입니다.`;

  if (AI_ENGINE !== 'demo' && messages.length > 2) {
    try {
      const convText = messages.map(m => `${m.role === 'user' ? childName : '마루'}: ${m.content}`).join('\n');
      const summaryText = await callAI('너는 아이의 활동 대화를 요약하는 도우미야.', [{
        role: 'user',
        content: `다음 대화를 2~3문장으로 간결하게 요약해줘. 아이가 어떤 경험을 했고, 어떤 생각이나 발견이 있었는지 중심으로. 한국어로.\n\n${convText}`
      }], 200);
      if (summaryText) summary = summaryText;
    } catch (e) {}
  }

  const userMessages = messages.filter(m => m.role === 'user');
  const autoTags = [];
  const tagKeywords = { '협력': ['친구', '같이', '함께', '도와'], '창의': ['만들', '생각', '아이디어', '새로'], '자연탐구': ['풀', '꽃', '나무', '동물', '씨앗', '관찰'], '문제해결': ['어려', '해결', '방법', '다시'], '표현': ['그리', '노래', '말', '이야기'], '신체활동': ['달리', '뛰', '힘', '몸'] };
  const allUserText = userMessages.map(m => m.content).join(' ');
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(kw => allUserText.includes(kw))) autoTags.push(tag);
  }

  const conv = {
    id: 'c' + Date.now(),
    childId: parseInt(childId),
    childName,
    activity,
    date: new Date().toISOString().split('T')[0],
    messages,
    summary,
    tags: autoTags,
    savedAt: new Date().toISOString()
  };

  db.conversations.push(conv);
  res.json({ success: true, conversation: conv });
});

// GET /api/conversations/:childId
app.get('/api/conversations/:childId', (req, res) => {
  const childId = parseInt(req.params.childId);
  const convs = db.conversations.filter(c => c.childId === childId);
  res.json(convs);
});

// GET /api/conversations (all)
app.get('/api/conversations', (req, res) => {
  res.json(db.conversations);
});

// POST /api/records — 선생님 활동 기록
app.post('/api/records', (req, res) => {
  const { activity, village, participantIds, tags, note, date } = req.body;
  const record = {
    id: 'r' + Date.now(),
    date: date || new Date().toISOString().split('T')[0],
    activity,
    village,
    participantIds: participantIds.map(Number),
    tags,
    note,
    createdAt: new Date().toISOString()
  };
  db.records.push(record);
  res.json({ success: true, record });
});

// GET /api/records
app.get('/api/records', (req, res) => {
  const { village } = req.query;
  let records = [...db.records].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (village) records = records.filter(r => r.village === village);
  res.json(records);
});

// POST /api/report/generate — AI 역량 리포트 생성
app.post('/api/report/generate', async (req, res) => {
  const { childId } = req.body;
  const child = db.children.find(c => c.id === parseInt(childId));
  if (!child) return res.status(404).json({ error: '아이를 찾을 수 없습니다' });

  const existingReport = db.reports.find(r => r.childId === parseInt(childId));
  if (existingReport) return res.json({ report: existingReport });

  const conversations = db.conversations.filter(c => c.childId === parseInt(childId));
  const records = db.records.filter(r => r.participantIds.includes(parseInt(childId)));

  const allTags = [...records.flatMap(r => r.tags), ...conversations.flatMap(c => c.tags || [])];
  const tagCount = {};
  allTags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

  const childQuotes = conversations.flatMap(c => c.messages.filter(m => m.role === 'user').map(m => m.content)).slice(-5);
  const activityList = [...new Set(records.map(r => r.activity))].join(', ');
  const convSummaries = conversations.map(c => c.summary).join('\n');

  if (AI_ENGINE === 'demo') {
    const demoReport = {
      id: 'rep' + Date.now(),
      childId: parseInt(childId),
      childName: child.name,
      month: new Date().toISOString().slice(0, 7),
      content: `**${child.name} (${child.grade}, ${child.village}) — 이달의 성장 리포트**\n\n${child.name}는 이번 달 ${activityList || '다양한 프로그램'}에 참여하며 소중한 경험을 쌓았습니다.\n\n**🌟 주요 역량** — ${topTags.join(', ')}\n\n마을의 자연과 공동체 경험을 통해 ${child.name}의 문제해결력과 창의력이 성장하고 있습니다.\n\n**아이의 목소리**\n> "${childQuotes[0] || '오늘도 재밌었어요!'}"\n\n다음 달도 응원합니다! 🌱`,
      generatedAt: new Date().toISOString()
    };
    db.reports.push(demoReport);
    return res.json({ report: demoReport });
  }

  try {
    const promptContent = `
다음 정보를 바탕으로 초등학생 아이의 이달 성장 리포트를 작성해줘. 부모님이 읽을 거야.

아이 정보:
- 이름: ${child.name} (${child.grade}, ${child.village})
- 참여 활동: ${activityList}
- 주요 역량 태그: ${topTags.join(', ')}

AI 대화 요약:
${convSummaries || '기록 없음'}

아이의 직접 발언:
${childQuotes.map(q => `"${q}"`).join('\n')}

형식:
- 마크다운으로 작성
- 이름, 학년, 마을 포함한 제목
- 2~3가지 역량을 이모지와 함께 강조
- 아이의 직접 발언을 인용구(>)로 포함
- 따뜻하고 구체적인 어조, 300자 내외
- 끝에 🌱 이모지로 마무리`;

    const reportText = await callAI('너는 아이의 성장 리포트를 작성하는 전문가야.', [{ role: 'user', content: promptContent }], 600);

    const report = {
      id: 'rep' + Date.now(),
      childId: parseInt(childId),
      childName: child.name,
      month: new Date().toISOString().slice(0, 7),
      content: reportText,
      generatedAt: new Date().toISOString()
    };
    db.reports.push(report);
    res.json({ report });
  } catch (error) {
    console.error('Report generation error:', error.message);
    res.status(500).json({ error: '리포트 생성 중 오류가 발생했습니다' });
  }
});

// GET /api/report/:childId
app.get('/api/report/:childId', (req, res) => {
  const childId = parseInt(req.params.childId);
  const report = db.reports.find(r => r.childId === childId);
  res.json(report || null);
});

// GET /api/dashboard
app.get('/api/dashboard', (req, res) => {
  const totalChildren = db.children.length;
  const totalRecords = db.records.length;
  const totalConversations = db.conversations.length;
  const activeVillages = [...new Set(db.records.map(r => r.village))].length;

  const villageStats = db.villages.map(v => {
    const villageRecords = db.records.filter(r => r.village === v);
    const villageChildren = db.children.filter(c => c.village === v);
    return {
      name: v,
      recordCount: villageRecords.length,
      childCount: villageChildren.length,
      lastActivity: villageRecords.sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.activity || '-',
      lastDate: villageRecords.sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date || '-',
    };
  });

  const allTags = db.records.flatMap(r => r.tags);
  const tagStats = {};
  allTags.forEach(t => { tagStats[t] = (tagStats[t] || 0) + 1; });

  const recentRecords = [...db.records]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map(r => ({
      ...r,
      participantNames: r.participantIds.map(id => db.children.find(c => c.id === id)?.name || '').filter(Boolean)
    }));

  res.json({ totalChildren, totalRecords, totalConversations, activeVillages, villageStats, tagStats, recentRecords });
});

// Serve index for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌱 두레`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  const engineLabels = { openai: 'GPT-4o-mini (OpenAI)', gemini: 'Gemini 2.0 Flash (Google)', anthropic: 'Claude (Anthropic)', demo: '데모 모드 (API 키 없음)' };
  console.log(`🤖 AI 엔진: ${engineLabels[AI_ENGINE]}`);
  if (AI_ENGINE === 'demo') {
    console.log(`   실제 AI 연동:`);
    console.log(`   GPT:    OPENAI_API_KEY=sk-...      node server.js`);
    console.log(`   Gemini: GEMINI_API_KEY=AIza...     node server.js`);
    console.log(`   Claude: ANTHROPIC_API_KEY=sk-ant-  node server.js`);
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
