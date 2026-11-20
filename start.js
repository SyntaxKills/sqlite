// • --------------------------------------------------------------------------------------------------------- • \\
import fs from "node:fs"

import initSqlJs from "sql.js"

import path from "node:path"
// • --------------------------------------------------------------------------------------------------------- • \\
import { fileURLToPath } from "node:url"
// • --------------------------------------------------------------------------------------------------------- • \\
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const STORE_PATH = path.join(dirname, "store.db")
const SQL_PATH = path.join(dirname, "code.sql")
// • --------------------------------------------------------------------------------------------------------- • \\
const colors = { 
blue: "\x1b[34m", 
brigth_blue: "\x1b[94m", 
cyan: "\x1b[36m", 
dim: "\x1b[2m", 
red: "\x1b[31m", 
reset: "\x1b[0m" 
}
// • --------------------------------------------------------------------------------------------------------- • \\
const paint = (text, color) => `${color}${text}${colors.reset}`

const sqljs = (file) => path.join(dirname, "node_modules", "sql.js", "dist", file)

const print = (db, name) => {
var cleanName = name.replace(/"/g, '""')
var query = db.exec(`SELECT * FROM "${cleanName}"`)
console.log(`\n${paint(` TABELA ${name.toUpperCase()} `, colors.cyan)}`)
  
var columns = ["#", ...query[0].columns]
var rows = query[0].values.map((row, index) => [String(index + 1), ...row.map(value => (value === null ? "NULL" : String(value)))])
  
var widths = columns.map((column, i) => Math.max(String(column).length, ...rows.map(row => String(row[i]).length)))
  
var border = (left, middle, right) => left + widths.map(width => "─".repeat(width + 2)).join(middle) + right

var formatRowCells = (rowValues, isHeader = false) => "│" + rowValues.map((value, i) => {
var paddedText = String(value).padEnd(widths[i])
return ` ${paint(paddedText, isHeader ? colors.brigth_blue : colors.blue)} `
}).join("│") + "│"

console.log(border("┌", "┬", "┐"))
console.log(formatRowCells(columns, true))
console.log(border("├", "┼", "┤"))

rows.forEach((row, index) => {
console.log(formatRowCells(row))
if(index < rows.length - 1) {
console.log(border("├", "┼", "┤"))
}
})

console.log(border("└", "┴", "┘"))
}
// • --------------------------------------------------------------------------------------------------------- • \\
var resetCode = process.argv.includes("--reset")
// • --------------------------------------------------------------------------------------------------------- • \\
const startDB = async () => {
try {
var SQL = await initSqlJs({locateFile: file => sqljs(file)})

console.log("=".repeat(25))
console.log(paint("    SQLite - UNINOVE", colors.cyan))
console.log("=".repeat(25))

var existsSync = fs.existsSync(STORE_PATH)

if(resetCode && existsSync) {
fs.unlinkSync(STORE_PATH)
existsSync = false
}

var db = existsSync ? new SQL.Database(fs.readFileSync(STORE_PATH)) : new SQL.Database()
db.run("PRAGMA foreign_keys = ON;")

if(!existsSync) {
var schema = fs.readFileSync(SQL_PATH, "utf8")
db.exec(schema)
fs.writeFileSync(STORE_PATH, Buffer.from(db.export()))
}

var select = db.exec(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
var tables = select.length ? select[0].values.map(row => row[0]) : []

for (var name of tables) {
print(db, name)
}

fs.writeFileSync(STORE_PATH, Buffer.from(db.export()))
} finally {
db.close()
}
}
// • --------------------------------------------------------------------------------------------------------- • \\
startDB().catch(e => {
console.error(paint(`Erro: ${e.message}`, colors.red))
process.exitCode = 1
})
