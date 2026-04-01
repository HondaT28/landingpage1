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
const INVESTIMENTO_OPTIONS = [
  "Até 10k",
  "10k a 20k",
  "20k a 50k",
  "Acima de 50k",
  "A definir com a consultoria",
];
const INVESTIMENTO_LEGACY_MAP = {
  "Até R$ 15.000": "Até 10k",
  "R$ 15.000 a R$ 40.000": "20k a 50k",
  "R$ 40.000 a R$ 100.000": "Acima de 50k",
  "Acima de R$ 100.000": "Acima de 50k",
  "A definir com consultoria": "A definir com a consultoria",
};

function doPost(e) {
  try {
    const payload = parsePayload_(e);
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

function parsePayload_(e) {
  const params = (e && e.parameter) || {};
  const raw = (e && e.postData && e.postData.contents) || "";
  let parsed = {};
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      parsed = {};
    }
  }
  return {
    submitted_at: firstNonEmpty_(parsed.submitted_at, params.submitted_at),
    nome: firstNonEmpty_(parsed.nome, params.nome),
    email: firstNonEmpty_(parsed.email, params.email),
    whatsapp: firstNonEmpty_(parsed.whatsapp, params.whatsapp),
    investimento: normalizeInvestimento_(firstNonEmpty_(parsed.investimento, params.investimento)),
    etapa_processo: firstNonEmpty_(parsed.etapa_processo, params.etapa_processo),
    mensagem: firstNonEmpty_(parsed.mensagem, params.mensagem),
    page_url: firstNonEmpty_(parsed.page_url, params.page_url),
    user_agent: firstNonEmpty_(parsed.user_agent, params.user_agent),
  };
}

function normalizeInvestimento_(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (INVESTIMENTO_OPTIONS.indexOf(raw) >= 0) return raw;
  if (INVESTIMENTO_LEGACY_MAP[raw]) return INVESTIMENTO_LEGACY_MAP[raw];
  return raw;
}

function firstNonEmpty_() {
  for (var i = 0; i < arguments.length; i++) {
    var value = arguments[i];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "";
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
