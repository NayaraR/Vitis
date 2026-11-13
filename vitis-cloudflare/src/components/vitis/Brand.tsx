import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cachedBrand, type Brand as BrandT } from "@/lib/brand";

/** Logo uploaded by the admin (app_settings.brand_logo), or null for the default mark. */
export function useBrandLogo() {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    setLogo(cachedBrand().logo ?? null);
    const h = (e: Event) => setLogo((e as CustomEvent<BrandT>).detail.logo ?? null);
    window.addEventListener("vitis-brand", h);
    return () => window.removeEventListener("vitis-brand", h);
  }, []);
  return logo;
}

export function BrandMark({ className = "h-9 w-9", inverse = false }: { className?: string; inverse?: boolean }) {
  const logo = useBrandLogo();
  if (logo) return <img src={logo} alt="" className={className + " rounded-lg bg-card object-contain p-0.5"} />;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" className={inverse ? "fill-primary-foreground" : "fill-primary"} />
      <g className={inverse ? "fill-primary" : "fill-primary-foreground"}>
        <circle cx="14" cy="15" r="4" />
        <circle cx="26" cy="15" r="4" />
        <circle cx="20" cy="23" r="4" />
        <circle cx="20" cy="31" r="3" opacity="0.7" />
      </g>
    </svg>
  );
}

export function Brand({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link to="/inicio" className="flex items-center gap-2.5 rounded-lg" aria-label="VITIS — página inicial">
      <BrandMark inverse={inverse} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-extrabold tracking-tight">VITIS</span>
        {!compact && (
          <span className={"hidden text-[11px] sm:block " + (inverse ? "opacity-80" : "text-muted-foreground")}>Víssimo Group · central de conhecimento</span>
        )}
      </span>
    </Link>
  );
}
