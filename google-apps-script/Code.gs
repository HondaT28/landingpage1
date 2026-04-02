const SPREADSHEET_NAME = "Leads Tráfego Pago - Mapeamento de Processos";
const SHEET_NAME = "Leads";
/**
 * Ordem fixa das colunas (planilha atual).
 * user_agent antes de page_url para bater com planilhas onde a última coluna é page_url.
 */
const HEADER = [
  "submitted_at",
  "nome",
  "email",
  "whatsapp",
  "mensagem",
  "user_agent",
  "page_url",
];
/** Planilhas antigas (investimento + etapa) */
const HEADER_LEGACY = [
  "submitted_at",
  "nome",
  "email",
  "whatsapp",
  "investimento",
  "etapa_processo",
  "mensagem",
  "user_agent",
  "page_url",
];

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const sheet = getOrCreateSheet_();
    const row = buildRowForSheet_(sheet, payload);
    sheet.appendRow(row);
    return jsonOutput_({ ok: true });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

/**
 * Sempre grava na ordem HEADER ou HEADER_LEGACY (não na ordem “solta” da linha 1),
 * para mensagem e page_url não trocarem de coluna.
 */
function buildRowForSheet_(sheet, payload) {
  const headers = getHeaderKeys_(sheet);
  if (isLegacyHeader_(headers)) {
    return rowFromKeys_(HEADER_LEGACY, payload);
  }
  return rowFromKeys_(HEADER, payload);
}

function getHeaderKeys_(sheet) {
  if (sheet.getLastRow() < 1) return [];
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const row = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  return row.map(function (cell) {
    return String(cell || "").trim();
  });
}

function isLegacyHeader_(headers) {
  return headers.indexOf("investimento") >= 0 || headers.indexOf("etapa_processo") >= 0;
}

function rowFromKeys_(keys, payload) {
  return keys.map(function (key) {
    if (key === "investimento" || key === "etapa_processo") return "";
    var v = payload[key];
    if (v === undefined || v === null) return "";
    return String(v);
  });
}

function parsePayload_(e) {
  const params = (e && e.parameter) || {};
  var raw = "";
  if (e && e.postData) {
    raw = e.postData.contents || "";
    if (!raw && typeof e.postData.getDataAsString === "function") {
      try {
        raw = e.postData.getDataAsString() || "";
      } catch (err2) {
        raw = "";
      }
    }
  }
  var parsed = {};
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      parsed = {};
    }
  }

  return {
    submitted_at: firstNonEmpty_(
      parsed.submitted_at,
      params.submitted_at
    ),
    nome: firstNonEmpty_(parsed.nome, params.nome),
    email: firstNonEmpty_(parsed.email, params.email),
    whatsapp: firstNonEmpty_(parsed.whatsapp, params.whatsapp),
    mensagem: firstNonEmpty_(
      parsed.mensagem,
      parsed.message,
      parsed.descricao,
      params.mensagem
    ),
    page_url: firstNonEmpty_(
      parsed.page_url,
      parsed.pageUrl,
      parsed.url,
      parsed.landing_url,
      params.page_url
    ),
    user_agent: firstNonEmpty_(parsed.user_agent, params.user_agent),
  };
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
  var spreadsheet;
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
  }

  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
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
