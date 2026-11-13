export const CONTENT_TYPES = {
  procedure: "Procedimento",
  manual: "Manual",
  checklist: "Checklist",
  template: "Modelo",
  quick_guide: "Guia rápido",
  video: "Vídeo",
  announcement: "Comunicado",
  faq: "Perguntas frequentes",
  other: "Outro",
} as const;
export type ContentType = keyof typeof CONTENT_TYPES;

export const AUDIENCES = {
  store_team: "Equipe de loja",
  manager: "Gerente",
  specialist: "Especialista",
  all: "Todos",
} as const;

export const VISIBILITIES = {
  internal: "Somente colaboradores",
  external: "Somente clientes",
  all: "Colaboradores e clientes",
} as const;

export const STATUSES = {
  draft: "Rascunho",
  in_review: "Em revisão",
  approved: "Aprovado",
  published: "Publicado",
  archived: "Arquivado",
  returned: "Devolvido",
  discarded: "Descartado",
} as const;

export const ISSUE_TYPES = {
  outdated: "Desatualizado",
  incorrect: "Incorreto",
  broken_link: "Link quebrado",
  missing_info: "Falta informação",
  other: "Outro",
} as const;

export const ROLES = {
  reader: "Leitor (interno)",
  external_reader: "Leitor externo",
  author: "Autor",
  reviewer: "Revisor",
  curator: "Curadoria",
  admin: "Administrador",
  team_manager: "Gestor da loja",
} as const;
export type Role = keyof typeof ROLES;

const TZ = "America/Sao_Paulo";
export function fmtDate(d?: string | null) {
  if (!d) return "—";
  const date = d.length === 10 ? new Date(d + "T12:00:00Z") : new Date(d);
  return date.toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" });
}
export function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
}
export function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}
export function isOverdue(status?: string | null, next?: string | null) {
  return status === "published" && !!next && next < todayISO();
}
export function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}
export function fmtSize(b?: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: string }).message);
  return "Algo deu errado.";
}
