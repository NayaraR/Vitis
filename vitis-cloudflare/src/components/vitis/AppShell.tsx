import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  Menu, Moon, Sun, LogOut, BookOpen, Workflow, Briefcase, Megaphone, Settings, LifeBuoy, Library, BarChart3,
  Bell, Newspaper, Search, X, ChevronDown, PanelLeftClose, PanelLeftOpen, User, CalendarClock, Footprints, Sprout, Users, Monitor, Headset, type LucideIcon,
} from "lucide-react";
import { SystemIcon } from "./SystemIcon";
import { SupportSheet, useSupportOpener, useSupportVisible } from "./Support";
import { BrandMark } from "./Brand";
import { SearchBox } from "./SearchBox";
import { useMe } from "@/lib/me";
import { useSettings, useSystems } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { NoAccessState, ListSkeleton } from "./States";
import { fmtDate, todayISO } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const NEWS_SEEN_KEY = "vitis-news-seen";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.dataset["theme"] = next ? "dark" : "light";
    localStorage.setItem("vitis-theme", next ? "dark" : "light");
    setDark(next);
  };
  return { dark, toggle };
}

type Item = { key: string; label: string; icon: LucideIcon; to: string; params?: Record<string, string> };
type Section = { title: string; items: (Item | "systems")[] };

function useNavSections(): Section[] {
  const { data: me } = useMe();
  const settings = useSettings();
  const learning = settings.data?.learning_name || "Cultivo";
  const sections: Section[] = [
    { title: "Início", items: [
      { key: "mural", label: "Mural", icon: Megaphone, to: "/inicio" },
      { key: "jornada", label: "Minha jornada", icon: Footprints, to: "/jornada" },
    ] },
    { title: "Capacitação", items: [
      { key: "cultivo", label: learning, icon: Sprout, to: "/cultivo" },
      ...(me?.isTeamManager ? [{ key: "equipe", label: "Minha equipe", icon: Users, to: "/equipe" }] : []),
    ] },
    { title: "Consulta", items: [
      "systems",
      { key: "processos", label: "Processos de loja", icon: Workflow, to: "/processos" },
      ...(me?.isInternal ? [{ key: "gerente", label: "Espaço do gerente", icon: Briefcase, to: "/gerente" }] : []),
      { key: "biblioteca", label: "Biblioteca", icon: Library, to: "/biblioteca" },
    ] },
  ];
  if (me?.isEditor) sections.push({ title: "Gestão", items: [
    ...(me.isCurator ? [{ key: "dashboard", label: "Dashboard", icon: BarChart3, to: "/dashboard" }] : []),
    { key: "admin", label: "Administração", icon: Settings, to: "/admin" },
  ] });
  return sections;
}

const itemCls = (active: boolean, collapsed: boolean) => cn(
  "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
  collapsed && "justify-center px-0",
  active
    ? "bg-primary-soft text-primary before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-full before:bg-primary"
    : "text-sidebar-foreground hover:bg-muted",
);

function WithTip({ collapsed, label, children }: { collapsed: boolean; label: string; children: React.ReactElement }) {
  return collapsed ? <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip> : children;
}

function NavLink({ n, collapsed, onNavigate, path }: { n: Item; collapsed: boolean; onNavigate?: (() => void) | undefined; path: string }) {
  const href = n.params ? n.to.replace("$slug", n.params["slug"]!) : n.to;
  const active = path === href || (href !== "/inicio" && path.startsWith(href + "/"));
  return (
    <WithTip collapsed={collapsed} label={n.label}>
      <Link to={n.to as "/inicio"} params={n.params as never} onClick={onNavigate} aria-current={active ? "page" : undefined} aria-label={collapsed ? n.label : undefined} className={itemCls(active, collapsed)}>
        <n.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
        {!collapsed && <span className="truncate">{n.label}</span>}
      </Link>
    </WithTip>
  );
}

function SystemsGroup({ collapsed, onNavigate, path }: { collapsed: boolean; onNavigate?: (() => void) | undefined; path: string }) {
  const { data: me } = useMe();
  const systems = useSystems();
  const list = (systems.data ?? []).filter((s) => s.active && (me?.isInternal || s.visibility !== "internal"));
  const inside = path === "/sistemas" || path.startsWith("/sistemas/");
  const [open, setOpen] = useState(inside);
  useEffect(() => { if (inside) setOpen(true); }, [inside]);
  if (collapsed) return <NavLink n={{ key: "sistemas", label: "Sistemas", icon: Monitor, to: "/sistemas" }} collapsed path={path} onNavigate={onNavigate} />;
  return (
    <div>
      <div className={cn(itemCls(path === "/sistemas", false), "p-0")}>
        <Link to="/sistemas" onClick={onNavigate} aria-current={path === "/sistemas" ? "page" : undefined} className="flex flex-1 items-center gap-3 py-2 pl-3">
          <Monitor className="h-[18px] w-[18px] shrink-0" aria-hidden /> Sistemas
        </Link>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Recolher sistemas" : "Expandir sistemas"} className="mr-1 flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted">
          <ChevronDown className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")} aria-hidden />
        </button>
      </div>
      {open && (
        <ul className="ml-[22px] mt-0.5 space-y-0.5 border-l pl-2">
          {list.map((s) => {
            const href = `/sistemas/${s.slug}`;
            const active = path === href;
            return (
              <li key={s.id}>
                <Link to="/sistemas/$slug" params={{ slug: s.slug }} onClick={onNavigate} aria-current={active ? "page" : undefined}
                  className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-sm", active ? "bg-primary-soft font-semibold text-primary" : "text-sidebar-foreground hover:bg-muted")}>
                  <SystemIcon s={s} className="h-5 w-5 shrink-0" /> <span className="truncate">{s.name}</span>
                </Link>
              </li>
            );
          })}
          {list.length === 0 && <li className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum sistema ativo</li>}
        </ul>
      )}
    </div>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const sections = useNavSections();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex flex-col gap-4">
      {sections.map((sec) => (
        <section key={sec.title} aria-label={sec.title}>
          {collapsed ? <hr className="mx-2 mb-2 border-border first:hidden" /> : <h2 className="mb-1 px-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{sec.title}</h2>}
          <ul className="flex flex-col gap-0.5">
            {sec.items.map((n) => (
              <li key={n === "systems" ? "systems" : n.key}>
                {n === "systems" ? <SystemsGroup collapsed={collapsed} onNavigate={onNavigate} path={path} /> : <NavLink n={n} collapsed={collapsed} onNavigate={onNavigate} path={path} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SupportCard({ collapsed, onOpen }: { collapsed: boolean; onOpen: () => void }) {
  if (!useSupportVisible()) return null;
  if (collapsed) {
    return (
      <div className="flex justify-center border-t p-3">
        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onOpen} aria-label="Abrir chamado de suporte"><Headset className="h-5 w-5" /></Button>
        </TooltipTrigger><TooltipContent side="right">Abrir chamado</TooltipContent></Tooltip>
      </div>
    );
  }
  return (
    <div className="m-3 rounded-2xl border bg-primary-soft p-4">
      <Headset className="h-6 w-6 text-primary" aria-hidden />
      <p className="mt-2 font-display font-bold">Precisa de uma mão?</p>
      <p className="mt-1 text-xs text-muted-foreground">Nosso time de suporte está disponível para ajudar</p>
      <Button size="sm" className="mt-3 w-full" onClick={onOpen}>Abrir chamado</Button>
    </div>
  );
}

function useNewsBadge() {
  const [seen, setSeen] = useState<string | null>(null);
  useEffect(() => setSeen(localStorage.getItem(NEWS_SEEN_KEY) ?? "1970-01-01T00:00:00Z"), []);
  const q = useQuery({
    queryKey: ["topbar-news"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("article_versions")
        .select("id,published_at,change_summary,articles!inner(slug,title,status)")
        .eq("articles.status", "published")
        .order("published_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });
  const count = seen ? (q.data ?? []).filter((v) => v.published_at > seen).length : 0;
  return { count, latest: (q.data ?? []).slice(0, 5) };
}

function TopIconButton({ label, children, badge, ...rest }: { label: string; children: ReactNode; badge?: number } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={badge ? `${label} (${badge} novos)` : label}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-topbar-foreground transition-colors hover:bg-topbar-muted focus-visible:outline-topbar-foreground"
      {...rest}
    >
      {children}
      {!!badge && (
        <span aria-hidden className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-foreground">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function Notifications() {
  const { data: me } = useMe();
  const { latest } = useNewsBadge();
  const overdue = useQuery({
    queryKey: ["topbar-overdue"],
    enabled: !!me?.isCurator,
    queryFn: async () => {
      const { data } = await supabase.from("articles").select("id,slug,title,next_review_at").eq("status", "published").lt("next_review_at", todayISO()).order("next_review_at").limit(5);
      return data ?? [];
    },
  });
  const n = overdue.data?.length ?? 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <TopIconButton label="Notificações" badge={n}><Bell className="h-5 w-5" /></TopIconButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 font-bold">Notificações</div>
        <div className="max-h-96 overflow-y-auto">
          {me?.isCurator && (
            <section className="border-b px-4 py-3">
              <h3 className="mb-2 font-meta uppercase text-muted-foreground">Revisões vencidas</h3>
              {n === 0 ? <p className="text-sm text-muted-foreground">Nenhuma revisão vencida.</p> : (
                <ul className="space-y-2">
                  {overdue.data!.map((a) => (
                    <li key={a.id}><Link to="/artigo/$slug" params={{ slug: a.slug }} className="flex gap-2 text-sm hover:text-primary"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden /><span><span className="line-clamp-2">{a.title}</span><span className="font-meta text-muted-foreground">desde {fmtDate(a.next_review_at)}</span></span></Link></li>
                  ))}
                </ul>
              )}
            </section>
          )}
          <section className="px-4 py-3">
            <h3 className="mb-2 font-meta uppercase text-muted-foreground">Últimas novidades</h3>
            {latest.length === 0 ? <p className="text-sm text-muted-foreground">Nada novo por enquanto.</p> : (
              <ul className="space-y-2">
                {latest.map((v) => (
                  <li key={v.id}><Link to="/artigo/$slug" params={{ slug: v.articles.slug }} className="block text-sm hover:text-primary"><span className="line-clamp-2 font-medium">{v.articles.title}</span><span className="font-meta text-muted-foreground">{fmtDate(v.published_at)} · {v.change_summary}</span></Link></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { children: ReactNode; hideSearch?: boolean }) {
  const { data: me, isLoading } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count } = useNewsBadge();
  const [support, setSupport] = useState(false);
  useSupportOpener(setSupport);

  useEffect(() => setCollapsed(localStorage.getItem("vitis-nav-collapsed") === "1"), []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem("vitis-nav-collapsed", c ? "0" : "1");
      return !c;
    });
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const name = me?.fullName || me?.email || "";
  const initial = (name || "?").slice(0, 1).toUpperCase();
  const accessLabel = me?.userType === "internal" ? "Colaborador" : "Cliente";
  const pillCls = "flex h-9 items-center gap-1 rounded-full border border-topbar-foreground/40 px-3 text-xs font-semibold text-topbar-foreground";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[60] focus:rounded focus:bg-card focus:p-2">Pular para o conteúdo</a>
        <header className="fixed inset-x-0 top-0 z-40 h-16 bg-topbar text-topbar-foreground shadow-card">
          <div className="flex h-full items-center gap-2 px-3 md:px-5">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-topbar-muted lg:hidden" aria-label="Abrir menu" onClick={() => setDrawer(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/inicio" className="flex items-center gap-2 rounded-lg" aria-label="VITIS — página inicial">
              <BrandMark inverse className="h-8 w-8" />
              <span className="font-display text-lg font-extrabold tracking-tight">VITIS</span>
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <div className="hidden w-72 md:block lg:w-96"><SearchBox /></div>
              <TopIconButton label={searchOpen ? "Fechar busca" : "Buscar"} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-topbar-muted md:hidden" onClick={() => setSearchOpen((s) => !s)} aria-expanded={searchOpen}>
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </TopIconButton>
              <Link to="/novidades" aria-label={count ? `Novidades (${count} novos)` : "Novidades"} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-topbar-muted">
                <Newspaper className="h-5 w-5" aria-hidden />
                {!!count && <span aria-hidden className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-foreground">{count > 9 ? "9+" : count}</span>}
              </Link>
              <Notifications />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="Minha conta" className="flex items-center gap-2 rounded-full p-1 hover:bg-topbar-muted sm:pr-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-topbar-foreground text-xs font-bold text-topbar">{initial}</span>
                    <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{me?.fullName?.split(" ")[0] || name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-semibold">{me?.fullName || "Minha conta"}</p>
                    <p className="truncate text-xs text-muted-foreground">{me?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggle}>{dark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />} {dark ? "Modo claro" : "Modo escuro"}</DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {me?.isAdmin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={cn(pillCls, "hidden hover:bg-topbar-muted sm:flex")} aria-label={`Tipo de acesso: ${accessLabel} (administrador)`}>
                      {accessLabel} · Admin <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild><Link to="/admin" search={{ tab: "usuarios" }}><User className="mr-2 h-4 w-4" /> Perfis e usuários</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/ajuda-admin"><LifeBuoy className="mr-2 h-4 w-4" /> Ajuda do administrador</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Sair</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className={cn(pillCls, "hidden sm:flex")}>{accessLabel}</span>
              )}
            </div>
          </div>
          {searchOpen && <div className="bg-topbar px-3 pb-3 md:hidden"><SearchBox autoFocus /></div>}
        </header>

        <aside className={cn("fixed bottom-0 left-0 top-16 z-30 hidden flex-col border-r bg-sidebar transition-[width] lg:flex", collapsed ? "w-[72px]" : "w-64")} aria-label="Menu lateral">
          <div className={cn("flex p-3", collapsed ? "justify-center" : "justify-end")}>
            <Button variant="ghost" size="icon" onClick={toggleCollapsed} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} aria-expanded={!collapsed}>
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Navegação principal"><NavList collapsed={collapsed} /></nav>
          <SupportCard collapsed={collapsed} onOpen={() => setSupport(true)} />
        </aside>

        <Sheet open={drawer} onOpenChange={setDrawer}>
          <SheetContent side="left" className="flex w-72 flex-col overflow-y-auto bg-sidebar p-4">
            <SheetTitle className="mb-4 flex items-center gap-2"><BrandMark className="h-8 w-8" /> VITIS</SheetTitle>
            <nav aria-label="Navegação principal" className="flex-1"><NavList collapsed={false} onNavigate={() => setDrawer(false)} /></nav>
            <div className="-mx-3"><SupportCard collapsed={false} onOpen={() => { setDrawer(false); setSupport(true); }} /></div>
          </SheetContent>
        </Sheet>
        <SupportSheet open={support} onOpenChange={setSupport} />

        <div className={cn("pt-16 transition-[padding]", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
          <main id="conteudo" className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
            {isLoading ? <ListSkeleton /> : me && !me.active ? (
              <NoAccessState>Seu acesso está bloqueado. Fale com o administrador da VITIS.</NoAccessState>
            ) : children}
          </main>
          <footer className="border-t py-6 text-center text-xs text-muted-foreground">VITIS · Víssimo Group · central de conhecimento — paleta provisória</footer>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string | undefined; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/** Light band at the top of a section page. */
export function AreaBand({ title, icon: Icon }: { title: string; icon?: LucideIcon }) {
  return (
    <div className="-mx-4 -mt-6 mb-8 border-b bg-primary-soft px-4 py-6 md:-mx-8 md:-mt-8 md:px-8">
      <h1 className="flex items-center gap-3 text-2xl font-extrabold md:text-3xl">{Icon && <Icon className="h-7 w-7 text-primary" aria-hidden />}{title}</h1>
    </div>
  );
}
