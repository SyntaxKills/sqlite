import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initSqlJs from "sql.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(dirname, "store.db");
const SQL_PATH = path.join(dirname, "code.sql");
const colors = { blue:"\x1b[34m", brightBlue:"\x1b[94m", cyan:"\x1b[36m", red:"\x1b[31m", reset:"\x1b[0m" };
const paint = (text, color) => `${color}${text}${colors.reset}`;
const sqljs = file => path.join(dirname, "node_modules", "sql.js", "dist", file);

function print(db, name) {
  const safeName = name.replace(/"/g, '""');
  const query = db.exec(`SELECT * FROM "${safeName}"`);
  if (!query.length) return;
  console.log(`\n${paint(` TABELA ${name.toUpperCase()} `, colors.cyan)}`);
  const columns = ["#", ...query[0].columns];
  const rows = query[0].values.map((row, index) => [String(index + 1), ...row.map(value => value === null ? "NULL" : String(value))]);
  const widths = columns.map((column, i) => Math.max(String(column).length, ...rows.map(row => String(row[i]).length)));
  const border = (left, middle, right) => left + widths.map(width => "─".repeat(width + 2)).join(middle) + right;
  const format = (values, header = false) => "│" + values.map((value, i) => {
    const padded = String(value).padEnd(widths[i]);
    return ` ${paint(padded, header ? colors.brightBlue : colors.blue)} `;
  }).join("│") + "│";
  console.log(border("┌","┬","┐"));
  console.log(format(columns, true));
  console.log(border("├","┼","┤"));
  rows.forEach((row, index) => {
    console.log(format(row));
    if (index < rows.length - 1) console.log(border("├","┼","┤"));
  });
  console.log(border("└","┴","┘"));
}

async function startDB() {
  let db;
  try {
    const SQL = await initSqlJs({ locateFile: file => sqljs(file) });
    console.log("=".repeat(25));
    console.log(paint("    SQLite - UNINOVE", colors.cyan));
    console.log("=".repeat(25));

    if (process.argv.includes("--reset") && fs.existsSync(STORE_PATH)) {
      fs.unlinkSync(STORE_PATH);
      console.log(paint("Banco anterior removido; criando novamente.", colors.cyan));
    }

    db = fs.existsSync(STORE_PATH)
      ? new SQL.Database(fs.readFileSync(STORE_PATH))
      : new SQL.Database();

    db.run("PRAGMA foreign_keys = ON;");
    if (!fs.existsSync(STORE_PATH)) {
      if (!fs.existsSync(SQL_PATH)) throw new Error("Arquivo code.sql não encontrado.");
      db.exec(fs.readFileSync(SQL_PATH, "utf8"));
    }

    const select = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    const tables = select.length ? select[0].values.map(row => row[0]) : [];
    if (!tables.length) console.log(paint("Nenhuma tabela encontrada no banco.", colors.cyan));
    for (const name of tables) print(db, name);

    fs.writeFileSync(STORE_PATH, Buffer.from(db.export()));
    console.log(paint("\nBanco salvo em store.db", colors.cyan));
  } finally {
    if (db) db.close();
  }
}

startDB().catch(error => {
  console.error(paint(`Erro: ${error.message}`, colors.red));
  process.exitCode = 1;
});
