import { createServerFn } from "@tanstack/react-start";
import type { CertificateVerification } from "./service";

const API_URL = import.meta.env.VITE_API_URL;

export const getCertificateVerifyServer = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data: { code } }): Promise<CertificateVerification> => {
    const response = await fetch(`${API_URL}/certificates/verify/${code}`);
    return response.json();
  });
