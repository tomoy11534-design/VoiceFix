// VoiceFix の投稿を受け取って、このスプレッドシートに1行ずつ保存する

// app.js の SHARED_TOKEN と同じ合言葉にする
const SHARED_TOKEN = 'vmy-voice-key-99';
const SHEET_NAME = '投稿';
const HEADERS = ['投稿ID', '投稿日時', '困りごと', '分野', '困り度', '入力方法', '受信日時'];
const LEVEL_LABELS = { 1: 'ちょっと', 2: 'かなり', 3: 'すごく' };
const METHOD_LABELS = { voice: '音声', text: '手入力', mixed: '音声＋手入力', none: '困りごとなし' };

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.token !== SHARED_TOKEN) return respond({ ok: false, error: 'invalid token' });

    const sheet = getSheet();
    // 再送で同じ投稿が2回届いても重複させない
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      if (ids.includes(data.id)) return respond({ ok: true, duplicate: true });
    }

    sheet.appendRow([
      data.id,
      new Date(data.createdAt),
      String(data.text || '').slice(0, 5000),
      data.category || '',
      LEVEL_LABELS[data.level] || '',
      METHOD_LABELS[data.inputMethod] || data.inputMethod || '',
      new Date(),
    ]);
    return respond({ ok: true });
  } catch (error) {
    return respond({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

// シートがなければ見出し付きで作る
function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange('B:B').setNumberFormat('yyyy/mm/dd hh:mm');
    sheet.getRange('G:G').setNumberFormat('yyyy/mm/dd hh:mm');
    sheet.setColumnWidth(3, 400);
  }
  return sheet;
}

function respond(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
