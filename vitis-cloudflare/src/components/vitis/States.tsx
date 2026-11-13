import { AlertTriangle, Lock, SearchX, Sprout, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

function Shell({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export const EmptyState = ({ title = "Nada por aqui ainda", children }: { title?: string; children?: ReactNode }) => (
  <Shell icon={<Inbox className="h-5 w-5" />} title={title}>{children}</Shell>
);
export const OrganizingState = () => (
  <Shell icon={<Sprout className="h-5 w-5" />} title="Conteúdos sendo organizados">
    A Curadoria VITIS está preparando os materiais desta seção. Volte em breve ou use a busca.
  </Shell>
);
export const ErrorState = ({ message }: { message?: string }) => (
  <Shell icon={<AlertTriangle className="h-5 w-5" />} title="Não foi possível carregar">
    {message ?? "Tente novamente em instantes."}
  </Shell>
);
export const NoAccessState = ({ children }: { children?: ReactNode }) => (
  <Shell icon={<Lock className="h-5 w-5" />} title="Sem permissão">
    {children ?? "Seu perfil não tem acesso a esta área. Se precisar, fale com a Curadoria VITIS."}
  </Shell>
);
export const NoResultsState = ({ children }: { children?: ReactNode }) => (
  <Shell icon={<SearchX className="h-5 w-5" />} title="Nenhum resultado encontrado">{children}</Shell>
);

export function CardsSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}
export function ListSkeleton({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}
