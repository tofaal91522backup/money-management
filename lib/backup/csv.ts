export const CSV_BOM = "﻿"

function escapeCsvValue(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

export function toCsv(rows: readonly (readonly string[])[]) {
  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n")
}

export function parseCsv(input: string): string[][] {
  const text = input.startsWith(CSV_BOM) ? input.slice(1) : input
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  let index = 0

  while (index < text.length) {
    const char = text[index]

    if (quoted) {
      if (char !== '"') {
        field += char
        index += 1
      } else if (text[index + 1] === '"') {
        field += '"'
        index += 2
      } else {
        quoted = false
        index += 1
      }
      continue
    }

    if (char === '"' && field === "") {
      quoted = true
      index += 1
    } else if (char === ",") {
      row.push(field)
      field = ""
      index += 1
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      index += 1
    } else if (char === "\r") {
      index += 1
    } else {
      field += char
      index += 1
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((entry) => entry.some((value) => value.trim() !== ""))
}
