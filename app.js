const outputEl = document.getElementById("output");
const sqlInputEl = document.getElementById("sqlInput");
const runBtn = document.getElementById("runBtn");
const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");
const highlightLayer = document.getElementById("highlightLayer");

let db = null;
const initialSQL = sqlInputEl.value;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function highlightSQL(source) {
  const tokenPattern = /(--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:[^"]|"")*"|`[^`]*`|\b\d+(?:\.\d+)?\b|\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|UNIQUE|DEFAULT|CHECK|AUTOINCREMENT|INTEGER|INT|REAL|TEXT|VARCHAR|CHAR|BLOB|AND|OR|AS|ON|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET|DISTINCT|COUNT|SUM|AVG|MIN|MAX|LIKE|IN|IS|BEGIN|COMMIT|ROLLBACK|PRAGMA|CASCADE|IF|EXISTS)\b|\b(?:COUNT|SUM|AVG|MIN|MAX|COALESCE|LOWER|UPPER|LENGTH|ROUND|ABS|DATE|DATETIME)\b|[=<>!+\-*\/%]+)/gi;
  let result = "";
  let last = 0;
  for (const match of source.matchAll(tokenPattern)) {
    result += escapeHTML(source.slice(last, match.index));
    const token = match[0];
    let cls = "sql-operator";
    if (/^(--|\/\*)/.test(token)) cls = "sql-comment";
    else if (/^['"`]/.test(token)) cls = "sql-string";
    else if (/^\d/.test(token)) cls = "sql-number";
    else if (/^[=<>!+\-*\/%]/.test(token)) cls = "sql-operator";
    else if (/^(COUNT|SUM|AVG|MIN|MAX|COALESCE|LOWER|UPPER|LENGTH|ROUND|ABS|DATE|DATETIME)$/i.test(token)) cls = "sql-function";
    else cls = "sql-keyword";
    result += `<span class="${cls}">${escapeHTML(token)}</span>`;
    last = match.index + token.length;
  }
  result += escapeHTML(source.slice(last));
  return result + (source.endsWith("\n") ? " " : "\n ");
}

function syncEditor() {
  highlightLayer.innerHTML = highlightSQL(sqlInputEl.value);
  highlightLayer.scrollTop = sqlInputEl.scrollTop;
  highlightLayer.scrollLeft = sqlInputEl.scrollLeft;
  const lines = sqlInputEl.value.split("\n").length;
  document.getElementById("editorStats").textContent = `SQL · ${lines} linha${lines === 1 ? "" : "s"} · UTF-8`;
}

function setStatus(message, state = "ready") {
  statusText.textContent = message;
  statusDot.className = `status-dot ${state}`;
}

function addMessage(message, className = "info") {
  const line = document.createElement("div");
  line.className = `console-line ${className}`;
  line.textContent = message;
  outputEl.replaceChildren(line);
}

function renderResults(results) {
  outputEl.replaceChildren();
  if (!results.length) {
    addMessage("✓ Comando executado com sucesso. Nenhuma linha retornada.");
    return;
  }

  results.forEach((result, index) => {
    const meta = document.createElement("div");
    meta.className = "result-meta";
    meta.textContent = `Resultado ${index + 1} · ${result.values.length} linha(s)`;
    outputEl.appendChild(meta);

    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    result.columns.forEach(column => {
      const th = document.createElement("th");
      th.textContent = column;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    result.values.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach(value => {
        const td = document.createElement("td");
        td.textContent = value === null ? "NULL" : String(value);
        if (value === null) td.className = "muted-output";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    outputEl.appendChild(wrap);
  });
}

async function initialize() {
  try {
    if (typeof initSqlJs !== "function") throw new Error("sql.js não foi encontrado. Verifique a pasta node_modules/sql.js.");
    const SQL = await initSqlJs({
      locateFile: file => `./node_modules/sql.js/dist/${file}`
    });
    db = new SQL.Database();
    db.run("PRAGMA foreign_keys = ON;");
    runBtn.disabled = false;
    setStatus("SQLite pronto");
    addMessage("✓ Banco SQLite iniciado. Escreva seu SQL e clique em Run.");
  } catch (error) {
    setStatus("Falha ao iniciar", "error");
    addMessage(`Erro ao carregar o motor SQLite: ${error.message}`, "error");
  }
}

function executeSQL() {
  if (!db) {
    addMessage("O banco ainda está inicializando. Aguarde um instante.", "warning");
    return;
  }
  const query = sqlInputEl.value.trim();
  if (!query) {
    addMessage("Digite um comando SQL antes de executar.", "warning");
    return;
  }
  try {
    const results = db.exec(query);
    renderResults(results);
    setStatus("Consulta executada");
  } catch (error) {
    addMessage(`✕ Erro SQL: ${error.message}`, "error");
    setStatus("Erro na consulta", "error");
  }
}

runBtn.addEventListener("click", executeSQL);
document.getElementById("clearBtn").addEventListener("click", () => {
  outputEl.replaceChildren();
});
document.getElementById("resetBtn").addEventListener("click", () => {
  sqlInputEl.value = initialSQL;
  syncEditor();
});
sqlInputEl.addEventListener("input", syncEditor);
sqlInputEl.addEventListener("scroll", () => {
  highlightLayer.scrollTop = sqlInputEl.scrollTop;
  highlightLayer.scrollLeft = sqlInputEl.scrollLeft;
});
sqlInputEl.addEventListener("keydown", event => {
  if (event.key === "Tab") {
    event.preventDefault();
    const start = sqlInputEl.selectionStart;
    const end = sqlInputEl.selectionEnd;
    sqlInputEl.setRangeText("  ", start, end, "end");
    syncEditor();
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    executeSQL();
  }
});

syncEditor();
initialize();
