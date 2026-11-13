const strip = (c: string) => c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function Highlight({ text, query }: { text?: string | null | undefined; query?: string | undefined }) {
  if (!text) return null;
  const terms = (query ?? "")
    .split(/\s+/)
    .map((t) => strip(t).replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 2);
  if (!terms.length) return <>{text}</>;
  const chars = Array.from(text);
  const norm = chars.map((c) => strip(c).charAt(0) || c);
  const flat = norm.join("");
  const marks = new Array(chars.length).fill(false);
  for (const t of terms) {
    let i = flat.indexOf(t);
    while (i !== -1) {
      for (let k = i; k < i + t.length; k++) marks[k] = true;
      i = flat.indexOf(t, i + t.length);
    }
  }
  const out: React.ReactNode[] = [];
  let buf = "";
  let cur = false;
  chars.forEach((c, i) => {
    if (marks[i] !== cur) {
      if (buf) out.push(cur ? <mark key={i}>{buf}</mark> : buf);
      buf = "";
      cur = marks[i];
    }
    buf += c;
  });
  if (buf) out.push(cur ? <mark key="end">{buf}</mark> : buf);
  return <>{out}</>;
}
