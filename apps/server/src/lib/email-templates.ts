import { getEmailTranslations, interpolate } from "./email-translations";

type CertificateEmailParams = {
  studentName: string;
  courseName: string;
  verificationUrl: string;
  downloadUrl: string;
  tenantName: string;
  locale?: string;
};

export function getCertificateEmailHtml(params: CertificateEmailParams): string {
  const { studentName, courseName, verificationUrl, downloadUrl, tenantName, locale } =
    params;
  const t = getEmailTranslations(locale).certificateEmail;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, #0052cc 0%, #0065ff 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">&#127942;</span>
              </div>

              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                ${interpolate(t.congratulations, { studentName })}
              </h1>

              <p style="margin: 0 0 32px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                ${t.completedCourse}
              </p>

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #0052cc;">
                  ${courseName}
                </h2>
                <p style="margin: 0; font-size: 14px; color: #9ca3af;">
                  ${interpolate(t.issuedBy, { tenantName })}
                </p>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                ${t.readyMessage}
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px;">
                    <a href="${downloadUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0052cc; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      ${t.downloadButton}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #f3f4f6; color: #4b5563; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                      ${t.verifyButton}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                ${t.shareMessage}
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; word-break: break-all;">
                <a href="${verificationUrl}" style="color: #0052cc; text-decoration: none;">
                  ${verificationUrl}
                </a>
              </p>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
          ${interpolate(t.footer, { tenantName })}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type InvitationEmailParams = {
  recipientName: string;
  tenantName: string;
  inviterName: string;
  resetUrl: string;
  logoUrl?: string;
  locale?: string;
};

export function getInvitationEmailHtml(params: InvitationEmailParams): string {
  const { recipientName, tenantName, inviterName, resetUrl, logoUrl, locale } = params;
  const t = getEmailTranslations(locale).invitation;

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${tenantName}" style="max-height: 64px; max-width: 200px; margin-bottom: 24px;" />`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${interpolate(t.title, { tenantName })}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              ${logoHtml}
              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                ${interpolate(t.title, { tenantName })}
              </h1>

              <p style="margin: 0 0 32px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                ${interpolate(t.greeting, { recipientName, inviterName: `<strong>${inviterName}</strong>` })}
              </p>

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                  ${t.setupMessage}
                </p>
              </div>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0052cc; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      ${t.button}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #9ca3af;">
                ${t.linkExpiry}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; word-break: break-all;">
                ${t.fallbackText}<br>
                <a href="${resetUrl}" style="color: #0052cc; text-decoration: none;">
                  ${resetUrl}
                </a>
              </p>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
          ${t.ignoreText}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type TenantWelcomeEmailParams = {
  userName: string;
  tenantName: string;
  dashboardUrl: string;
  logoUrl?: string;
  locale?: string;
};

export function getTenantWelcomeEmailHtml(params: TenantWelcomeEmailParams): string {
  const { userName, tenantName, dashboardUrl, logoUrl, locale } = params;
  const t = getEmailTranslations(locale).tenantWelcome;

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${tenantName}" style="max-height: 64px; max-width: 200px; margin-bottom: 24px;" />`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${interpolate(t.title, { tenantName })}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              ${logoHtml}
              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                ${interpolate(t.title, { tenantName })}
              </h1>

              <p style="margin: 0 0 32px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                ${interpolate(t.greeting, { userName })}
              </p>

              <div style="background-color: #f0f7ff; border-radius: 8px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #0052cc;">
                <p style="margin: 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                  ${t.accessMessage}
                </p>
              </div>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0052cc; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      ${t.button}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                ${interpolate(t.footer, { tenantName })}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type WelcomeVerificationEmailParams = {
  userName: string;
  verificationUrl: string;
};

export function getWelcomeVerificationEmailHtml(
  params: WelcomeVerificationEmailParams
): string {
  const { userName, verificationUrl } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome - Verify your email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <img src="https://cdn.uselearnbase.com/logo.png" alt="Learnbase" style="height: 48px; margin-bottom: 32px;" />

              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                Welcome, ${userName}!
              </h1>

              <p style="margin: 0 0 32px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                Thanks for signing up. Please verify your email address to get the most out of your account.
              </p>

              <div style="background-color: #f0f7ff; border-radius: 8px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #0052cc;">
                <p style="margin: 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                  Click the button below to verify your email and unlock all features.
                </p>
              </div>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0052cc; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #9ca3af;">
                This link will expire in 24 hours.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; word-break: break-all;">
                If the button doesn't work, copy this link:<br>
                <a href="${verificationUrl}" style="color: #0052cc; text-decoration: none;">
                  ${verificationUrl}
                </a>
              </p>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function getWaitlistConfirmationEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're on the waitlist!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <img src="https://cdn.uselearnbase.com/logo.png" alt="Learnbase" style="height: 48px; margin-bottom: 32px;" />

              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                You're on the list!
              </h1>

              <p style="margin: 0 0 32px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                We're thrilled to have you join us on this journey.
              </p>

              <div style="background-color: #f0f7ff; border-radius: 8px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #0052cc;">
                <p style="margin: 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                  Thank you for your interest in Learnbase! You'll be among the first to know when we launch and get early access to everything we're building.
                </p>
              </div>

              <p style="margin: 0; font-size: 14px; color: #9ca3af;">
                Stay tuned for exciting updates!
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 12px; font-size: 12px; color: #9ca3af;">
                Learnbase - The future of learning is here.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                <a href="https://x.com/learnbase" style="color: #0052cc; text-decoration: none;">@learnbase</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:hello@uselearnbase.com" style="color: #0052cc; text-decoration: none;">hello@uselearnbase.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type OwnerSaleNotificationParams = {
  ownerName: string;
  tenantName: string;
  buyerName: string;
  buyerEmail: string;
  courses: { title: string; price: string }[];
  grossAmount: string;
  platformFee: string;
  netEarnings: string;
  locale?: string;
};

export function getOwnerSaleNotificationEmailHtml(
  params: OwnerSaleNotificationParams
): string {
  const {
    ownerName,
    tenantName,
    buyerName,
    buyerEmail,
    courses,
    grossAmount,
    platformFee,
    netEarnings,
    locale,
  } = params;
  const t = getEmailTranslations(locale).ownerSale;

  const courseRows = courses
    .map(
      (course) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-size: 14px; color: #1f2937;">${course.title}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="font-size: 14px; color: #1f2937;">${course.price}</span>
        </td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${interpolate(t.title, { tenantName })}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; line-height: 64px; text-align: center;">
                  <span style="font-size: 28px; color: #ffffff;">$</span>
                </div>
                <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                  ${interpolate(t.title, { tenantName })}
                </h1>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                ${interpolate(t.greeting, { ownerName })}
              </p>

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">${t.customer}</p>
                <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #1f2937;">${buyerName}</p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">${buyerEmail}</p>
              </div>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 2px solid #e5e7eb;">
                    <span style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">${t.course}</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 2px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">${t.price}</span>
                  </td>
                </tr>
                ${courseRows}
              </table>

              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0;">
                      <span style="font-size: 14px; color: #4b5563;">${t.gross}</span>
                    </td>
                    <td style="padding: 4px 0; text-align: right;">
                      <span style="font-size: 14px; color: #1f2937;">${grossAmount}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;">
                      <span style="font-size: 14px; color: #4b5563;">${t.platformFee}</span>
                    </td>
                    <td style="padding: 4px 0; text-align: right;">
                      <span style="font-size: 14px; color: #dc2626;">-${platformFee}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 4px; border-top: 1px solid #bbf7d0;">
                      <span style="font-size: 16px; font-weight: 600; color: #1f2937;">${t.netEarnings}</span>
                    </td>
                    <td style="padding: 12px 0 4px; border-top: 1px solid #bbf7d0; text-align: right;">
                      <span style="font-size: 16px; font-weight: 600; color: #059669;">${netEarnings}</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                ${interpolate(t.footer, { tenantName })}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type BuyerPurchaseConfirmationParams = {
  buyerName: string;
  tenantName: string;
  courses: { title: string; price: string }[];
  totalAmount: string;
  receiptUrl: string | null;
  dashboardUrl: string;
  locale?: string;
};

export function getBuyerPurchaseConfirmationEmailHtml(
  params: BuyerPurchaseConfirmationParams
): string {
  const { buyerName, tenantName, courses, totalAmount, receiptUrl, dashboardUrl, locale } =
    params;
  const t = getEmailTranslations(locale).buyerConfirmation;

  const courseRows = courses
    .map(
      (course) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-size: 14px; color: #1f2937;">${course.title}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="font-size: 14px; color: #1f2937;">${course.price}</span>
        </td>
      </tr>
    `
    )
    .join("");

  const receiptButton = receiptUrl
    ? `
      <tr>
        <td style="padding: 8px;">
          <a href="${receiptUrl}" style="display: inline-block; padding: 14px 32px; background-color: #f3f4f6; color: #4b5563; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
            ${t.receiptButton}
          </a>
        </td>
      </tr>
    `
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #0052cc 0%, #0065ff 100%); border-radius: 50%; line-height: 64px; text-align: center;">
                  <span style="font-size: 28px; color: #ffffff;">&#10003;</span>
                </div>
                <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                  ${t.title}
                </h1>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                ${interpolate(t.greeting, { buyerName, tenantName })}
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 2px solid #e5e7eb;">
                    <span style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">${t.course}</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 2px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">${t.price}</span>
                  </td>
                </tr>
                ${courseRows}
                <tr>
                  <td style="padding: 16px 0;">
                    <span style="font-size: 16px; font-weight: 600; color: #1f2937;">${t.total}</span>
                  </td>
                  <td style="padding: 16px 0; text-align: right;">
                    <span style="font-size: 16px; font-weight: 600; color: #1f2937;">${totalAmount}</span>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width: 100%; border-collapse: collapse; text-align: center;">
                <tr>
                  <td style="padding: 8px;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0052cc; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      ${t.startButton}
                    </a>
                  </td>
                </tr>
                ${receiptButton}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                ${interpolate(t.footer, { tenantName })}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type SuperadminCommissionNotificationParams = {
  tenantName: string;
  saleAmount: string;
  commissionAmount: string;
  commissionRate: number;
  buyerEmail: string;
  courseCount: number;
};

export function getSuperadminCommissionNotificationEmailHtml(
  params: SuperadminCommissionNotificationParams
): string {
  const {
    tenantName,
    saleAmount,
    commissionAmount,
    commissionRate,
    buyerEmail,
    courseCount,
  } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commission Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <img src="https://cdn.uselearnbase.com/logo.png" alt="Learnbase" style="height: 48px; margin-bottom: 16px;" />
                <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                  Commission Received
                </h1>
              </div>

              <div style="background-color: #f0f7ff; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center; border-left: 4px solid #0052cc;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">You earned</p>
                <p style="margin: 0; font-size: 32px; font-weight: 700; color: #0052cc;">${commissionAmount}</p>
              </div>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Tenant</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; font-weight: 600; color: #1f2937;">${tenantName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Sale amount</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; color: #1f2937;">${saleAmount}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Commission rate</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; color: #1f2937;">${commissionRate}%</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Courses sold</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; color: #1f2937;">${courseCount}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="font-size: 14px; color: #6b7280;">Buyer</span>
                  </td>
                  <td style="padding: 12px 0; text-align: right;">
                    <span style="font-size: 14px; color: #1f2937;">${buyerEmail}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Learnbase Platform Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type SuperadminNewSubscriberParams = {
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  monthlyPrice: string;
};

export function getSuperadminNewSubscriberEmailHtml(
  params: SuperadminNewSubscriberParams
): string {
  const { tenantName, ownerName, ownerEmail, plan, monthlyPrice } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Subscriber</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <img src="https://cdn.uselearnbase.com/logo.png" alt="Learnbase" style="height: 48px; margin-bottom: 16px;" />
                <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                  New Subscriber
                </h1>
              </div>

              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center; border-left: 4px solid #10b981;">
                <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #1f2937;">${tenantName}</p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">subscribed to the <strong>${plan}</strong> plan</p>
              </div>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Owner</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; font-weight: 600; color: #1f2937;">${ownerName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Email</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; color: #1f2937;">${ownerEmail}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Plan</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; font-weight: 600; color: #0052cc;">${plan}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="font-size: 14px; color: #6b7280;">Monthly price</span>
                  </td>
                  <td style="padding: 12px 0; text-align: right;">
                    <span style="font-size: 14px; font-weight: 600; color: #1f2937;">${monthlyPrice}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Learnbase Platform Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type FeatureSubmissionParams = {
  userName: string;
  featureTitle: string;
};

export function getFeatureSubmissionEmailHtml(params: FeatureSubmissionParams): string {
  const { userName, featureTitle } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thanks for your suggestion!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto 24px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 50%; line-height: 64px;">
                <span style="font-size: 28px; color: #ffffff;">&#128161;</span>
              </div>

              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                Thanks for your idea!
              </h1>

              <p style="margin: 0 0 24px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                Hi ${userName}, we received your feature suggestion
              </p>

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Your suggestion:</p>
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">${featureTitle}</p>
              </div>

              <p style="margin: 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Our team will review your suggestion and get back to you soon. We truly appreciate your help in making Learnbase better!
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Learnbase Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type FeatureApprovedParams = {
  userName: string;
  featureTitle: string;
  featuresUrl: string;
};

export function getFeatureApprovedEmailHtml(params: FeatureApprovedParams): string {
  const { userName, featureTitle, featuresUrl } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We're shipping your feature!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; line-height: 64px;">
                <span style="font-size: 28px; color: #ffffff;">&#127881;</span>
              </div>

              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                We're shipping it!
              </h1>

              <p style="margin: 0 0 24px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                Great news ${userName}! Your feature suggestion has been approved.
              </p>

              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #10b981;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Your approved feature:</p>
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">${featureTitle}</p>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Your idea is now on our public roadmap. You can track its progress and see when it ships!
              </p>

              <a href="${featuresUrl}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                View Roadmap
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Thanks for helping make Learnbase better!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type FeatureRejectedParams = {
  userName: string;
  featureTitle: string;
  rejectionReason?: string;
};

export function getFeatureRejectedEmailHtml(params: FeatureRejectedParams): string {
  const { userName, featureTitle, rejectionReason } = params;

  const reasonSection = rejectionReason
    ? `
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #92400e;">Feedback:</p>
        <p style="margin: 0; font-size: 14px; color: #78350f;">${rejectionReason}</p>
      </div>
    `
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update on your feature suggestion</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                Update on your suggestion
              </h1>

              <p style="margin: 0 0 24px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                Hi ${userName}, thanks for your feature suggestion
              </p>

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Your suggestion:</p>
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">${featureTitle}</p>
              </div>

              ${reasonSection}

              <p style="margin: 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                After careful consideration, we've decided not to move forward with this feature at this time. This doesn't mean it's a bad idea - it just doesn't fit our current roadmap.
              </p>

              <p style="margin: 24px 0 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                We encourage you to keep sharing your ideas with us. Your feedback is invaluable!
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Thanks for helping make Learnbase better!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type RevenueCatWelcomeEmailParams = {
  recipientName: string;
  tenantName: string;
  resetUrl: string;
  logoUrl?: string;
  locale?: string;
};

export function getRevenueCatWelcomeEmailHtml(
  params: RevenueCatWelcomeEmailParams
): string {
  const { recipientName, tenantName, resetUrl, logoUrl, locale } = params;
  const t = getEmailTranslations(locale).revenueCatWelcome;

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${tenantName}" style="max-height: 64px; max-width: 200px; margin-bottom: 24px;" />`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${interpolate(t.title, { tenantName })}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              ${logoHtml}
              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                ${interpolate(t.title, { tenantName })}
              </h1>

              <p style="margin: 0 0 32px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                ${interpolate(t.greeting, { recipientName })}
              </p>

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                  ${t.purchaseMessage}
                </p>
              </div>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0052cc; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      ${t.button}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #9ca3af;">
                ${t.linkExpiry}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                ${t.ignoreText}
              </p>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
          ${interpolate(t.footer, { tenantName })}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

type ForgotPasswordEmailParams = {
  resetUrl: string;
  logoUrl?: string;
  tenantName?: string;
  locale?: string;
};

export function getForgotPasswordEmailHtml(params: ForgotPasswordEmailParams): string {
  const { resetUrl, logoUrl, tenantName, locale } = params;
  const t = getEmailTranslations(locale).forgotPassword;

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${tenantName || "LearnBase"}" style="max-height: 64px; max-width: 200px; margin-bottom: 24px;" />`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              ${logoHtml}
              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                ${t.title}
              </h1>

              <p style="margin: 0 0 32px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                ${t.message}
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0052cc; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      ${t.button}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #9ca3af;">
                ${t.linkExpiry}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                ${t.ignoreText}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}
