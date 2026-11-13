import { describe, expect, it } from "vitest";
import { audienceFits, studyStreak, trailProgress } from "@/lib/trails";

const m = (id: string) => ({ id, slug: id, title: id, summary: null, status: "published", estimated_minutes: 5, cover_image: null, content_type: "procedure", is_example: false });

describe("trails", () => {
  it("counts completed modules and picks the next one", () => {
    const p = trailProgress({ modules: [m("a"), m("b"), m("c")] }, [{ article_id: "a", read_at: "", completed: true }, { article_id: "b", read_at: "", completed: false }]);
    expect(p.done).toBe(1);
    expect(p.states).toEqual(["done", "in_progress", "not_started"]);
    expect(p.next?.id).toBe("b");
    expect(p.state).toBe("in_progress");
  });
  it("streak counts back from yesterday when today has no study", () => {
    expect(studyStreak(["2026-11-10", "2026-11-09", "2026-11-07"], "2026-11-11")).toBe(2);
    expect(studyStreak(["2026-11-11", "2026-11-10"], "2026-11-11")).toBe(2);
    expect(studyStreak(["2026-11-08"], "2026-11-11")).toBe(0);
  });
  it("external people only get client or all trails", () => {
    expect(audienceFits(["store_team"], false)).toBe(false);
    expect(audienceFits(["client"], false)).toBe(true);
    expect(audienceFits(["store_team"], true)).toBe(true);
  });
});
