type CertificateTranslations = {
  certificateOfCompletion: string;
  certifyThat: string;
  hasCompletedCourse: string;
  issuedOn: string;
  verify: string;
};

const translations: Record<string, CertificateTranslations> = {
  en: {
    certificateOfCompletion: "CERTIFICATE OF COMPLETION",
    certifyThat: "This is to certify that",
    hasCompletedCourse: "has successfully completed the course",
    issuedOn: "Issued on",
    verify: "Verify",
  },
  es: {
    certificateOfCompletion: "CERTIFICADO DE FINALIZACION",
    certifyThat: "Se certifica que",
    hasCompletedCourse: "ha completado exitosamente el curso",
    issuedOn: "Emitido el",
    verify: "Verificar",
  },
  pt: {
    certificateOfCompletion: "CERTIFICADO DE CONCLUSAO",
    certifyThat: "Certificamos que",
    hasCompletedCourse: "concluiu com sucesso o curso",
    issuedOn: "Emitido em",
    verify: "Verificar",
  },
};

export function getCertificateTranslations(locale: string): CertificateTranslations {
  return translations[locale] || translations.en;
}

export function formatDateByLocale(date: Date, locale: string): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    pt: "pt-BR",
  };

  return date.toLocaleDateString(localeMap[locale] || "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
