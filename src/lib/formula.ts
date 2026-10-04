// Bộ tính công thức Excel rút gọn: số học, so sánh, &, tham chiếu ô/vùng, SUM AVERAGE MIN MAX COUNT COUNTA IF ROUND ABS SQRT AND OR NOT CONCATENATE LEN UPPER LOWER TRIM
export const colName = (n: number) => { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
export const colIndex = (s: string) => s.toUpperCase().split("").reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0);
export function parseRef(ref: string): { r: number; c: number } | null {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(ref.trim());
  return m ? { c: colIndex(m[1]), r: Number(m[2]) } : null;
}
export function parseRange(a: string): { r1: number; c1: number; r2: number; c2: number } | null {
  const [x, y] = a.split(":"); const p = parseRef(x); const q = parseRef(y ?? x);
  return p && q ? { r1: Math.min(p.r, q.r), c1: Math.min(p.c, q.c), r2: Math.max(p.r, q.r), c2: Math.max(p.c, q.c) } : null;
}

type S = number | string | boolean;
type V = S | V[];
type Tok = { t: "num" | "str" | "id" | "op"; v: string };
class FErr extends Error {}

function tokenize(src: string): Tok[] {
  const out: Tok[] = []; let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    let m: RegExpExecArray | null;
    const rest = src.slice(i);
    if ((m = /^\d+(\.\d+)?/.exec(rest))) { out.push({ t: "num", v: m[0] }); i += m[0].length; }
    else if ((m = /^"(?:[^"]|"")*"/.exec(rest))) { out.push({ t: "str", v: m[0].slice(1, -1).replace(/""/g, '"') }); i += m[0].length; }
    else if ((m = /^\$?[A-Za-z]+\$?\d+|^[A-Za-z_][A-Za-z0-9_.]*/.exec(rest))) { out.push({ t: "id", v: m[0] }); i += m[0].length; }
    else if ((m = /^(<>|<=|>=|[-+*/^&=<>(),:%;])/.exec(rest))) { out.push({ t: "op", v: m[0] }); i += m[0].length; }
    else throw new FErr("#NAME?");
  }
  return out;
}
const flat = (v: V): S[] => (Array.isArray(v) ? v.flatMap(flat) : [v]);
const first = (v: V): S => (Array.isArray(v) ? first(v[0] ?? "") : v);
const num = (v: V): number => {
  const x = first(v);
  if (typeof x === "number") return x;
  if (typeof x === "boolean") return x ? 1 : 0;
  if (x === "") return 0;
  const n = Number(String(x).replace(",", "."));
  if (Number.isNaN(n)) throw new FErr("#VALUE!");
  return n;
};
const str = (v: V) => String(first(v));
const nums = (args: V[]) => args.flatMap((a) => flat(a)).filter((x): x is number => typeof x === "number");

export function evalFormula(src: string, get: (r: number, c: number) => unknown): S {
  const toks = tokenize(src.replace(/^=/, ""));
  let i = 0;
  const peek = () => toks[i];
  const isOp = (...o: string[]) => peek()?.t === "op" && o.includes(peek()!.v);
  const cell = (r: number, c: number): S => {
    const v = get(r, c);
    if (v === null || v === undefined) return "";
    if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") return v;
    if (v instanceof Date) return v.getTime() / 86400000 + 25569;
    return String(v);
  };
  const cmpv = (a: V, b: V): number => {
    const x = first(a), y = first(b);
    if (typeof x === "number" && typeof y === "number") return x - y;
    const nx = Number(x), ny = Number(y);
    if (x !== "" && y !== "" && !Number.isNaN(nx) && !Number.isNaN(ny)) return nx - ny;
    return String(x).toLowerCase().localeCompare(String(y).toLowerCase());
  };
  function parseCmp(): V {
    let l = parseConcat();
    while (isOp("=", "<>", "<", ">", "<=", ">=")) {
      const op = toks[i++].v; const r = parseConcat(); const d = cmpv(l, r);
      l = op === "=" ? d === 0 : op === "<>" ? d !== 0 : op === "<" ? d < 0 : op === ">" ? d > 0 : op === "<=" ? d <= 0 : d >= 0;
    }
    return l;
  }
  function parseConcat(): V { let l = parseAdd(); while (isOp("&")) { i++; l = str(l) + str(parseAdd()); } return l; }
  function parseAdd(): V { let l = parseMul(); while (isOp("+", "-")) { const op = toks[i++].v; const r = parseMul(); l = op === "+" ? num(l) + num(r) : num(l) - num(r); } return l; }
  function parseMul(): V {
    let l = parsePow();
    while (isOp("*", "/")) { const op = toks[i++].v; const r = parsePow(); if (op === "*") l = num(l) * num(r); else { const d = num(r); if (d === 0) throw new FErr("#DIV/0!"); l = num(l) / d; } }
    return l;
  }
  function parsePow(): V { let l = parseUnary(); while (isOp("^")) { i++; l = Math.pow(num(l), num(parseUnary())); } return l; }
  function parseUnary(): V { if (isOp("-")) { i++; return -num(parseUnary()); } if (isOp("+")) { i++; return parseUnary(); } return parsePost(); }
  function parsePost(): V { let v = parsePrimary(); while (isOp("%")) { i++; v = num(v) / 100; } return v; }
  function parsePrimary(): V {
    const t = toks[i++];
    if (!t) throw new FErr("#ERR!");
    if (t.t === "num") return Number(t.v);
    if (t.t === "str") return t.v;
    if (t.t === "op" && t.v === "(") { const v = parseCmp(); if (!isOp(")")) throw new FErr("#ERR!"); i++; return v; }
    if (t.t === "id") {
      const up = t.v.toUpperCase();
      if (isOp("(")) {
        i++; const args: V[] = [];
        if (!isOp(")")) { do { args.push(parseCmp()); } while (isOp(",", ";") && ++i); }
        if (!isOp(")")) throw new FErr("#ERR!"); i++;
        return call(up, args);
      }
      if (up === "TRUE") return true;
      if (up === "FALSE") return false;
      const a = parseRef(t.v);
      if (!a) throw new FErr("#NAME?");
      if (isOp(":")) {
        i++; const e = toks[i++]; const b = e && parseRef(e.v);
        if (!b) throw new FErr("#REF!");
        const rows: V[] = [];
        for (let r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++) for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) rows.push(cell(r, c));
        return rows;
      }
      return cell(a.r, a.c);
    }
    throw new FErr("#ERR!");
  }
  function call(f: string, a: V[]): V {
    switch (f) {
      case "SUM": return nums(a).reduce((x, y) => x + y, 0);
      case "AVERAGE": { const n = nums(a); if (!n.length) throw new FErr("#DIV/0!"); return n.reduce((x, y) => x + y, 0) / n.length; }
      case "MIN": { const n = nums(a); return n.length ? Math.min(...n) : 0; }
      case "MAX": { const n = nums(a); return n.length ? Math.max(...n) : 0; }
      case "COUNT": return nums(a).length;
      case "COUNTA": return a.flatMap((x) => flat(x)).filter((x) => x !== "").length;
      case "IF": return first(a[0] ?? false) ? (a[1] ?? true) : (a[2] ?? false);
      case "ROUND": { const k = Math.pow(10, a[1] === undefined ? 0 : num(a[1])); return Math.round(num(a[0]) * k) / k; }
      case "ABS": return Math.abs(num(a[0]));
      case "SQRT": { const x = num(a[0]); if (x < 0) throw new FErr("#NUM!"); return Math.sqrt(x); }
      case "AND": return a.flatMap((x) => flat(x)).every(Boolean);
      case "OR": return a.flatMap((x) => flat(x)).some(Boolean);
      case "NOT": return !first(a[0] ?? false);
      case "CONCATENATE": case "CONCAT": return a.map((x) => str(x)).join("");
      case "LEN": return str(a[0] ?? "").length;
      case "UPPER": return str(a[0] ?? "").toUpperCase();
      case "LOWER": return str(a[0] ?? "").toLowerCase();
      case "TRIM": return str(a[0] ?? "").trim().replace(/\s+/g, " ");
      default: throw new FErr("#NAME?");
    }
  }
  try {
    const v = parseCmp();
    if (i < toks.length) return "#ERR!";
    const x = first(v);
    return typeof x === "number" && !Number.isFinite(x) ? "#NUM!" : x;
  } catch (e) {
    return e instanceof FErr ? e.message : "#ERR!";
  }
}
