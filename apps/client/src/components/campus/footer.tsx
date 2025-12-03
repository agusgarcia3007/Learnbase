import { GraduationCap } from "lucide-react";
import type { CampusTenant } from "@/services/campus/service";

type CampusFooterProps = {
  tenant: CampusTenant;
};

export function CampusFooter({ tenant }: CampusFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="size-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">{tenant.name}</span>
          </div>

          <p className="max-w-md text-sm text-muted-foreground">
            {tenant.footerText || "Aprende nuevas habilidades con nuestros cursos online de alta calidad."}
          </p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">
              Terminos
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Privacidad
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Contacto
            </a>
          </div>

          <div className="pt-4 text-xs text-muted-foreground/60">
            &copy; {currentYear} {tenant.name}. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
