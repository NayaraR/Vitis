import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errMsg } from "@/lib/labels";

export const selectCls = "h-9 rounded-lg border bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function useRun() {
  const qc = useQueryClient();
  return async (fn: () => PromiseLike<{ error: unknown }>, ok: string) => {
    const { error } = await fn();
    if (error) {
      toast.error(errMsg(error));
      return false;
    }
    toast.success(ok);
    qc.invalidateQueries();
    return true;
  };
}

export function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
