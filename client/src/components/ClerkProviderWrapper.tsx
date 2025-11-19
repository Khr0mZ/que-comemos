import { ClerkProvider } from "@clerk/clerk-react";
import { esES, enGB } from "@clerk/localizations";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import i18n from "../i18n/config";

interface ClerkProviderWrapperProps {
  children: ReactNode;
  publishableKey: string;
}

export default function ClerkProviderWrapper({
  children,
  publishableKey,
}: ClerkProviderWrapperProps) {
  const [localization, setLocalization] = useState(
    i18n.language === "es" ? esES : enGB
  );

  useEffect(() => {
    // Actualizar la localización cuando cambie el idioma
    const updateLocalization = () => {
      setLocalization(i18n.language === "es" ? esES : enGB);
    };

    // Escuchar cambios de idioma
    i18n.on("languageChanged", updateLocalization);

    return () => {
      i18n.off("languageChanged", updateLocalization);
    };
  }, []);

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={localization}
      // Clerk detecta automáticamente la URL actual usando window.location.origin
      // Esto funciona con túneles dinámicos de Cloudflare (cloudflared)
      // Asegúrate de configurar en el dashboard de Clerk:
      // - Allowed redirect URLs: https://*.trycloudflare.com/*
      // - O el dominio específico de tu túnel si es estático
    >
      {children}
    </ClerkProvider>
  );
}

