import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  certificatesTable,
  coursesTable,
  enrollmentsTable,
  tenantsTable,
  usersTable,
  type CertificateSettings,
  type CustomTheme,
} from "@/db/schema";
import { s3 } from "./s3";
import { getPresignedUrl } from "./upload";
import { sendEmail } from "./utils";
import { logger } from "./logger";
import { env } from "./env";
import { getCertificateEmailHtml } from "./email-templates";
import {
  getCertificateTranslations,
  formatDateByLocale,
} from "./certificate-translations";

const CERTIFICATE_WIDTH = 1920;
const CERTIFICATE_HEIGHT = 1358;

export function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

type GenerateCertificateParams = {
  studentName: string;
  courseName: string;
  issuedAt: Date;
  verificationCode: string;
  verificationUrl: string;
  tenantLogo?: string;
  tenantName: string;
  theme?: CustomTheme | null;
  certificateSettings?: CertificateSettings | null;
  locale?: string;
};

export async function generateCertificateImage(
  params: GenerateCertificateParams
): Promise<Buffer> {
  const {
    studentName,
    courseName,
    issuedAt,
    verificationCode,
    verificationUrl,
    tenantLogo,
    tenantName,
    theme,
    certificateSettings,
    locale = "en",
  } = params;

  const t = getCertificateTranslations(locale);

  const canvas = createCanvas(CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);
  const ctx = canvas.getContext("2d");

  const primaryColor = theme?.primary || "#6366f1";
  const primaryRgb = hexToRgb(primaryColor);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, CERTIFICATE_WIDTH - 80, CERTIFICATE_HEIGHT - 80);

  ctx.strokeStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`;
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, CERTIFICATE_WIDTH - 120, CERTIFICATE_HEIGHT - 120);

  const cornerSize = 40;
  ctx.fillStyle = primaryColor;
  [[60, 60], [CERTIFICATE_WIDTH - 100, 60], [60, CERTIFICATE_HEIGHT - 100], [CERTIFICATE_WIDTH - 100, CERTIFICATE_HEIGHT - 100]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, cornerSize / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  let logoY = 150;
  if (tenantLogo) {
    try {
      const logoUrl = getPresignedUrl(tenantLogo);
      const logo = await loadImage(logoUrl);
      const maxLogoHeight = 120;
      const maxLogoWidth = 400;
      let logoWidth = logo.width;
      let logoHeight = logo.height;

      if (logoHeight > maxLogoHeight) {
        logoWidth = (logoWidth * maxLogoHeight) / logoHeight;
        logoHeight = maxLogoHeight;
      }
      if (logoWidth > maxLogoWidth) {
        logoHeight = (logoHeight * maxLogoWidth) / logoWidth;
        logoWidth = maxLogoWidth;
      }

      const logoX = (CERTIFICATE_WIDTH - logoWidth) / 2;
      ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
      logoY += logoHeight + 40;
    } catch {
      ctx.font = "bold 48px sans-serif";
      ctx.fillStyle = "#1f2937";
      ctx.textAlign = "center";
      ctx.fillText(tenantName, CERTIFICATE_WIDTH / 2, logoY + 60);
      logoY += 100;
    }
  } else {
    ctx.font = "bold 48px sans-serif";
    ctx.fillStyle = "#1f2937";
    ctx.textAlign = "center";
    ctx.fillText(tenantName, CERTIFICATE_WIDTH / 2, logoY + 60);
    logoY += 100;
  }

  ctx.font = "bold 72px serif";
  ctx.fillStyle = primaryColor;
  ctx.textAlign = "center";
  ctx.fillText(t.certificateOfCompletion, CERTIFICATE_WIDTH / 2, logoY + 80);

  ctx.font = "32px sans-serif";
  ctx.fillStyle = "#6b7280";
  ctx.fillText(t.certifyThat, CERTIFICATE_WIDTH / 2, logoY + 160);

  const maxNameWidth = CERTIFICATE_WIDTH - 200;
  let nameFontSize = 64;
  ctx.font = `bold ${nameFontSize}px serif`;
  while (ctx.measureText(studentName).width > maxNameWidth && nameFontSize > 32) {
    nameFontSize -= 2;
    ctx.font = `bold ${nameFontSize}px serif`;
  }
  ctx.fillStyle = "#1f2937";
  ctx.fillText(studentName, CERTIFICATE_WIDTH / 2, logoY + 250);

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CERTIFICATE_WIDTH / 2 - 300, logoY + 280);
  ctx.lineTo(CERTIFICATE_WIDTH / 2 + 300, logoY + 280);
  ctx.stroke();

  ctx.font = "32px sans-serif";
  ctx.fillStyle = "#6b7280";
  ctx.fillText(t.hasCompletedCourse, CERTIFICATE_WIDTH / 2, logoY + 350);

  const maxCourseWidth = CERTIFICATE_WIDTH - 300;
  let courseFontSize = 48;
  ctx.font = `bold ${courseFontSize}px serif`;
  while (ctx.measureText(courseName).width > maxCourseWidth && courseFontSize > 28) {
    courseFontSize -= 2;
    ctx.font = `bold ${courseFontSize}px serif`;
  }
  ctx.fillStyle = primaryColor;
  ctx.fillText(courseName, CERTIFICATE_WIDTH / 2, logoY + 430);

  const formattedDate = formatDateByLocale(issuedAt, locale);
  ctx.font = "28px sans-serif";
  ctx.fillStyle = "#6b7280";
  ctx.fillText(`${t.issuedOn} ${formattedDate}`, CERTIFICATE_WIDTH / 2, logoY + 510);

  if (certificateSettings?.customMessage) {
    ctx.font = "italic 24px serif";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(certificateSettings.customMessage, CERTIFICATE_WIDTH / 2, logoY + 560);
  }

  const signatureY = CERTIFICATE_HEIGHT - 280;
  if (certificateSettings?.signatureImageKey) {
    try {
      const signatureUrl = getPresignedUrl(certificateSettings.signatureImageKey);
      const signature = await loadImage(signatureUrl);
      const maxSigHeight = 80;
      const maxSigWidth = 250;
      let sigWidth = signature.width;
      let sigHeight = signature.height;

      if (sigHeight > maxSigHeight) {
        sigWidth = (sigWidth * maxSigHeight) / sigHeight;
        sigHeight = maxSigHeight;
      }
      if (sigWidth > maxSigWidth) {
        sigHeight = (sigHeight * maxSigWidth) / sigWidth;
        sigWidth = maxSigWidth;
      }

      const sigX = (CERTIFICATE_WIDTH - sigWidth) / 2;
      ctx.drawImage(signature, sigX, signatureY - sigHeight, sigWidth, sigHeight);
    } catch {
      // Signature image failed, skip
    }
  }

  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CERTIFICATE_WIDTH / 2 - 150, signatureY + 10);
  ctx.lineTo(CERTIFICATE_WIDTH / 2 + 150, signatureY + 10);
  ctx.stroke();

  if (certificateSettings?.signatureTitle) {
    ctx.font = "24px sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(certificateSettings.signatureTitle, CERTIFICATE_WIDTH / 2, signatureY + 50);
  }

  const qrSize = 120;
  const qrX = CERTIFICATE_WIDTH - qrSize - 100;
  const qrY = CERTIFICATE_HEIGHT - qrSize - 100;

  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: qrSize,
      margin: 1,
      color: {
        dark: primaryColor,
        light: "#ffffff",
      },
    });
    const qrImage = await loadImage(qrDataUrl);
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
  } catch {
    // QR generation failed, skip
  }

  ctx.font = "16px monospace";
  ctx.fillStyle = "#9ca3af";
  ctx.textAlign = "center";
  ctx.fillText(`${t.verify}: ${verificationCode}`, qrX + qrSize / 2, qrY + qrSize + 25);

  return canvas.toBuffer("image/png");
}

export async function generateCertificatePdf(
  params: GenerateCertificateParams
): Promise<Buffer> {
  const pngBuffer = await generateCertificateImage(params);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT],
      margin: 0,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.image(pngBuffer, 0, 0, {
      width: CERTIFICATE_WIDTH,
      height: CERTIFICATE_HEIGHT,
    });

    doc.end();
  });
}

export async function generateCertificatePreview(
  params: Omit<GenerateCertificateParams, "verificationCode" | "verificationUrl">
): Promise<string> {
  const previewParams: GenerateCertificateParams = {
    ...params,
    verificationCode: "PREVIEW1",
    verificationUrl: "https://example.com/verify/PREVIEW1",
  };

  const pngBuffer = await generateCertificateImage(previewParams);
  return `data:image/png;base64,${pngBuffer.toString("base64")}`;
}

type GenerateAndStoreParams = {
  enrollmentId: string;
  userId: string;
  tenantId: string;
};

export async function generateAndStoreCertificate(
  params: GenerateAndStoreParams
): Promise<void> {
  const { enrollmentId, userId, tenantId } = params;

  const [existingCertificate] = await db
    .select()
    .from(certificatesTable)
    .where(eq(certificatesTable.enrollmentId, enrollmentId))
    .limit(1);

  if (existingCertificate) {
    logger.info("Certificate already exists for enrollment", { enrollmentId });
    return;
  }

  const [enrollment] = await db
    .select({
      courseId: enrollmentsTable.courseId,
      completedAt: enrollmentsTable.completedAt,
    })
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.id, enrollmentId))
    .limit(1);

  if (!enrollment) {
    logger.error("Enrollment not found", { enrollmentId });
    return;
  }

  const [user] = await db
    .select({
      name: usersTable.name,
      email: usersTable.email,
      locale: usersTable.locale,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    logger.error("User not found", { userId });
    return;
  }

  const [course] = await db
    .select({ title: coursesTable.title })
    .from(coursesTable)
    .where(eq(coursesTable.id, enrollment.courseId))
    .limit(1);

  if (!course) {
    logger.error("Course not found", { courseId: enrollment.courseId });
    return;
  }

  const [tenant] = await db
    .select({
      name: tenantsTable.name,
      slug: tenantsTable.slug,
      customDomain: tenantsTable.customDomain,
      logo: tenantsTable.logo,
      customTheme: tenantsTable.customTheme,
      certificateSettings: tenantsTable.certificateSettings,
    })
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);

  if (!tenant) {
    logger.error("Tenant not found", { tenantId });
    return;
  }

  const verificationCode = generateVerificationCode();
  const issuedAt = enrollment.completedAt || new Date();
  const tenantBaseUrl = tenant.customDomain
    ? `https://${tenant.customDomain}`
    : `https://${tenant.slug}.${env.BASE_DOMAIN}`;
  const verificationUrl = `${tenantBaseUrl}/verify/${verificationCode}`;

  const imageBuffer = await generateCertificateImage({
    studentName: user.name,
    courseName: course.title,
    issuedAt,
    verificationCode,
    verificationUrl,
    tenantLogo: tenant.logo || undefined,
    tenantName: tenant.name,
    theme: tenant.customTheme,
    certificateSettings: tenant.certificateSettings,
    locale: user.locale,
  });

  const imageKey = `certificates/${tenantId}/${enrollmentId}.png`;
  await s3.write(imageKey, imageBuffer, { type: "image/png" });

  await db.insert(certificatesTable).values({
    enrollmentId,
    tenantId,
    userId,
    courseId: enrollment.courseId,
    verificationCode,
    imageKey,
    userName: user.name,
    courseName: course.title,
    issuedAt,
  });

  const downloadUrl = getPresignedUrl(imageKey);
  const emailHtml = getCertificateEmailHtml({
    studentName: user.name,
    courseName: course.title,
    verificationUrl,
    downloadUrl,
    tenantName: tenant.name,
  });

  await sendEmail({
    to: user.email,
    subject: `Your Certificate of Completion - ${course.title}`,
    html: emailHtml,
  });

  logger.info("Certificate generated and sent", {
    enrollmentId,
    verificationCode,
  });
}

type RegenerateCertificateParams = {
  certificateId: string;
  tenantId: string;
};

export async function regenerateCertificate(
  params: RegenerateCertificateParams
): Promise<{ success: boolean; imageKey?: string }> {
  const { certificateId, tenantId } = params;

  const [certificate] = await db
    .select({
      id: certificatesTable.id,
      enrollmentId: certificatesTable.enrollmentId,
      userId: certificatesTable.userId,
      courseId: certificatesTable.courseId,
      verificationCode: certificatesTable.verificationCode,
      imageKey: certificatesTable.imageKey,
      issuedAt: certificatesTable.issuedAt,
    })
    .from(certificatesTable)
    .where(eq(certificatesTable.id, certificateId))
    .limit(1);

  if (!certificate) {
    logger.error("Certificate not found for regeneration", { certificateId });
    return { success: false };
  }

  const [user] = await db
    .select({
      name: usersTable.name,
      locale: usersTable.locale,
    })
    .from(usersTable)
    .where(eq(usersTable.id, certificate.userId))
    .limit(1);

  if (!user) {
    logger.error("User not found for certificate regeneration", {
      userId: certificate.userId,
    });
    return { success: false };
  }

  const [course] = await db
    .select({ title: coursesTable.title })
    .from(coursesTable)
    .where(eq(coursesTable.id, certificate.courseId))
    .limit(1);

  if (!course) {
    logger.error("Course not found for certificate regeneration", {
      courseId: certificate.courseId,
    });
    return { success: false };
  }

  const [tenant] = await db
    .select({
      name: tenantsTable.name,
      slug: tenantsTable.slug,
      customDomain: tenantsTable.customDomain,
      logo: tenantsTable.logo,
      customTheme: tenantsTable.customTheme,
      certificateSettings: tenantsTable.certificateSettings,
    })
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);

  if (!tenant) {
    logger.error("Tenant not found for certificate regeneration", { tenantId });
    return { success: false };
  }

  const tenantBaseUrl = tenant.customDomain
    ? `https://${tenant.customDomain}`
    : `https://${tenant.slug}.${env.BASE_DOMAIN}`;
  const verificationUrl = `${tenantBaseUrl}/verify/${certificate.verificationCode}`;

  const imageBuffer = await generateCertificateImage({
    studentName: user.name,
    courseName: course.title,
    issuedAt: certificate.issuedAt,
    verificationCode: certificate.verificationCode,
    verificationUrl,
    tenantLogo: tenant.logo || undefined,
    tenantName: tenant.name,
    theme: tenant.customTheme,
    certificateSettings: tenant.certificateSettings,
    locale: user.locale,
  });

  const imageKey = `certificates/${tenantId}/${certificate.enrollmentId}.png`;
  await s3.write(imageKey, imageBuffer, { type: "image/png" });

  await db
    .update(certificatesTable)
    .set({
      imageKey,
      userName: user.name,
      courseName: course.title,
      regenerationCount: sql`${certificatesTable.regenerationCount} + 1`,
      lastRegeneratedAt: new Date(),
    })
    .where(eq(certificatesTable.id, certificateId));

  logger.info("Certificate regenerated", {
    certificateId,
    verificationCode: certificate.verificationCode,
  });

  return { success: true, imageKey };
}
