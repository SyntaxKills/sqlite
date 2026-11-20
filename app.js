let db = null;
const outputEl = document.getElementById("output");
const sqlInputEl = document.getElementById("sqlInput");
const runBtn = document.getElementById("runBtn");
const statusEl = document.getElementById("dbStatus");
const highlightEl = document.getElementById("highlightLayer");
const lineNumbersEl = document.getElementById("lineNumbers");

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[char]));

function highlightSQL(sql) {
  const tokenPattern = /(--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?: ""|[^"])*"|\b\d+(?:\.\d+)?\b|\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|UNIQUE|DEFAULT|CHECK|CONSTRAINT|INTEGER|INT|TEXT|VARCHAR|CHAR|REAL|BLOB|AND|OR|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|JOIN|LEFT|RIGHT|INNER|OUTER|ON|ASC|DESC|DISTINCT|COUNT|SUM|AVG|MIN|MAX|PRAGMA|AUTOINCREMENT|BEGIN|COMMIT|ROLLBACK)\b)/gi;
  let result = "", last = 0, match;
  while ((match = tokenPattern.exec(sql)) !== null) {
    result += escapeHtml(sql.slice(last, match.index));
    const token = match[0];
    let cls = "kw";
    if (token.startsWith("--") || token.startsWith("/*")) cls = "comment";
    else if (token.startsWith("'") || token.startsWith('"')) cls = "str";
    else if (/^\d/.test(token)) cls = "num";
    result += `<span class="${cls}">${escapeHtml(token)}</span>`;
    last = tokenPattern.lastIndex;
  }
  result += escapeHtml(sql.slice(last));
  return result + (sql.endsWith("\n") ? " " : "\n");
}

function syncEditor() {
  highlightEl.innerHTML = highlightSQL(sqlInputEl.value);
  const count = Math.max(1, sqlInputEl.value.split("\n").length);
  lineNumbersEl.textContent = Array.from({length:count}, (_,i)=>i+1).join("\n");
}
sqlInputEl.addEventListener("input", syncEditor);
sqlInputEl.addEventListener("scroll", () => {
  highlightEl.scrollTop = sqlInputEl.scrollTop;
  highlightEl.scrollLeft = sqlInputEl.scrollLeft;
  lineNumbersEl.scrollTop = sqlInputEl.scrollTop;
});
syncEditor();

function addMessage(message, className = "info") {
  const line = document.createElement("div");
  line.className = `console-line ${className}`;
  line.textContent = message;
  outputEl.appendChild(line);
}

function renderResults(results) {
  outputEl.replaceChildren();
  if (!results || results.length === 0) {
    addMessage("✓ Comando executado com sucesso. Nenhuma linha retornada.", "info");
    return;
  }
  results.forEach((result, index) => {
    const block = document.createElement("div");
    block.className = "result-block";
    const title = document.createElement("div");
    title.className = "result-title";
    title.textContent = `Resultado ${index + 1} · ${result.values.length} linha(s)`;
    block.appendChild(title);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    result.columns.forEach(column => {
      const th = document.createElement("th");
      th.textContent = column;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    result.values.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach(cell => {
        const td = document.createElement("td");
        td.textContent = cell === null ? "NULL" : String(cell);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    block.appendChild(table);
    outputEl.appendChild(block);
  });
}

async function initializeDatabase() {
  try {
    if (typeof initSqlJs !== "function") throw new Error("A biblioteca sql.js não foi carregada.");
    const SQL = await initSqlJs({ locateFile: file => `vendor/sql.js/${file}` });
    db = new SQL.Database();
    db.run("PRAGMA foreign_keys = ON;");
    statusEl.classList.add("ready");
    statusEl.innerHTML = "<i></i> SQLite pronto";
    runBtn.disabled = false;
    outputEl.replaceChildren();
    addMessage("Banco SQLite inicializado. Pronto para executar SQL.", "info");
  } catch (error) {
    statusEl.classList.add("failed");
    statusEl.innerHTML = "<i></i> Falha ao iniciar";
    outputEl.replaceChildren();
    addMessage(`Não foi possível iniciar o SQLite: ${error.message}`, "error");
  }
}

runBtn.addEventListener("click", () => {
  if (!db) return;
  const query = sqlInputEl.value.trim();
  if (!query) {
    outputEl.replaceChildren();
    addMessage("Digite um comando SQL antes de executar.", "muted");
    return;
  }
  try {
    const results = db.exec(query);
    renderResults(results);
  } catch (error) {
    outputEl.replaceChildren();
    addMessage(`Erro SQL: ${error.message}`, "error");
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  outputEl.replaceChildren();
  addMessage("Saída limpa.", "muted");
});
sqlInputEl.addEventListener("keydown", event => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    runBtn.click();
  }
  if (event.key === "Tab") {
    event.preventDefault();
    const start = sqlInputEl.selectionStart, end = sqlInputEl.selectionEnd;
    sqlInputEl.setRangeText("  ", start, end, "end");
    syncEditor();
  }
});
initializeDatabase();
