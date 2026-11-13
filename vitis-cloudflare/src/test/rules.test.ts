import { describe, expect, it } from "vitest";
import { isOverdue } from "@/lib/labels";

describe("Revisão necessária", () => {
  it("é marcada quando um artigo publicado passou da próxima revisão", () => {
    expect(isOverdue("published", "2000-01-01")).toBe(true);
  });
  it("não é marcada para artigos publicados com revisão futura", () => {
    expect(isOverdue("published", "2999-01-01")).toBe(false);
  });
  it("não é marcada para artigos arquivados ou em rascunho", () => {
    expect(isOverdue("archived", "2000-01-01")).toBe(false);
    expect(isOverdue("draft", "2000-01-01")).toBe(false);
  });
});
