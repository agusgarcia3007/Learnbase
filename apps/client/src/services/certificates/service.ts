import { http, publicHttp } from "@/lib/http";

export type Certificate = {
  id: string;
  verificationCode: string;
  imageUrl: string | null;
  userName: string;
  courseName: string;
  issuedAt: string;
  enrollmentId: string;
  verificationUrl: string;
  course: {
    id: string;
    slug: string;
    title: string;
    thumbnail: string | null;
  };
};

export type CertificateBasic = {
  id: string;
  verificationCode: string;
  imageUrl: string | null;
  userName: string;
  courseName: string;
  issuedAt: string;
  enrollmentId: string;
  verificationUrl: string;
};

export type CertificateVerification = {
  valid: boolean;
  certificate: {
    id: string;
    verificationCode: string;
    imageUrl: string | null;
    userName: string;
    courseName: string;
    issuedAt: string;
    tenant: {
      name: string;
      logo: string | null;
      slug: string;
      customDomain: string | null;
    };
  } | null;
};

export const QUERY_KEYS = {
  CERTIFICATES: ["certificates"] as const,
  CERTIFICATE: (enrollmentId: string) => ["certificates", enrollmentId] as const,
  VERIFY: (code: string) => ["certificates", "verify", code] as const,
} as const;

export const CertificatesService = {
  async list() {
    const { data } = await http.get<{ certificates: Certificate[] }>("/certificates");
    return data;
  },

  async getByEnrollment(enrollmentId: string) {
    const { data } = await http.get<{ certificate: CertificateBasic | null }>(
      `/certificates/${enrollmentId}`
    );
    return data;
  },

  async verify(code: string) {
    const { data } = await publicHttp.get<CertificateVerification>(
      `/certificates/verify/${code}`
    );
    return data;
  },

  async sendEmail(enrollmentId: string) {
    const { data } = await http.post<{ success: boolean }>(
      `/certificates/${enrollmentId}/email`
    );
    return data;
  },
} as const;
