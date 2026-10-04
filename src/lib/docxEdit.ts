// Chỉnh sửa trực tiếp trong file .docx (XML) nên giữ nguyên bố cục, bảng, hình, đầu/chân trang của bản gốc.
import type JSZipType from "jszip";

const NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
export type Fmt = { bold: boolean; italic: boolean; underline: boolean; size: number | null; font: string | null; align: string };
export type DocxState = { zip: JSZipType; xml: Document };

/** Phần lõi thuần túy: áp dụng thay đổi văn bản vào các đoạn w:t, giữ định dạng của run tại vị trí sửa. */
export function applyEdit(segs: string[], next: string): string[] {
  const old = segs.join("");
  if (old === next) return segs;
  const max = Math.min(old.length, next.length);
  let p = 0; while (p < max && old[p] === next[p]) p++;
  let s = 0; while (s < max - p && old[old.length - 1 - s] === next[next.length - 1 - s]) s++;
  const delStart = p, delEnd = old.length - s, ins = next.slice(p, next.length - s);
  const starts: number[] = []; let acc = 0;
  segs.forEach((x) => { starts.push(acc); acc += x.length; });
  let target = segs.length - 1;
  for (let i = 0; i < segs.length; i++) if (starts[i] <= p && p < starts[i] + segs[i].length) { target = i; break; }
  if (delStart === delEnd && target > 0 && starts[target] === p) target -= 1; // chèn đúng ranh giới: dùng định dạng đoạn đứng trước
  if (old.length === 0) target = 0;
  return segs.map((seg, i) => {
    const st = starts[i], len = seg.length;
    const a = Math.min(len, Math.max(0, delStart - st)), b = Math.min(len, Math.max(a, delEnd - st));
    const at = i === target ? Math.min(len, Math.max(0, p - st)) : a;
    const keepStart = i === target ? Math.min(at, a === b && delStart === delEnd ? at : a) : a;
    return seg.slice(0, keepStart) + (i === target ? ins : "") + seg.slice(b);
  });
}

export async function loadDocx(buf: ArrayBuffer): Promise<DocxState> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buf);
  const f = zip.file("word/document.xml");
  if (!f) throw new Error("not-docx");
  const xml = new DOMParser().parseFromString(await f.async("string"), "application/xml");
  if (xml.getElementsByTagName("parsererror").length) throw new Error("bad-xml");
  return { zip, xml };
}
export const serialize = (xml: Document) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + new XMLSerializer().serializeToString(xml).replace(/^<\?xml[^>]*\?>\s*/, "");
export function parseXml(s: string) { return new DOMParser().parseFromString(s, "application/xml"); }
export async function buildDocx(st: DocxState) {
  st.zip.file("word/document.xml", serialize(st.xml));
  const out = await st.zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return new Uint8Array(out); // bản sao có ArrayBuffer thường, dùng được cho Blob/fetch
}

const owner = (el: Element): Element | null => { let n: Node | null = el.parentNode; while (n) { if (n.nodeType === 1 && (n as Element).localName === "p" && (n as Element).namespaceURI === NS) return n as Element; n = n.parentNode; } return null; };
const ownT = (p: Element) => Array.from(p.getElementsByTagNameNS(NS, "t")).filter((t) => owner(t) === p);
const ownR = (p: Element) => Array.from(p.getElementsByTagNameNS(NS, "r")).filter((r) => owner(r) === p);

/** Các đoạn có chứa phần tử w:t (có thể sửa chữ). */
export function paragraphs(xml: Document): Element[] {
  return Array.from(xml.getElementsByTagNameNS(NS, "p")).filter((p) => ownT(p).length > 0);
}
export const pText = (p: Element) => ownT(p).map((t) => t.textContent ?? "").join("");
export function setPText(p: Element, text: string) {
  const ts = ownT(p);
  const next = applyEdit(ts.map((t) => t.textContent ?? ""), text);
  ts.forEach((t, i) => { if ((t.textContent ?? "") !== next[i]) { t.textContent = next[i]; t.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve"); } });
}

const RPR = ["rStyle", "rFonts", "b", "bCs", "i", "iCs", "caps", "smallCaps", "strike", "dstrike", "outline", "shadow", "emboss", "imprint", "noProof", "snapToGrid", "vanish", "webHidden", "color", "spacing", "w", "kern", "position", "sz", "szCs", "highlight", "u", "effect", "bdr", "shd", "fitText", "vertAlign", "rtl", "cs", "em", "lang", "eastAsianLayout", "specVanish", "oMath"];
const PPR = ["pStyle", "keepNext", "keepLines", "pageBreakBefore", "framePr", "widowControl", "numPr", "suppressLineNumbers", "pBdr", "shd", "tabs", "suppressAutoHyphens", "kinsoku", "wordWrap", "overflowPunct", "topLinePunct", "autoSpaceDE", "autoSpaceDN", "bidi", "adjustRightInd", "snapToGrid", "spacing", "ind", "contextualSpacing", "mirrorIndents", "suppressOverlap", "jc", "textDirection", "textAlignment", "textboxTightWrap", "outlineLvl", "divId", "cnfStyle", "rPr", "sectPr", "pPrChange"];

function child(parent: Element, name: string) { return Array.from(parent.children).find((c) => c.localName === name && c.namespaceURI === NS) ?? null; }
function ensure(parent: Element, name: string, order: string[]): Element {
  const ex = child(parent, name); if (ex) return ex;
  const el = parent.ownerDocument.createElementNS(NS, "w:" + name);
  const idx = order.indexOf(name);
  const before = Array.from(parent.children).find((c) => order.indexOf(c.localName) > idx && order.indexOf(c.localName) !== -1);
  if (before) parent.insertBefore(el, before); else parent.appendChild(el);
  return el;
}
function remove(parent: Element, ...names: string[]) { names.forEach((n) => { const c = child(parent, n); if (c) parent.removeChild(c); }); }
const wAttr = (el: Element, k: string, v: string) => el.setAttributeNS(NS, "w:" + k, v);
function rPrOf(r: Element): Element {
  let pr = child(r, "rPr");
  if (!pr) { pr = r.ownerDocument.createElementNS(NS, "w:rPr"); r.insertBefore(pr, r.firstChild); }
  return pr;
}

export function setFormat(p: Element, f: Partial<Fmt>) {
  for (const r of ownR(p)) {
    const pr = rPrOf(r);
    if (f.bold !== undefined) { remove(pr, "b", "bCs"); if (f.bold) { ensure(pr, "b", RPR); ensure(pr, "bCs", RPR); } }
    if (f.italic !== undefined) { remove(pr, "i", "iCs"); if (f.italic) { ensure(pr, "i", RPR); ensure(pr, "iCs", RPR); } }
    if (f.underline !== undefined) { remove(pr, "u"); if (f.underline) wAttr(ensure(pr, "u", RPR), "val", "single"); }
    if (f.size) { wAttr(ensure(pr, "sz", RPR), "val", String(Math.round(f.size * 2))); wAttr(ensure(pr, "szCs", RPR), "val", String(Math.round(f.size * 2))); }
    if (f.font) { const rf = ensure(pr, "rFonts", RPR); ["ascii", "hAnsi", "cs", "eastAsia"].forEach((k) => wAttr(rf, k, f.font!)); }
  }
  if (f.align) {
    let ppr = child(p, "pPr");
    if (!ppr) { ppr = p.ownerDocument.createElementNS(NS, "w:pPr"); p.insertBefore(ppr, p.firstChild); }
    wAttr(ensure(ppr, "jc", PPR), "val", f.align);
  }
}
export function getFormat(p: Element): Fmt {
  const r = ownR(p).find((x) => child(x, "rPr")) ?? ownR(p)[0];
  const pr = r ? child(r, "rPr") : null;
  const on = (n: string) => { const e = pr && child(pr, n); if (!e) return false; const v = e.getAttributeNS(NS, "val"); return v !== "0" && v !== "false"; };
  const sz = pr && child(pr, "sz")?.getAttributeNS(NS, "val");
  const ppr = child(p, "pPr"); const jc = ppr && child(ppr, "jc")?.getAttributeNS(NS, "val");
  return { bold: on("b"), italic: on("i"), underline: !!(pr && child(pr, "u") && child(pr, "u")!.getAttributeNS(NS, "val") !== "none"), size: sz ? Number(sz) / 2 : null, font: (pr && child(pr, "rFonts")?.getAttributeNS(NS, "ascii")) || null, align: jc || "left" };
}
