/* 레벨업 길드 — 게임 데이터 (기획 수정 영역)
   SPRITES: 픽셀 스프라이트 행 데이터 / CLASSES: 직업·전직 / Q: 장·퀘스트 / LV: 레벨 표 */
const BODY = c => [
  '..hhhh..',
  '.hhhhhh.',
  '.hskksh.',
  '.ssssss.',
  '..ssss..',
  `.${c}${c}${c}${c}${c}${c}.`,
  `${c}${c}${c}${c}${c}${c}${c}${c}`,
  `s.${c}${c}${c}${c}.s`,
  '..dd.dd.',
  '..dd.dd.'];
const HAT = (c,acc) => { const b=BODY(c); b[0]=acc; return b; };
const SPRITES = {
  hero:      BODY('o'),
  finance:   BODY('y'),
  both:      BODY('p'),
  founder:   HAT('g','.oooooo.'),
  researcher:HAT('b','.kkkkkk.'),
  secretary: BODY('r'),
  analyst:   HAT('y','..gggg..'),
  writer:    BODY('g'),
  builder:   HAT('o','.yyyyyy.'),
  cfo:       HAT('d','..yyyy..'),
  bookkeeper:HAT('g','..kkkk..'),
  intern:    HAT('w','..rrrr..'),
};

/* ---------- 직업 ---------- */
const CLASSES = {
  ceo:{name:'AI 회사 사장님', motto:'"일은 AI 직원이, 결재는 내가"', spr:'hero', tracks:['agent','founder'],
    desc:'나 대신 일하는 AI 직원을 뽑고, 개인사업자 등록부터 첫 매출까지 내 회사를 세운다.',
    stats:{'자동화':5,'실행력':4,'자산':2}, weapon:'Claude Code', item:'사업자등록증(예정)',
    fit:'반복 업무에 지친 직장인, 부업·창업 준비생',
    ranks:[[[],'알바 사장님','아직 직원이 없다. 모든 일을 손으로 한다.'],
           [['a-ag1'],'1인 기업 대표','스킬 습득: 서브에이전트 소환 — 전문 직원을 뽑을 수 있다.'],
           [['a-boss2'],'AI 군단장','스킬 습득: 3인 협공 — 명령 하나로 직원 셋이 일을 주고받는다.'],
           [['a-boss3','b-terms'],'무인 회사 회장님','스킬 습득: 월요일 자동 결재 — 출근 전에 일이 끝나 있다.']]},
  investor:{name:'재야의 재테크 고수', motto:'"소문 말고 숫자로 번다"', spr:'finance', tracks:['finance'],
    desc:'내 돈의 지도를 그리고 방패(비상금)를 들고, 목표와 절세 계좌로 자산을 설계한다.',
    stats:{'자동화':2,'실행력':3,'자산':5}, weapon:'스프레드시트 + Claude', item:'3개월치 거래내역',
    fit:'돈이 어디로 새는지 모르는 사람, 사회초년생',
    ranks:[[[],'동네 짠테크러','가계부를 써본 적은 있다. 끝까지 간 적은 없다.'],
           [['f-spend'],'가계부 검객','스킬 습득: 지출 해부 — 새는 돈 3곳을 찾아낸다.'],
           [['f-boss2'],'재야의 재테크 고수','스킬 습득: 보물 지도 — 목표마다 월 적립액이 보인다.'],
           [['f-auto','f-cfo'],'경제적 자유인','스킬 습득: 자동 사냥 — 월급이 들어오면 알아서 나뉜다.']]},
  hybrid:{name:'사장님 겸 고수', hidden:true, motto:'"회사도 돈도 시스템으로"', spr:'both', tracks:['agent','founder','finance'],
    desc:'두 길을 모두 걷는 히든 직업. 퀘스트가 가장 많고, 마지막엔 AI 경리와 재무 비서가 함께 일한다.',
    stats:{'자동화':4,'실행력':4,'자산':4}, weapon:'둘 다', item:'체력',
    fit:'욕심 많은 사람',
    ranks:[[[],'수상한 신입','두 갈래 길 앞에 섰다.'],
           [['b-bank'],'투잡 모험가','스킬 습득: 이중 장부 — 회사 돈과 내 돈을 나눠 본다.'],
           [['f-cfo','a-boss2'],'N잡 마스터','스킬 습득: 분신술 — AI 경리와 재무 비서가 동시에 움직인다.'],
           [['a-boss3','f-boss2','b-terms'],'시스템 부자','스킬 습득: 무한 루프 — 회사가 번 돈이 자산 설계로 흘러간다.']]},
};
const LEGACY={agent:'ceo',founder:'ceo',finance:'investor',both:'hybrid'};
/* 전직: 마일스톤 퀘스트 기준. done = {qid:ts} */
function rankOf(cls,done){let r=CLASSES[cls].ranks[0];CLASSES[cls].ranks.forEach(x=>{if(x[0].every(id=>done[id]))r=x;});return r;}
const TRACK_NAME = {agent:'AI 에이전트 팀', finance:'재테크 설계', founder:'1인 창업'};
const TRACK_SHORT = {agent:'에이전트', finance:'재테크', founder:'창업'};

/* ---------- 퀘스트 데이터 ----------
 step: 문자열 | {t, cmd:{mac,win}|string, file}
*/
const Q = [
/* ===== 에이전트 트랙 ===== */
{ch:'agent',chap:0,chapName:'마을 입구 — 준비물 챙기기'},
{id:'a-acc',track:'agent',chap:0,title:'통행증 발급',sub:'Claude 계정과 유료 플랜',xp:50,
 story:'길드에 들어오려면 통행증이 필요하다. Claude Code는 무료 계정으로는 쓸 수 없다.',
 steps:['claude.ai 에 가입한다 (구글 계정 로그인 가능).','Pro 이상 플랜을 구독한다. 한 달만 써보고 판단해도 된다.','휴대폰에도 Claude 앱을 깔아 두면 이동 중에 동료에게 일을 맡길 수 있다.'],
 clear:'claude.ai 왼쪽 아래에 내 플랜 이름이 보인다.'},
{id:'a-term',track:'agent',chap:0,title:'검은 창과 친해지기',sub:'터미널 여는 법',xp:50,
 story:'마법사들은 검은 창(터미널)에 주문을 적는다. 무섭게 생겼지만 복사-붙여넣기만 할 줄 알면 된다.',
 steps:[
  {t:'터미널을 연다.',keys:{mac:'⌘ + Space → "터미널" 입력 → Enter',win:'시작 버튼 우클릭 → "터미널" 또는 "Windows PowerShell"'}},
  {t:'아래 주문을 붙여넣고 Enter. 지금 있는 폴더 위치가 나오면 성공.',cmd:{mac:'pwd',win:'pwd'}},
 ],
 tip:'붙여넣기: Mac은 ⌘+V, Windows 터미널은 Ctrl+V 또는 마우스 우클릭.',
 clear:'pwd 결과로 /Users/내이름 또는 C:\\Users\\내이름 같은 경로가 나왔다.'},
{id:'a-git',track:'agent',chap:0,title:'저장의 돌 — Git과 GitHub',sub:'작업물 버전 관리',xp:80,
 story:'동료가 실수해도 되돌릴 수 있게 세이브 포인트를 만드는 도구다. AI가 파일을 고칠 때 특히 중요하다.',
 steps:[
  {t:'Git 설치',cmd:{mac:'xcode-select --install',win:'winget install --id Git.Git -e'}},
  {t:'설치 확인 (버전 숫자가 나오면 OK)',cmd:{mac:'git --version',win:'git --version'}},
  'github.com 에 가입한다. 나중에 내 에이전트 설정을 백업하는 창고가 된다.',
 ],
 tip:'Windows는 설치 후 터미널을 껐다 켜야 git 명령이 인식된다.',
 clear:'git --version 이 "git version 2.xx" 를 출력한다.'},
{id:'a-code',track:'agent',chap:0,title:'작업대 설치 — VS Code',sub:'파일을 눈으로 보는 편집기',xp:60,
 story:'AI가 만든 파일을 열어 보고 고치는 작업대. 나중에 픽셀 오피스도 여기 들어온다.',
 steps:['code.visualstudio.com 에서 내 OS 버전을 받아 설치한다.','VS Code를 켜고 상단 메뉴 Terminal → New Terminal 을 눌러본다. 아래에 검은 창이 열리면 성공.'],
 clear:'VS Code 안에서 터미널이 열린다.'},
{id:'a-boss0',track:'agent',chap:0,boss:true,title:'BOSS · 준비물 점검',sub:'준비물 한 번에 확인',xp:120,
 story:'문지기가 준비물을 검사한다.',
 steps:[{t:'VS Code 터미널에서 아래를 실행해 버전 번호가 모두 나오는지 확인',cmd:{mac:'git --version && code --version',win:'git --version; code --version'}}],
 tip:'Mac에서 code 명령이 없다고 나오면: VS Code에서 ⌘+Shift+P → "Shell Command: Install \'code\' command in PATH".',
 clear:'두 버전이 모두 출력되고, claude.ai 유료 플랜이 활성 상태다.', badge:'준비된 모험가'},

{ch:'agent',chap:1,chapName:'첫 동료 소환 — Claude Code'},
{id:'a-install',track:'agent',chap:1,title:'소환진 그리기',sub:'Claude Code 설치',xp:120,
 story:'이제 진짜 동료를 부른다. 한 줄이면 된다.',
 steps:[
  {t:'터미널에 붙여넣기',cmd:{mac:'curl -fsSL https://claude.ai/install.sh | bash',win:'irm https://claude.ai/install.ps1 | iex'}},
  {t:'터미널을 껐다 켠 뒤 확인',cmd:'claude --version'},
 ],
 tip:'터미널이 영 불편하면 Claude 데스크톱 앱(claude.ai/download)의 Code 탭으로도 같은 일을 할 수 있다. 길드에서는 터미널 버전 기준으로 안내한다.',
 warn:'설치 명령은 바뀔 수 있다. 에러가 나면 docs.claude.com 의 Claude Code 설치 문서를 먼저 확인하고, 그래도 안 되면 SOS.',
 clear:'claude --version 이 버전 번호를 출력한다.'},
{id:'a-first',track:'agent',chap:1,title:'첫 대화',sub:'작업 폴더에서 claude 실행',xp:100,unlock:'intern',
 story:'동료는 "지금 있는 폴더" 안에서만 일한다. 전용 작업실부터 만든다.',
 steps:[
  {t:'작업 폴더를 만들고 들어간다',cmd:{mac:'mkdir -p ~/my-guild && cd ~/my-guild && git init',win:'mkdir $HOME\\my-guild; cd $HOME\\my-guild; git init'}},
  {t:'동료 소환',cmd:'claude'},
  '처음이면 브라우저가 열리며 로그인을 요청한다. claude.ai 계정으로 승인.',
  {t:'첫 명령을 한국어로 입력해본다',cmd:'오늘 날짜와 내가 할 일 3개를 적는 todo.md 파일을 만들어줘'},
  '파일을 만들어도 되냐고 물으면 허락한다. VS Code로 my-guild 폴더를 열어 todo.md가 생겼는지 본다.',
 ],
 clear:'my-guild 폴더에 AI가 만든 todo.md가 있다.', badge:'첫 소환'},
{id:'a-rules',track:'agent',chap:1,title:'길드 규칙서 — CLAUDE.md',sub:'동료가 매번 읽는 나에 대한 설명서',xp:120,
 story:'동료는 매번 기억을 잃고 출근한다. 그래서 책상 위에 "나는 누구고, 어떻게 일해주면 좋겠는지" 적은 규칙서를 둔다.',
 steps:[
  'my-guild 폴더에 CLAUDE.md 파일을 만든다. claude 에게 "CLAUDE.md 만들어줘. 내 정보는 내가 불러줄게" 라고 해도 된다.',
  {t:'예시 내용 (내 상황으로 바꾸기)',file:`# 나에 대해
- 직업: (예: 내과 전공의 / 마케터 / 대학원생)
- 자주 하는 일: (예: 논문 요약, 주간 보고서, 일정 정리)

# 일하는 방식
- 한국어로 답한다. 결론부터.
- 파일을 지우거나 덮어쓰기 전에는 꼭 물어본다.
- 모르는 건 지어내지 말고 모른다고 한다.`},
  'claude 를 다시 실행하고 "내가 누군지 말해봐" 라고 물어본다.',
 ],
 clear:'claude 가 CLAUDE.md 내용을 근거로 나를 설명한다.'},

{ch:'agent',chap:2,chapName:'파티 모집 — 전문 에이전트 만들기'},
{id:'a-ag1',track:'agent',chap:2,title:'리서처 영입',sub:'자료 조사 담당',xp:150,unlock:'researcher',
 story:'첫 파티원. 조사만 하고 파일은 건드리지 않는 신중한 타입.',
 steps:[
  'claude 안에서 /agents 를 입력하면 에이전트를 대화형으로 만들 수 있다. 직접 파일로 만들어도 된다.',
  {t:'파일 위치: my-guild/.claude/agents/researcher.md',file:`---
name: researcher
description: 웹 검색과 자료 조사가 필요할 때 사용. 출처를 반드시 남긴다.
tools: WebSearch, WebFetch, Read
---
너는 꼼꼼한 리서처다.
- 질문을 받으면 신뢰할 만한 출처 3곳 이상을 찾는다.
- 결과는 "핵심 요약 5줄 + 출처 링크 목록"으로 낸다.
- 출처가 없는 내용은 쓰지 않는다.`},
  {t:'일 시켜보기',cmd:'researcher 에이전트로 "번아웃 회복에 효과 있는 습관"을 조사해서 research.md 로 저장해줘'},
 ],
 clear:'research.md 에 요약과 출처 링크가 있다.'},
{id:'a-ag2',track:'agent',chap:2,title:'비서 영입',sub:'일정·메일 초안 담당',xp:150,unlock:'secretary',
 story:'잡무를 맡길 비서. 보내기 전엔 반드시 초안으로만 보여준다.',
 steps:[
  {t:'.claude/agents/secretary.md',file:`---
name: secretary
description: 일정 정리, 메일·메시지 초안, 할 일 목록 관리가 필요할 때 사용.
tools: Read, Write, Edit
---
너는 내 비서다.
- 메일과 메시지는 초안만 쓴다. 절대 직접 보내지 않는다.
- 말투는 정중하되 짧게.
- todo.md 를 최신 상태로 유지한다.`},
  {t:'일 시켜보기',cmd:'secretary 에이전트로 다음 주 회의 일정 조율 메일 초안을 써줘. 후보 시간은 화 3시, 목 10시'},
 ],
 clear:'메일 초안이 파일이나 화면으로 나왔다.'},
{id:'a-ag3',track:'agent',chap:2,title:'세 번째 동료는 내가 설계',sub:'내 업무에 맞춘 커스텀 에이전트',xp:200,unlock:'writer',
 story:'남이 만든 템플릿은 여기까지. 내가 매주 반복하는 일 하나를 골라 전담 동료를 만든다.',
 steps:[
  '지난주에 30분 이상 걸린 반복 업무를 하나 적는다. (예: 외래 환자 교육자료 정리, 인스타 캡션, 실험 노트 정리)',
  {t:'claude 에게 설계를 맡긴다',cmd:'내가 매주 하는 [업무 설명] 을 대신해줄 에이전트를 .claude/agents/ 에 만들어줘. 먼저 질문 3개만 해줘'},
  '만들어진 에이전트로 실제 업무를 한 번 돌려보고, 마음에 안 드는 점을 규칙에 추가한다.',
 ],
 clear:'내 업무 전용 에이전트가 실제 결과물을 한 번 이상 냈다.', badge:'파티 리더'},
{id:'a-boss2',track:'agent',chap:2,boss:true,title:'BOSS · 3인 협공',sub:'한 번의 명령으로 셋을 움직이기',xp:250,
 story:'진짜 팀은 서로 일을 넘긴다. 리서처가 조사하고, 내 커스텀 동료가 정리하고, 비서가 일정에 넣는다.',
 steps:[{t:'예시 명령',cmd:'researcher 로 [주제] 를 조사하고, 그 결과로 내 커스텀 에이전트가 1페이지 요약을 쓰고, secretary 가 todo.md 에 후속 할 일을 추가해줘'}],
 clear:'파일 3개(조사, 요약, todo 업데이트)가 한 번의 명령으로 생겼다.', badge:'3인 협공 격파'},

{ch:'agent',chap:3,chapName:'장비와 스킬북 — 연결하고 자동화하기'},
{id:'a-mcp',track:'agent',chap:3,title:'마법 장비 — 커넥터(MCP)',sub:'캘린더·노션·드라이브 연결',xp:150,unlock:'analyst',
 story:'동료에게 내 캘린더와 노트를 볼 수 있는 눈을 달아준다.',
 steps:[
  'claude.ai 설정 → 커넥터(Connectors)에서 Google Calendar, Notion 등 필요한 것만 연결한다.',
  {t:'Claude Code에서 연결된 도구 확인',cmd:'/mcp'},
  {t:'써보기',cmd:'이번 주 내 캘린더 일정을 보고 비어 있는 2시간 블록을 찾아줘'},
 ],
 warn:'연결은 꼭 필요한 것만. 메일 "보내기" 권한이 있는 도구는 처음엔 초안만 쓰게 규칙에 적어둔다.',
 clear:'동료가 내 실제 일정을 읽어서 답했다.'},
{id:'a-skill',track:'agent',chap:3,title:'스킬북 집필',sub:'반복 작업을 스킬로 저장',xp:180,unlock:'builder',
 story:'에이전트가 "사람"이라면 스킬은 "업무 매뉴얼"이다. 한 번 써두면 어느 동료든 꺼내 쓴다.',
 steps:[
  {t:'my-guild/.claude/skills/weekly-report/SKILL.md',file:`---
name: weekly-report
description: 주간 보고서를 쓸 때 사용. 이번 주 todo.md 와 작업 파일을 읽고 정리한다.
---
1. todo.md 에서 완료/미완료를 나눈다.
2. "이번 주 한 일 / 막힌 것 / 다음 주 계획" 3칸으로 쓴다.
3. 한 칸에 3줄 이내.`},
  {t:'호출',cmd:'weekly-report 스킬로 이번 주 보고서 써줘'},
 ],
 clear:'스킬 이름만 말해도 같은 형식의 보고서가 나온다.'},
{id:'a-office',track:'agent',chap:3,title:'픽셀 오피스 개장',sub:'일하는 동료를 눈으로 보기',xp:150,
 story:'하단 "사무실" 탭은 연습용이다. 진짜 사무실은 VS Code 안에 차린다.',
 steps:[
  'VS Code 왼쪽 확장(Extensions) 아이콘 → "Pixel Agents" 같은 픽셀 에이전트 시각화 확장을 검색한다.',
  '설치 전 제작자, 다운로드 수, 최근 업데이트 날짜를 확인한다. 커뮤니티 확장이라 공식 제품은 아니다.',
  'VS Code 터미널에서 claude 를 여러 개 띄우고 각자 일을 맡기면 캐릭터가 움직이는 모습을 볼 수 있다.',
 ],
 warn:'확장 이름과 지원 여부는 바뀔 수 있다. 못 찾으면 길드 방에 SOS를 올리면 최신 추천을 공유한다.',
 clear:'VS Code 안에서 동료들이 픽셀 캐릭터로 일하는 모습이 보인다.'},
{id:'a-boss3',track:'agent',chap:3,boss:true,title:'FINAL BOSS · 월요일 아침 자동화',sub:'내 한 주를 시작시키는 팀',xp:400,
 story:'월요일 9시. 명령 하나로 일정 확인, 할 일 정리, 지난주 보고서까지 끝내라.',
 steps:[
  {t:'예시 명령 (CLAUDE.md 에 "월요일 루틴" 으로 적어두면 더 좋다)',cmd:'월요일 루틴 실행: 캘린더에서 이번 주 일정 요약, todo.md 정리, weekly-report 스킬로 지난주 보고서 작성'},
  '걸린 시간을 재서 길드 방에 공유한다. 원래 손으로 하면 몇 분 걸렸는지도 같이.',
 ],
 clear:'명령 하나로 3가지가 끝났고, 절약한 시간을 기록했다.', badge:'에이전트 마스터'},

/* ===== 재테크 트랙 ===== */
{ch:'finance',chap:0,chapName:'지도 그리기 — 내 돈은 지금 어디에'},
{id:'f-net',track:'finance',chap:0,title:'순자산 스냅샷',sub:'자산 − 부채 = 내 현재 레벨',xp:80,
 story:'모험은 현재 위치를 아는 데서 시작한다. 오늘 날짜 기준 한 장이면 된다.',
 steps:[
  '스프레드시트에 두 칸을 만든다: 자산(예금, 적금, 투자, 보증금, 연금) / 부채(대출, 카드 할부, 마이너스통장).',
  '각 항목의 잔액과 금리를 적는다. 대략이어도 된다.',
  '자산 합계 − 부채 합계 = 순자산. 맨 위에 크게 적는다.',
 ],
 clear:'순자산 숫자 하나와 작성 날짜가 있다.'},
{id:'f-spend',track:'finance',chap:0,title:'지출 던전 탐사',sub:'최근 3개월 소비 분류',xp:120,
 story:'돈이 새는 구멍은 생각한 곳에 있지 않다. 데이터로 확인한다.',
 steps:[
  '카드사·은행 앱에서 최근 3개월 거래내역을 엑셀/CSV로 내려받는다.',
  '계좌번호, 카드번호, 이름 같은 개인정보 열은 지운다.',
  {t:'Claude 에 파일을 올리고',cmd:'이 거래내역을 고정비/생활비/구독/경조사/기타로 분류하고 월평균을 표로 보여줘. 줄일 수 있는 후보 3개도'},
 ],
 warn:'AI에 금융 데이터를 올릴 땐 식별정보를 꼭 지운다. 금액과 가맹점명만 있으면 분석엔 충분하다.',
 clear:'카테고리별 월평균 지출표가 있다.'},
{id:'f-boss0',track:'finance',chap:0,boss:true,title:'BOSS · 현금흐름 한 줄',sub:'월 수입 − 월 지출 = ?',xp:150,
 story:'한 줄로 말할 수 있어야 다음 단계로 간다: "나는 매달 ___원이 남는다(모자란다)."',
 steps:['세후 월 수입(평균)을 적는다.','앞에서 구한 월평균 지출을 뺀다.','남는 돈을 "투입 가능 금액"으로 이름 붙인다.'],
 clear:'월 투입 가능 금액이 숫자로 나왔다.', badge:'지도 제작자'},

{ch:'finance',chap:1,chapName:'방어력 올리기 — 무너지지 않는 기반'},
{id:'f-emer',track:'finance',chap:1,title:'비상금 방패',sub:'고정비 3~6개월치',xp:120,
 story:'방패 없이 공격부터 하면 첫 몬스터(실직, 병원비)에 쓰러진다.',
 steps:['월 고정비 × 3(직장 안정적) ~ 6(프리랜서·자영업)을 계산한다.','언제든 꺼낼 수 있는 파킹통장/CMA 등에 따로 둔다.','투자 계좌와 섞지 않는다.'],
 clear:'목표 비상금 금액과 현재 금액, 모자란 금액이 적혀 있다.'},
{id:'f-debt',track:'finance',chap:1,title:'저주 해제 — 고금리 부채',sub:'금리 높은 빚부터',xp:120,
 story:'연 15% 카드론이 있는데 연 7%를 노리는 건 밑 빠진 독이다.',
 steps:['부채를 금리 높은 순으로 정렬한다.','기대수익보다 금리가 높은 부채는 투자보다 상환을 먼저 계획한다.','상환 순서와 월 상환액을 표로 만든다.'],
 clear:'부채 상환 순서표가 있다 (부채가 없으면 바로 클리어).'},

{ch:'finance',chap:2,chapName:'목표 설정 — 보물 위치 찍기'},
{id:'f-goal',track:'finance',chap:2,title:'보물 지도 3장',sub:'목표 금액·기한 정하기',xp:150,calc:true,
 story:'"부자 되기"는 목표가 아니다. 금액과 날짜가 있어야 퀘스트가 된다.',
 steps:['단기(1~2년), 중기(3~7년), 장기(10년+) 목표를 하나씩 적는다. 예: 결혼자금, 전세 보증금, 은퇴.','아래 계산기로 각 목표에 매달 얼마가 필요한지 구한다.','세 목표의 월 필요액 합계를 BOSS에서 구한 "투입 가능 금액"과 비교한다.'],
 clear:'목표 3개 각각의 월 필요액이 있다.'},
{id:'f-tax',track:'finance',chap:2,title:'세금 방어구',sub:'절세 계좌 알아보기',xp:150,
 story:'같은 수익이라도 어떤 계좌에 담느냐에 따라 손에 남는 돈이 다르다.',
 steps:[
  '연금저축·IRP(세액공제), ISA(비과세·분리과세) 세 가지 계좌의 올해 납입 한도와 공제율을 찾아본다.',
  {t:'Claude 에 물어보기',cmd:'연봉 [금액] 직장인 기준으로 연금저축, IRP, ISA 의 올해 한도와 세제 혜택을 표로 정리해줘. 출처 링크도'},
  '받은 답을 국세청·금융감독원 자료와 한 번 대조한다.',
 ],
 warn:'세법과 한도는 해마다 바뀐다. AI 답을 그대로 믿지 말고 공식 출처로 확인한다.',
 clear:'내가 쓸 절세 계좌와 연간 납입 계획이 정해졌다.'},
{id:'f-boss2',track:'finance',chap:2,boss:true,title:'BOSS · 1페이지 재무 설계서',sub:'지금까지를 한 장으로',xp:250,
 story:'지도, 방패, 보물 위치를 한 장에 모은다. 이게 앞으로 1년의 공략집이다.',
 steps:[{t:'Claude 에 지금까지 만든 표들을 주고',cmd:'아래 자료로 1페이지 재무 설계서를 만들어줘: 순자산, 월 현금흐름, 비상금 현황, 부채 상환 계획, 목표 3개와 월 배분, 절세 계좌 계획. 특정 종목 추천은 빼고'}],
 clear:'1페이지 설계서가 있고, 월 배분 합계가 투입 가능 금액을 넘지 않는다.', badge:'설계 완료'},

{ch:'finance',chap:3,chapName:'자동 사냥 — 신경 안 써도 굴러가게'},
{id:'f-auto',track:'finance',chap:3,title:'자동이체 진법',sub:'월급날 자동 분배',xp:150,
 story:'의지력은 소모품이다. 월급 들어온 다음 날 자동으로 나뉘게 만든다.',
 steps:['월급 다음 날로 비상금·목표별 계좌 자동이체를 건다.','생활비 통장에는 남은 금액만 남긴다.','한 달 뒤 실제로 지켜졌는지 확인한다.'],
 clear:'자동이체 설정 화면을 캡처했다.'},
{id:'f-summon',track:'finance',chap:3,title:'소환진 — Claude Code 준비',sub:'재무 비서를 부를 준비',xp:120,
 story:'재무 비서는 Claude Code 안에서 일하는 동료다. 비서를 부르려면 먼저 소환진(Claude Code)을 그려야 한다. 에이전트 트랙의 설치 퀘스트와 같은 과정이다.',
 steps:[
  {t:'터미널에 붙여넣기',cmd:{mac:'curl -fsSL https://claude.ai/install.sh | bash',win:'irm https://claude.ai/install.ps1 | iex'}},
  {t:'터미널을 껐다 켠 뒤 확인',cmd:'claude --version'},
  {t:'작업 폴더를 만들고 들어간다',cmd:{mac:'mkdir -p ~/my-guild && cd ~/my-guild && git init',win:'mkdir $HOME\\my-guild; cd $HOME\\my-guild; git init'}},
  {t:'동료 소환',cmd:'claude'},
 ],
 tip:'터미널 여는 법을 모르면 에이전트 트랙의 "검은 창과 친해지기"를 참고한다. Windows는 git 이 없으면 git init 에서 에러가 난다 — 그 줄은 빼고 실행해도 된다.',
 clear:'claude 가 실행된다.'},
{id:'f-cfo',track:'finance',chap:3,title:'재무 비서 고용',sub:'월간 리포트를 쓰는 에이전트',xp:250,unlock:'cfo',
 story:'에이전트 트랙과 만나는 지점. 매달 거래내역을 주면 리포트를 써주는 동료를 둔다. 앞의 소환진 퀘스트를 깼다면 준비 끝.',
 steps:[
  'my-guild 폴더 안에 finance 폴더를 만든다. 1페이지 설계서를 finance/plan.md 로, 지난달 거래내역 CSV(개인정보 지운 것)를 finance/ 에 넣는다.',
  {t:'claude 에게 "아래 내용으로 .claude/agents/cfo.md 파일을 만들어줘"라고 하고 아래 내용을 붙여넣는다.',file:`---
name: cfo
description: 월간 가계 리포트가 필요할 때 사용. 거래내역 CSV를 읽고 설계서와 비교한다.
tools: Read, Write
---
너는 내 개인 재무 비서다.
- finance/plan.md (1페이지 설계서)를 기준으로 이번 달을 평가한다.
- 카테고리별 지출, 목표 대비 저축률, 이상 지출 3건을 보고한다.
- 특정 금융상품이나 종목을 추천하지 않는다.
- 개인정보가 보이면 분석 전에 알려준다.`},
  {t:'매달 1일',cmd:'cfo 에이전트로 finance/ 폴더의 지난달 거래내역을 분석해서 report-월.md 로 써줘'},
 ],
 clear:'첫 월간 리포트가 나왔다.', badge:'자산 관리 길드원'},
/* ===== 1인 창업 트랙 (폰으로 진행) ===== */
{ch:'founder',chap:0,chapName:'창업 전 결정 — 등록 전에 정할 4가지'},
{id:'b-name',track:'founder',chap:0,title:'상호 정하기',sub:'이름이 이미 쓰이고 있지 않은지',xp:60,
 story:'간판부터 단다. 다만 나중에 바꾸느라 고생하지 않게 겹치는 이름이 있는지 먼저 본다.',
 steps:['후보 이름 3개를 적는다.',
  {t:'특허청 상표 검색에서 같은·비슷한 이름이 교육/소프트웨어 분야에 등록돼 있는지 본다.',link:['키프리스 열기','https://www.kipris.or.kr']},
  '네이버·인스타·유튜브에서도 검색해 본다. 채널 이름과 계정 아이디를 미리 잡아두면 좋다.'],
 tip:'상호는 사업자등록증에 들어가는 이름이고, 상표권과는 별개다. 브랜드를 오래 쓸 생각이면 상표 출원도 나중에 검토한다.',
 clear:'최종 상호 1개와, 같은 이름 SNS 계정을 확보했다.'},
{id:'b-type',track:'founder',chap:0,title:'과세 유형 고르기',sub:'간이과세자 vs 일반과세자',xp:80,
 story:'처음 고르는 갈림길. 매출 규모와 누구에게 파는지가 기준이다.',
 steps:['예상 연매출을 적는다. (예: 코호트 6회 × 10명 × 24만원)',
  '간이과세자: 연매출이 기준 금액 미만일 때 고를 수 있고 부가세 부담이 적다. 대신 기업 고객에게 세금계산서를 못 끊는 경우가 있다.',
  '일반과세자: 병원·연구실·회사 워크숍(B2B)을 할 거라면 세금계산서 발행이 필요해 이쪽이 편하다.',
  {t:'Claude 에 물어보고 국세청 자료와 대조',cmd:'연매출 [금액], 개인 대상 온라인 교육 + 기업 워크숍을 할 예정인 개인사업자야. 간이과세자와 일반과세자 중 뭐가 유리한지, 올해 기준 금액과 함께 표로 비교해줘. 출처 링크도'}],
 warn:'기준 금액과 면세·과세 여부는 바뀐다. 첫 해에는 세무사 상담을 한 번 받는 걸 권한다.',
 clear:'과세 유형을 정했고, 그 이유를 한 줄로 적었다.'},
{id:'b-side',track:'founder',chap:0,title:'겸업 확인',sub:'직장·학교 규정 점검',xp:60,
 story:'본업이 있는 사람이 가장 많이 놓치는 퀘스트. 등록 전에 확인해야 뒤탈이 없다.',
 steps:['재직 중이면 회사 취업규칙의 겸업·겸직 조항을 확인한다.',
  '대학원생이면 연구과제 참여 조건이나 장학금 규정에 겸업 제한이 있는지 학과 행정실에 묻는다.',
  '공무원·공공기관 소속이면 겸직 허가 절차를 따른다.'],
 clear:'겸업해도 된다는 근거(규정 문구나 답변)를 저장해 뒀다.'},
{id:'b-addr',track:'founder',chap:0,boss:true,title:'BOSS · 사업장 주소',sub:'집 주소로 해도 될까',xp:100,
 story:'온라인 사업이면 대부분 집 주소로 등록할 수 있다. 다만 서류가 필요할 수 있다.',
 steps:['자가: 별도 서류 없이 진행하는 경우가 많다.',
  '전·월세: 임대차계약서 사진을 준비한다. 계약서상 사업자 등록이 제한돼 있는지도 본다.',
  '집 주소 노출이 싫다면 공유오피스·비상주 사무실 주소 서비스를 알아본다. 통신판매업 신고를 하면 주소가 공개된다.'],
 clear:'상호, 과세 유형, 겸업 확인, 주소 — 4가지가 모두 정해졌다.', badge:'창업 결심'},

{ch:'founder',chap:1,chapName:'폰으로 등록 — 사업자등록과 사업용 계좌'},
{id:'b-reg',track:'founder',chap:1,title:'사업자등록 신청',sub:'손택스(홈택스 앱)에서 10분',xp:150,
 story:'세무서에 안 가도 된다. 폰으로 신청하고 며칠 기다리면 된다.',
 steps:[{t:'앱스토어/플레이스토어에서 "손택스" 설치 → 간편인증 로그인 (PC는 홈택스)',link:['홈택스 열기','https://www.hometax.go.kr']},
  '메뉴에서 "신청/제출 → 사업자등록 신청(개인)" 을 찾는다.',
  '상호, 주소, 개업일, 업종을 입력한다. 업종은 "업종코드 검색"에서 교육·정보서비스 관련 코드를 찾고, 온라인으로 팔 거면 통신판매 관련 업종도 함께 넣는다.',
  '과세 유형, 사업용 이메일을 입력하고 필요하면 임대차계약서 사진을 첨부해 제출한다.'],
 tip:'업종코드가 헷갈리면 제출 전에 국세청 상담센터(126)에 "온라인 교육·코칭 판매" 업종코드를 물어보는 게 가장 빠르다.',
 clear:'사업자등록 신청 접수 완료 화면을 캡처했다. 승인되면 손택스에서 등록증을 내려받는다.'},
{id:'b-bank',track:'founder',chap:1,title:'사업용 계좌·카드',sub:'개인 돈과 사업 돈 분리',xp:100,
 story:'개인 통장으로 사업 돈을 받으면 연말에 지옥을 본다. 처음부터 나눈다.',
 steps:['등록증이 나오면 은행 앱에서 개인사업자 계좌를 연다 (등록증 필요).',
  '사업 지출 전용 카드를 하나 정한다 (체크카드도 된다).',
  '손택스/홈택스에서 사업용 계좌와 사업용 카드를 등록한다. 카드 내역이 자동으로 모여 장부가 쉬워진다.'],
 clear:'사업용 계좌와 카드가 홈택스에 등록돼 있다.'},

{ch:'founder',chap:2,chapName:'돈 받을 준비 — 결제·신고·약관'},
{id:'b-pay',track:'founder',chap:2,title:'결제 수단 고르기',sub:'처음엔 단순하게',xp:120,
 story:'1~2기 열 명에게 PG 연동은 과하다. 규모에 맞춰 올린다.',
 steps:['1~2기: 사업용 계좌 이체 + 현금영수증 발급(손택스에서 가능)으로 충분하다.',
  '3기~: 카드 결제가 필요해지면 결제 링크 서비스나 PG사(결제대행사) 가입을 알아본다. 사업자등록증과 사업용 계좌가 필요하다.',
  '정기 구독 상품을 낼 때는 정기결제를 지원하는 PG인지 확인한다.'],
 clear:'1기·2기에 쓸 결제 방법을 정했다.'},
{id:'b-online',track:'founder',chap:2,title:'통신판매업 신고',sub:'온라인으로 팔기 전에',xp:120,
 story:'인터넷으로 상품을 팔면 대부분 신고 대상이다. 정부24 앱으로 할 수 있다.',
 steps:[{t:'정부24에서 "통신판매업 신고" 검색',link:['정부24 열기','https://www.gov.kr']},
  '사업자등록증과, 결제 방식에 따라 구매안전서비스 이용확인증(은행·PG에서 발급)을 준비한다.',
  '처리되면 신고번호를 받는다. 판매 페이지 하단에 상호, 대표자, 사업자번호, 통신판매업 신고번호, 주소, 연락처를 표시한다.'],
 warn:'거래 규모나 과세 유형에 따라 면제되는 경우도 있다. 신청 화면의 안내나 구청 담당 부서에 먼저 확인한다.',
 clear:'통신판매업 신고번호를 받았다 (또는 면제 대상임을 확인했다).'},
{id:'b-terms',track:'founder',chap:2,boss:true,title:'BOSS · 약관 3종',sub:'이용약관·환불규정·개인정보처리방침',xp:200,
 story:'돈과 개인정보를 받는 순간 필요한 방패. AI가 초안을 쓰고, 사람이 확인한다.',
 steps:[{t:'Claude 에게 초안 요청',cmd:'온라인 코호트 교육(4주, 라이브+단톡방)을 파는 개인사업자야. 이용약관, 환불 규정, 개인정보처리방침 초안을 써줘. 환불은 시작 전 전액, 1주차 이후 비례 환불 기준으로. 수집 항목은 이름, 연락처, 진행 기록'},
  '초안을 공정거래위원회 표준약관, 개인정보보호위원회 작성 지침과 비교해 빠진 항목을 채운다.',
  '판매 페이지 하단에 세 문서를 링크한다.'],
 warn:'AI 초안은 출발점일 뿐이다. 유료 판매 전에 한 번은 전문가 검토를 받는다.',
 clear:'세 문서가 판매 페이지에 걸려 있다.', badge:'영업 준비 완료'},

{ch:'founder',chap:3,chapName:'첫 매출 — 무료 1기에서 유료 2기로',season2:true},
{id:'b-page',track:'founder',chap:3,title:'판매 페이지 한 장',sub:'노션 한 페이지면 충분',xp:150,
 story:'설명이 길면 안 산다. 누구를, 무엇까지, 얼마에, 언제.',
 steps:['1기 결과에서 숫자 2개와 후기 2개를 고른다 (예: 10명 중 8명 첫 소환 성공).',
  {t:'Claude 에 초안 요청',cmd:'아래 1기 결과로 2기 모집 페이지를 써줘. 대상, 4주 동안 얻는 것, 일정, 가격, 환불 규정 링크, 사업자 정보 표시 순서로. 과장 표현은 빼고 [결과와 후기 붙여넣기]'},
  '폰에서 열어 30초 안에 가격과 날짜가 보이는지 확인한다.'],
 clear:'2기 모집 페이지 링크가 있다.'},
{id:'b-first',track:'founder',chap:3,boss:true,title:'BOSS · 첫 매출',sub:'첫 입금과 첫 증빙',xp:300,
 story:'금액보다 의미가 크다. 이 순간부터 진짜 사업이다.',
 steps:['1기 졸업생과 그 지인에게 먼저 링크를 보낸다.',
  '입금이 들어오면 손택스에서 현금영수증을 발급하거나, 카드 결제면 PG 정산 내역을 확인한다.',
  '매출 기록 시트에 날짜, 이름, 금액, 증빙 종류를 적는다.'],
 clear:'첫 유료 결제가 들어왔고 증빙까지 끝냈다.', badge:'첫 매출'},

{ch:'founder',chap:4,chapName:'세금 루틴 — AI 경리에게 맡기기',season2:true},
{id:'b-tax',track:'founder',chap:4,title:'세금 달력 등록',sub:'놓치면 가산세',xp:120,
 story:'개인사업자의 큰 이벤트는 부가세 신고와 5월 종합소득세 신고다.',
 steps:[{t:'Claude 에 물어보고 캘린더에 등록',cmd:'[간이/일반]과세 개인사업자의 올해 부가세·종합소득세 신고·납부 기한을 알려주고, 내 구글 캘린더에 2주 전 알림과 함께 등록해줘'},
  '등록된 날짜를 국세청 신고 일정과 한 번 대조한다.'],
 clear:'신고 기한이 캘린더에 알림과 함께 들어가 있다.'},
{id:'b-books',track:'founder',chap:4,title:'AI 경리 고용',sub:'매달 장부를 정리하는 에이전트',xp:250,unlock:'bookkeeper',
 story:'에이전트 트랙에서 배운 걸 회사에 쓴다. 이 회사의 첫 번째 직원.',
 steps:[{t:'.claude/agents/bookkeeper.md',file:`---
name: bookkeeper
description: 매달 사업 매출·지출을 정리할 때 사용. 매출 시트와 사업용 카드 내역을 읽는다.
tools: Read, Write
---
너는 1인 사업자의 경리다.
- books/ 폴더의 매출 기록과 카드 내역 CSV로 월별 매출, 비용, 남은 돈을 정리한다.
- 증빙이 빠진 매출이 있으면 목록으로 알려준다.
- 다음 신고 기한까지 남은 날짜를 맨 위에 적는다.
- 세법 판단이 필요한 부분은 "세무사 확인 필요"로 표시하고 단정하지 않는다.`},
  {t:'매달 1일',cmd:'bookkeeper 로 지난달 장부 정리해서 books/월.md 로 써줘'}],
 clear:'첫 월간 장부가 나왔다.', badge:'1인 회사 가동'},
];

/* ---------- 레벨 / 사무실 / 검증 ---------- */
const LV=[0,100,250,450,700,1000,1400,1900,2500,3200,4000,4800,5600,6400];
const OFFICE=[['intern','신입 인턴'],['researcher','리서처'],['secretary','비서'],['writer','내 커스텀'],['analyst','커넥터'],['builder','스킬북'],['cfo','재무 비서'],['bookkeeper','AI 경리']];
/* 동료별 첫 업무(사무실 말풍선) */
const FIRSTJOB={intern:'todo.md',researcher:'research.md',secretary:'회의 일정 메일 초안',writer:'내 업무 결과물 1건',analyst:'이번 주 빈 2시간 블록',builder:'weekly-report 보고서',cfo:'첫 월간 리포트',bookkeeper:'첫 월간 장부'};
const VERIFY={'a-term':/(\/Users\/|C:\\Users\\|\/home\/)/,'a-git':/git version \d/,'a-install':/\d+\.\d+\.\d+/,'f-summon':/\d+\.\d+\.\d+/};
