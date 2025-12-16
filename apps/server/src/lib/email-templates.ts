type CertificateEmailParams = {
  studentName: string;
  courseName: string;
  verificationUrl: string;
  downloadUrl: string;
  tenantName: string;
};

export function getCertificateEmailHtml(params: CertificateEmailParams): string {
  const { studentName, courseName, verificationUrl, downloadUrl, tenantName } =
    params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Completion</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">&#127942;</span>
              </div>

              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                Congratulations, ${studentName}!
              </h1>

              <p style="margin: 0 0 32px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                You have successfully completed the course
              </p>

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #6366f1;">
                  ${courseName}
                </h2>
                <p style="margin: 0; font-size: 14px; color: #9ca3af;">
                  Issued by ${tenantName}
                </p>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Your certificate is ready! You can download it or share the verification link with others.
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px;">
                    <a href="${downloadUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Download Certificate
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #f3f4f6; color: #4b5563; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                      View Verification Page
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                Share your achievement with others using this verification link:
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; word-break: break-all;">
                <a href="${verificationUrl}" style="color: #6366f1; text-decoration: none;">
                  ${verificationUrl}
                </a>
              </p>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
          This email was sent by ${tenantName}
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
};

export function getInvitationEmailHtml(params: InvitationEmailParams): string {
  const { recipientName, tenantName, inviterName, resetUrl } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                Welcome to ${tenantName}
              </h1>

              <p style="margin: 0 0 32px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                Hi ${recipientName}, you've been invited by <strong>${inviterName}</strong>
              </p>

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                  To get started, please set up your password by clicking the button below.
                </p>
              </div>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Set Up Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #9ca3af;">
                This link will expire in 1 hour.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; word-break: break-all;">
                If the button doesn't work, copy this link:<br>
                <a href="${resetUrl}" style="color: #6366f1; text-decoration: none;">
                  ${resetUrl}
                </a>
              </p>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
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
  } = params;

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
  <title>New Sale</title>
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
                  New Sale on ${tenantName}
                </h1>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Hi ${ownerName}, you have a new sale!
              </p>

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Customer</p>
                <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #1f2937;">${buyerName}</p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">${buyerEmail}</p>
              </div>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 2px solid #e5e7eb;">
                    <span style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Course</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 2px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Price</span>
                  </td>
                </tr>
                ${courseRows}
              </table>

              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0;">
                      <span style="font-size: 14px; color: #4b5563;">Gross</span>
                    </td>
                    <td style="padding: 4px 0; text-align: right;">
                      <span style="font-size: 14px; color: #1f2937;">${grossAmount}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;">
                      <span style="font-size: 14px; color: #4b5563;">Platform fee</span>
                    </td>
                    <td style="padding: 4px 0; text-align: right;">
                      <span style="font-size: 14px; color: #dc2626;">-${platformFee}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 4px; border-top: 1px solid #bbf7d0;">
                      <span style="font-size: 16px; font-weight: 600; color: #1f2937;">Net earnings</span>
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
                You received this email because you are the owner of ${tenantName}.
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
};

export function getBuyerPurchaseConfirmationEmailHtml(
  params: BuyerPurchaseConfirmationParams
): string {
  const { buyerName, tenantName, courses, totalAmount, receiptUrl, dashboardUrl } =
    params;

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
            View Receipt
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
  <title>Purchase Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 48px 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 50%; line-height: 64px; text-align: center;">
                  <span style="font-size: 28px; color: #ffffff;">&#10003;</span>
                </div>
                <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                  Thank you for your purchase!
                </h1>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Hi ${buyerName}, your purchase from ${tenantName} has been confirmed.
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 2px solid #e5e7eb;">
                    <span style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Course</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 2px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Price</span>
                  </td>
                </tr>
                ${courseRows}
                <tr>
                  <td style="padding: 16px 0;">
                    <span style="font-size: 16px; font-weight: 600; color: #1f2937;">Total</span>
                  </td>
                  <td style="padding: 16px 0; text-align: right;">
                    <span style="font-size: 16px; font-weight: 600; color: #1f2937;">${totalAmount}</span>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width: 100%; border-collapse: collapse; text-align: center;">
                <tr>
                  <td style="padding: 8px;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Start Learning
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
                This email was sent by ${tenantName}.
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
                    <span style="font-size: 14px; font-weight: 600; color: #6366f1;">${plan}</span>
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
