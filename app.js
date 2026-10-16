'use strict';

// ===== 設定 =====
// Google Apps Script のウェブアプリURL（docs/setup.md の手順で取得して貼り付ける）
// 空のままだと、投稿はこの端末の中にだけ保存される
const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxCM3N4URUm2F7CsDSbMHFf6Nm6zh0jf3L8ibjaB6SkQ0i_jlCsA4V0wx_rG-rmQ3H_/exec';
// Apps Script 側（gas/code.gs）と同じ合言葉にする
const SHARED_TOKEN = 'vmy-voice-key-99';

const CATEGORIES = ['住まい', '家電・機器', 'お金・手続き', '健康', '人間関係', '仕事・学校', 'デジタル', '買い物', '移動', 'その他'];
const LEVELS = [
  { value: 1, label: '😐 ちょっと' },
  { value: 2, label: '😣 かなり' },
  { value: 3, label: '😱 すごく' },
];
// 話した・書いた言葉から分野を自動で選ぶためのキーワード
const CATEGORY_KEYWORDS = {
  '住まい': ['家', '部屋', 'アパート', 'マンション', '家賃', '大家', '引っ越', '水漏れ', '雨漏り', 'トイレ', '風呂', 'お風呂', '台所', 'キッチン', '掃除', '洗濯', 'ゴミ', 'ごみ', '近所', '騒音', '虫', 'カビ', '鍵', 'ドア', '窓', '庭'],
  '家電・機器': ['家電', 'エアコン', '冷蔵庫', '洗濯機', '電子レンジ', 'レンジ', 'テレビ', '掃除機', '炊飯器', 'ドライヤー', '電球', 'リモコン', '電池', '充電器', 'プリンター', 'プリンタ', '故障', '壊れ', '動かない', 'つかない', '電源'],
  'お金・手続き': ['お金', '金', '支払い', '払', '料金', '請求', '税金', '年金', '保険', '銀行', '口座', '振込', '振り込み', 'ローン', '給料', '給与', '節約', '高い', '値上', '役所', '手続き', '申請', '書類', '届け出', 'マイナンバー', '免許', '契約', '解約'],
  '健康': ['体調', '病院', '医者', '歯医者', '薬', '痛い', '痛む', '痛くて', '頭痛', '腰', '肩', '熱', '風邪', 'かぜ', '咳', 'せき', '花粉', 'アレルギー', '眠れ', '寝不足', '睡眠', '疲れ', 'だるい', '健康', '体重', 'ダイエット', '目が', '病気', 'けが', '怪我'],
  '人間関係': ['友達', '友人', '家族', '親', '母', '父', '夫', '妻', '旦那', '子ども', '子供', '息子', '娘', '彼氏', '彼女', '恋人', '上司', '同僚', '先輩', '後輩', '近所の人', '人間関係', 'けんか', '喧嘩', '言われ', '無視', '気まず', '連絡', '返事', 'LINE', 'ライン'],
  '仕事・学校': ['仕事', '会社', '職場', '出勤', '残業', '会議', '取引先', 'お客', 'バイト', 'アルバイト', '転職', '就職', '面接', '学校', '授業', '宿題', '課題', 'テスト', '試験', '勉強', '先生', '部活', '締め切り', '締切', 'シフト'],
  'デジタル': ['スマホ', '携帯', 'iPhone', 'アイフォン', 'Android', 'アンドロイド', 'パソコン', 'PC', 'アプリ', 'ネット', 'インターネット', 'Wi-Fi', 'WiFi', 'ワイファイ', 'パスワード', 'ログイン', 'アカウント', 'メール', '通知', '更新', 'アップデート', 'ダウンロード', 'インストール', 'サイト', 'ホームページ', '画面', '設定', 'データ', '写真', '容量', 'ウイルス', '詐欺'],
  '買い物': ['買い物', '買', 'お店', '店', 'スーパー', 'コンビニ', '通販', 'ネットショッピング', 'Amazon', 'アマゾン', '楽天', '注文', '配達', '宅配', '届かない', '返品', '品切れ', '売り切れ', 'レジ', 'ポイント', 'セール'],
  '移動': ['電車', 'バス', 'タクシー', '車', '運転', '駐車', '渋滞', '道', '道路', '自転車', '駅', '乗り換え', '遅延', '遅れ', '飛行機', '新幹線', '道に迷', '迷子', '通勤', '通学', '徒歩', '歩い', 'ガソリン'],
};
// 話した・書いた言葉から困り度を自動で選ぶためのキーワード（強い言葉を優先する）
const LEVEL_KEYWORDS = [
  { value: 3, words: ['最悪', '最低', 'どうしよう', '限界', '無理', '絶望', '泣きそう', '泣いた', 'めちゃくちゃ', 'めっちゃ', 'すごく困', 'ほんとに困', '本当に困', '大変', 'ひどい'] },
  { value: 2, words: ['かなり', 'けっこう', '結構', '不便', 'イライラ', 'いらいら', '面倒', 'めんどう', 'めんどくさ', 'しんどい', 'つらい', '辛い', '嫌'] },
  { value: 1, words: ['ちょっと', '少し', 'すこし', '少々', '地味に', 'なんとなく', 'まあまあ', '軽く', 'たまに'] },
];
const PRAISES = [
  '今日も記録できました！',
  '話してくれてありがとう！',
  'いい調子です！',
  'ナイス記録！',
  '今日の分、ちゃんと残りました',
  'その調子でまた明日も！',
  '記録えらい！',
];
// ランキングから外すありふれた言葉
const STOP_WORDS = new Set([
  'こと', 'もの', 'ある', 'いる', 'する', 'なる', 'れる', 'られる', 'ない', 'てる', 'です', 'ます',
  'けど', 'けれど', 'から', 'ので', 'でも', 'それ', 'これ', 'あれ', 'どれ', 'この', 'その', 'あの',
  'ちょっと', 'なんか', 'とても', 'すごく', 'やっぱり', '今日', '困っ', '困る', '困り', '困った',
  '思う', '思っ', '感じ', 'みたい', 'よう', 'ところ', 'とき', 'ため', 'まだ', 'もう', 'あと',
]);
// 音声入力で何も聞き取れない状態がこの時間続いたら自動で止める（ミリ秒）
const SILENCE_TIMEOUT = 15000;

const STORAGE_KEY = 'voicefix-posts';
const INTRO_KEY = 'voicefix-intro-done';
const REMINDER_KEY = 'voicefix-reminder-time';

// ===== 画面の要素 =====
const $ = (id) => document.getElementById(id);
const micButton = $('mic-button');
const micHint = $('mic-hint');
const textInput = $('text-input');
const submitButton = $('submit-button');
const noneButton = $('none-button');
const syncStatus = $('sync-status');
const todayStatus = $('today-status');
const celebration = $('celebration');
const intro = $('intro');

// ===== 保存（localStorage） =====
function loadPosts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function savePosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // 保存できない環境（プライベートブラウズなど）では何もしない
  }
}

function getSetting(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 保存できなくても動作は続ける
  }
}

// ===== 日付まわり =====
const pad = (n) => String(n).padStart(2, '0');

// 端末の時刻で「YYYY-MM-DD」を作る
function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function postedDays(posts) {
  return new Set(posts.map((p) => toDateKey(new Date(p.createdAt))));
}

function makeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ===== 分野・困り度の選択 =====
let selectedCategory = '';
let selectedLevel = 0;
// 利用者が自分で選んだら、その項目は自動で変えない
let categoryChosenByUser = false;
let levelChosenByUser = false;

// 文章に含まれるキーワードから分野を推測する（長い言葉ほど具体的なので重く数える）
function guessCategory(text) {
  let best = '';
  let bestScore = 0;
  CATEGORIES.forEach((name) => {
    const score = (CATEGORY_KEYWORDS[name] || [])
      .filter((word) => text.includes(word))
      .reduce((sum, word) => sum + word.length, 0);
    if (score > bestScore) {
      best = name;
      bestScore = score;
    }
  });
  return best;
}

// 文章に含まれる言葉から困り度を推測する（強いほうを優先）
function guessLevel(text) {
  const hit = LEVEL_KEYWORDS.find(({ words }) => words.some((word) => text.includes(word)));
  return hit ? hit.value : 0;
}

// 入力が変わるたびに、自分で選んでいない項目だけ自動で選び直す
function autoSelectOptions() {
  const text = textInput.value;
  const category = categoryChosenByUser ? selectedCategory : guessCategory(text);
  const level = levelChosenByUser ? selectedLevel : guessLevel(text);
  if (category === selectedCategory && level === selectedLevel) return;
  selectedCategory = category;
  selectedLevel = level;
  renderChips();
}

function renderChips() {
  const categoryBox = $('category-chips');
  const levelBox = $('level-chips');
  categoryBox.innerHTML = '';
  levelBox.innerHTML = '';

  CATEGORIES.forEach((name) => {
    categoryBox.append(makeChip(name, selectedCategory === name, () => {
      // もう一度押すと選択を外せる
      selectedCategory = selectedCategory === name ? '' : name;
      categoryChosenByUser = true;
      renderChips();
    }));
  });

  LEVELS.forEach(({ value, label }) => {
    levelBox.append(makeChip(label, selectedLevel === value, () => {
      selectedLevel = selectedLevel === value ? 0 : value;
      levelChosenByUser = true;
      renderChips();
    }));
  });

  // 閉じたままでも、何が選ばれているかわかるようにする
  const levelLabel = (LEVELS.find((l) => l.value === selectedLevel) || {}).label;
  const picked = [selectedCategory, levelLabel].filter(Boolean);
  $('options-summary').textContent = picked.length
    ? `${picked.join(' ／ ')}（タップで変更）`
    : '分野と困り度をえらぶ（なくてもOK）';
}

function makeChip(label, pressed, onClick) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.textContent = label;
  chip.setAttribute('aria-pressed', String(pressed));
  chip.addEventListener('click', onClick);
  return chip;
}

// ===== 音声入力 =====
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let wantListening = false; // 利用者が録音を続けたいかどうか
let isRecognizing = false; // 音声認識が実際に動いているかどうか
let textBefore = '';       // カーソルより前の文字
let textAfter = '';        // カーソルより後の文字
let finalText = '';        // 今回の認識で確定した文字
let caretPos = null;       // 最後に入力欄で選んでいたカーソル位置
let silenceTimer = null;
let usedVoice = false;
let usedKeyboard = false;

function setupSpeech() {
  if (!SpeechRecognition) {
    // 音声入力に対応していないブラウザでは手入力だけにする
    micButton.hidden = true;
    micHint.textContent = 'このブラウザは音声入力に対応していません。下の欄に文字で書いてください。';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'ja-JP';
  recognition.interimResults = true;
  // Android の Chrome は continuous=true だと文字が重複するため、
  // 1回ずつ認識して、終わったら自動で再開する方式にする
  recognition.continuous = false;

  recognition.onresult = (event) => {
    let interim = '';
    finalText = '';
    for (let i = 0; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += transcript;
      else interim += transcript;
    }
    textInput.value = textBefore + finalText + interim + textAfter;
    caretPos = (textBefore + finalText + interim).length;
    usedVoice = true;
    resetSilenceTimer();
    updateSubmitState();
    autoSelectOptions();
  };

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      wantListening = false;
      micHint.textContent = 'マイクが許可されていません。ブラウザの設定でマイクを許可するか、文字で書いてください。';
    } else if (event.error === 'network') {
      wantListening = false;
      micHint.textContent = '通信できないため音声入力が使えません。文字で書いてください。';
    }
    // no-speech（無音）などは onend で再開するので何もしない
  };

  recognition.onend = () => {
    isRecognizing = false;
    // 確定した文字を「カーソルより前」に取り込んでから次の認識へ
    textBefore += finalText;
    finalText = '';
    if (wantListening) {
      startRecognition();
    } else {
      updateMicView();
    }
  };
}

function startRecognition() {
  try {
    recognition.start();
    isRecognizing = true;
  } catch {
    // すでに動いている場合などは無視する
  }
  updateMicView();
}

function startListening() {
  // カーソル位置に話した内容を差し込む
  const value = textInput.value;
  const pos = caretPos === null ? value.length : Math.min(caretPos, value.length);
  textBefore = value.slice(0, pos);
  textAfter = value.slice(pos);
  finalText = '';
  wantListening = true;
  resetSilenceTimer();
  startRecognition();
}

function stopListening() {
  wantListening = false;
  clearTimeout(silenceTimer);
  if (recognition && isRecognizing) recognition.stop();
  updateMicView();
}

function resetSilenceTimer() {
  clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => {
    stopListening();
    micHint.textContent = '声が聞こえなかったので止めました。もう一度タップして話せます。';
  }, SILENCE_TIMEOUT);
}

function updateMicView() {
  micButton.classList.toggle('is-listening', wantListening);
  micButton.setAttribute('aria-pressed', String(wantListening));
  micButton.setAttribute('aria-label', wantListening ? '録音を止める' : '話しはじめる');
  if (wantListening) micHint.textContent = '聞いています…終わったらもう一度タップ';
  else if (micHint.textContent.startsWith('聞いています')) micHint.textContent = 'タップして話す（続きも話せます）';
}

// ===== 投稿 =====
function updateSubmitState() {
  submitButton.disabled = textInput.value.trim() === '';
}

function inputMethodOf() {
  if (usedVoice && usedKeyboard) return 'mixed';
  if (usedVoice) return 'voice';
  return 'text';
}

function resetForm() {
  textInput.value = '';
  caretPos = null;
  selectedCategory = '';
  selectedLevel = 0;
  categoryChosenByUser = false;
  levelChosenByUser = false;
  usedVoice = false;
  usedKeyboard = false;
  $('category-chips').closest('details').open = false;
  micHint.textContent = 'タップして話す';
  renderChips();
  updateSubmitState();
}

function addPost(isNone) {
  if (wantListening) stopListening();
  const text = textInput.value.trim();
  if (!isNone && !text) return;

  const posts = loadPosts();
  const post = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    text: isNone ? '' : text,
    category: isNone ? '' : selectedCategory,
    level: isNone ? 0 : selectedLevel,
    inputMethod: isNone ? 'none' : inputMethodOf(),
    synced: false,
  };
  const postedBefore = postedDays(posts).has(toDateKey(new Date()));
  posts.push(post);
  savePosts(posts);

  resetForm();
  renderAll();
  showCelebration(postedBefore, isNone);
  syncPending();
}

// ===== 送信後のお祝い =====
let celebrationTimer = null;

function showCelebration(postedBefore, isNone) {
  $('celebration-emoji').textContent = isNone ? '🌤️' : '👍';
  $('celebration-title').textContent = '記録しました';

  let message = PRAISES[Math.floor(Math.random() * PRAISES.length)];
  if (isNone) message = '困りごとなしの日も記録できました。いい一日でしたね。';
  else if (postedBefore) message = '追加ありがとう！何件でも送れます。';
  $('celebration-message').textContent = message;

  celebration.hidden = false;
  clearTimeout(celebrationTimer);
  celebrationTimer = setTimeout(hideCelebration, 2200);
}

function hideCelebration() {
  celebration.hidden = true;
}

// ===== 送信（Google スプレッドシートへ） =====
let syncing = false;

function markSynced(id) {
  const posts = loadPosts();
  const target = posts.find((p) => p.id === id);
  if (target) {
    target.synced = true;
    savePosts(posts);
  }
}

async function syncPending() {
  if (!ENDPOINT_URL || syncing || !navigator.onLine) {
    renderSyncStatus();
    return;
  }
  syncing = true;
  try {
    const pending = loadPosts().filter((p) => !p.synced);
    for (const post of pending) {
      try {
        // Apps Script は CORS の制約があるため no-cors で送る（届いたかどうかの中身は読めない）
        await fetch(ENDPOINT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            token: SHARED_TOKEN,
            id: post.id,
            createdAt: post.createdAt,
            text: post.text,
            category: post.category,
            level: post.level,
            inputMethod: post.inputMethod,
          }),
        });
        markSynced(post.id);
      } catch {
        // 通信に失敗したら次の機会に再送する
        break;
      }
    }
  } finally {
    syncing = false;
    renderSyncStatus();
  }
}

function renderSyncStatus() {
  const count = loadPosts().filter((p) => !p.synced).length;
  if (!ENDPOINT_URL) {
    syncStatus.textContent = '';
  } else if (count > 0) {
    syncStatus.textContent = `未送信 ${count}件（通信できたときに自動で送ります）`;
  } else {
    syncStatus.textContent = '';
  }
}

// ===== 投稿画面の表示 =====
function renderPostView(posts) {
  const today = toDateKey(new Date());
  const todayCount = posts.filter((p) => toDateKey(new Date(p.createdAt)) === today).length;
  if (todayCount > 0) {
    todayStatus.textContent = `今日は記録済み ✓（${todayCount}件）何件でも送れます`;
  } else {
    todayStatus.textContent = 'ひとこと話すだけでOK';
  }
}

// ===== 記録画面（カレンダーと履歴） =====
const viewMonth = new Date();
viewMonth.setDate(1);

function renderRecordView(posts) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  $('calendar-title').textContent = `${year}年${month + 1}月`;

  const days = postedDays(posts);
  const calendar = $('calendar');
  calendar.innerHTML = '';
  ['日', '月', '火', '水', '木', '金', '土'].forEach((w) => {
    const cell = document.createElement('div');
    cell.className = 'calendar-weekday';
    cell.textContent = w;
    calendar.append(cell);
  });

  // 1日の曜日まで空白を入れる
  const firstWeekday = new Date(year, month, 1).getDay();
  for (let i = 0; i < firstWeekday; i++) calendar.append(document.createElement('div'));

  const lastDay = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(new Date());
  let stampedCount = 0;
  for (let day = 1; day <= lastDay; day++) {
    const key = toDateKey(new Date(year, month, day));
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    cell.textContent = day;
    if (days.has(key)) {
      cell.classList.add('is-stamped');
      cell.setAttribute('aria-label', `${day}日 記録あり`);
      stampedCount++;
    }
    if (key === todayKey) cell.classList.add('is-today');
    calendar.append(cell);
  }
  $('month-summary').textContent = `この月は ${stampedCount}日 記録しました`;

  // この月の投稿を新しい順に日付ごとに表示
  const history = $('history');
  history.innerHTML = '';
  const monthPosts = posts
    .filter((p) => {
      const d = new Date(p.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (monthPosts.length === 0) {
    history.innerHTML = '<p class="empty-message">この月の記録はまだありません</p>';
    return;
  }

  let currentKey = '';
  monthPosts.forEach((post) => {
    const d = new Date(post.createdAt);
    const key = toDateKey(d);
    if (key !== currentKey) {
      currentKey = key;
      const heading = document.createElement('h3');
      heading.className = 'history-date';
      heading.textContent = `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`;
      history.append(heading);
    }
    history.append(makeHistoryItem(post, d));
  });
}

function makeHistoryItem(post, date) {
  const item = document.createElement('article');
  item.className = 'history-item';

  const meta = document.createElement('div');
  meta.className = 'history-meta';
  const time = document.createElement('span');
  time.textContent = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  meta.append(time);
  if (post.category) meta.append(makeTag(post.category));
  const level = LEVELS.find((l) => l.value === post.level);
  if (level) meta.append(makeTag(level.label));

  const text = document.createElement('p');
  text.className = 'history-text';
  if (post.inputMethod === 'none') {
    text.classList.add('is-none');
    text.textContent = '🌤️ 困りごとなし';
  } else {
    text.textContent = post.text;
  }

  item.append(meta, text);
  return item;
}

function makeTag(label) {
  const tag = document.createElement('span');
  tag.className = 'history-tag';
  tag.textContent = label;
  return tag;
}

// ===== ランキング画面 =====
let rankingPeriod = 'week';

function filterByPeriod(posts, period) {
  const now = new Date();
  let from = null;
  if (period === 'week') {
    // 月曜はじまりで今週を数える
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
  } else if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return posts.filter((p) => p.inputMethod !== 'none' && (!from || new Date(p.createdAt) >= from));
}

function extractWords(text) {
  if (!window.Intl || !Intl.Segmenter) return [];
  const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
  const words = [];
  for (const { segment, isWordLike } of segmenter.segment(text)) {
    if (!isWordLike) continue;
    const word = segment.trim();
    if (word.length < 2) continue;
    if (/^[0-9０-９]+$/.test(word)) continue;
    // 短いひらがなだけの言葉（助詞や語尾）は除く
    if (/^[ぁ-ゟー]+$/.test(word) && word.length <= 3) continue;
    if (STOP_WORDS.has(word)) continue;
    words.push(word);
  }
  return words;
}

function renderRankingView(posts) {
  const target = filterByPeriod(posts, rankingPeriod);

  // 分野別
  const categoryBox = $('category-ranking');
  categoryBox.innerHTML = '';
  const categoryCounts = countBy(target.filter((p) => p.category).map((p) => p.category));
  if (categoryCounts.length === 0) {
    categoryBox.innerHTML = '<p class="empty-message">分野をえらんだ投稿がまだありません</p>';
  } else {
    const max = categoryCounts[0][1];
    categoryCounts.forEach(([name, count], i) => {
      const row = document.createElement('div');
      row.className = 'ranking-row';
      row.innerHTML = `
        <span class="ranking-rank">${i + 1}</span>
        <span class="ranking-name"></span>
        <span class="ranking-bar" style="width:${Math.max(8, (count / max) * 100)}%"></span>
        <span class="ranking-count">${count}件</span>`;
      row.querySelector('.ranking-name').textContent = name;
      categoryBox.append(row);
    });
  }

  // よく出る言葉
  const wordBox = $('word-ranking');
  wordBox.innerHTML = '';
  if (!window.Intl || !Intl.Segmenter) {
    wordBox.innerHTML = '<p class="empty-message">このブラウザでは言葉の集計ができません</p>';
    return;
  }
  const wordCounts = countBy(target.flatMap((p) => extractWords(p.text))).slice(0, 10);
  if (wordCounts.length === 0) {
    wordBox.innerHTML = '<p class="empty-message">まだ集計できる言葉がありません</p>';
    return;
  }
  wordCounts.forEach(([word, count]) => {
    const li = document.createElement('li');
    li.textContent = word;
    const countSpan = document.createElement('span');
    countSpan.className = 'word-count';
    countSpan.textContent = `${count}回`;
    li.append(countSpan);
    wordBox.append(li);
  });
}

// 出てきた回数を数えて多い順に並べる
function countBy(items) {
  const map = new Map();
  items.forEach((item) => map.set(item, (map.get(item) || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

// ===== 画面切り替え =====
function showView(name) {
  document.querySelectorAll('.view').forEach((view) => {
    view.hidden = view.dataset.view !== name;
  });
  document.querySelectorAll('.tab').forEach((tab) => {
    if (tab.dataset.target === name) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  if (name !== 'post' && wantListening) stopListening();
  window.scrollTo(0, 0);
}

function renderAll() {
  const posts = loadPosts();
  renderPostView(posts);
  renderRecordView(posts);
  renderRankingView(posts);
  renderSyncStatus();
}

// ===== 毎日の通知（カレンダー登録用 .ics ファイル） =====
function downloadReminder(time) {
  const [hour, minute] = time.split(':').map(Number);
  const start = new Date();
  start.setHours(hour, minute, 0, 0);
  if (start < new Date()) start.setDate(start.getDate() + 1);

  const local = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const utc = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const appUrl = location.href.split('#')[0];

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VoiceFix//Reminder//JA',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:voicefix-reminder-${Date.now()}@voicefix`,
    `DTSTAMP:${utc}`,
    `DTSTART:${local(start)}`,
    'DURATION:PT5M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:🎤 今日の困りごとを話そう',
    `DESCRIPTION:ひとこと話すだけでOK！\\n${appUrl}`,
    `URL:${appUrl}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:今日の困りごとを話そう',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'voicefix-reminder.ics';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

// ===== ホーム画面への追加（Android の Chrome など） =====
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  $('install-button').hidden = false;
});

// ===== イベント登録 =====
function setupEvents() {
  micButton.addEventListener('click', () => {
    if (wantListening) stopListening();
    else startListening();
  });

  // キーボードで入力したらカーソル位置と入力方法を記録
  textInput.addEventListener('input', () => {
    if (!wantListening) usedKeyboard = true;
    caretPos = textInput.selectionStart;
    updateSubmitState();
    autoSelectOptions();
  });
  ['click', 'keyup', 'select', 'blur'].forEach((type) => {
    textInput.addEventListener(type, () => {
      if (!wantListening) caretPos = textInput.selectionStart;
    });
  });
  // 録音中に入力欄を触ったら、手入力を優先して録音を止める
  textInput.addEventListener('focus', () => {
    if (wantListening) stopListening();
  });

  submitButton.addEventListener('click', () => addPost(false));
  noneButton.addEventListener('click', () => addPost(true));
  celebration.addEventListener('click', hideCelebration);

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => showView(tab.dataset.target));
  });

  $('prev-month').addEventListener('click', () => {
    viewMonth.setMonth(viewMonth.getMonth() - 1);
    renderRecordView(loadPosts());
  });
  $('next-month').addEventListener('click', () => {
    viewMonth.setMonth(viewMonth.getMonth() + 1);
    renderRecordView(loadPosts());
  });

  document.querySelectorAll('.period-tab').forEach((button) => {
    button.addEventListener('click', () => {
      rankingPeriod = button.dataset.period;
      document.querySelectorAll('.period-tab').forEach((b) => {
        b.setAttribute('aria-pressed', String(b === button));
      });
      renderRankingView(loadPosts());
    });
  });

  // はじめに
  const reminderTime = $('reminder-time');
  reminderTime.value = getSetting(REMINDER_KEY) || '20:00';
  $('open-intro').addEventListener('click', () => intro.showModal());
  $('intro-close').addEventListener('click', () => {
    setSetting(INTRO_KEY, '1');
    intro.close();
  });
  $('reminder-button').addEventListener('click', () => {
    setSetting(REMINDER_KEY, reminderTime.value);
    downloadReminder(reminderTime.value || '20:00');
  });
  $('install-button').addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $('install-button').hidden = true;
  });

  // 通信が戻ったら未送信分を送る
  window.addEventListener('online', syncPending);
  // 日付が変わったときのために、アプリに戻ってきたら表示を更新
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      renderAll();
      syncPending();
    }
  });
}

// ===== 起動 =====
function init() {
  renderChips();
  setupSpeech();
  setupEvents();
  renderAll();
  syncPending();

  if (!getSetting(INTRO_KEY)) intro.showModal();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
}

init();
