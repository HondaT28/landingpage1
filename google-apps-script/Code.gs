const SPREADSHEET_NAME = "Leads Tráfego Pago - Mapeamento de Processos";
const SHEET_NAME = "Leads";
const HEADER = [
  "submitted_at",
  "nome",
  "email",
  "whatsapp",
  "investimento",
  "etapa_processo",
  "mensagem",
  "page_url",
  "user_agent",
];

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const sheet = getOrCreateSheet_();
    sheet.appendRow([
      payload.submitted_at || new Date().toISOString(),
      payload.nome || "",
      payload.email || "",
      payload.whatsapp || "",
      payload.investimento || "",
      payload.etapa_processo || "",
      payload.mensagem || "",
      payload.page_url || "",
      payload.user_agent || "",
    ]);
    return jsonOutput_({ ok: true });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function setupLeadsSheet() {
  const sheet = getOrCreateSheet_();
  return `Planilha pronta: ${sheet.getParent().getUrl()}`;
}

function getOrCreateSheet_() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  let spreadsheet;
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
