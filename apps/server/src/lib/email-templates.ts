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
              <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">&#128075;</span>
              </div>

              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1f2937;">
                Welcome, ${userName}!
              </h1>

              <p style="margin: 0 0 32px; font-size: 16px; color: #6b7280; line-height: 1.6;">
                Thanks for signing up. Please verify your email address to get the most out of your account.
              </p>

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                  Click the button below to verify your email and unlock all features.
                </p>
              </div>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
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
                <a href="${verificationUrl}" style="color: #6366f1; text-decoration: none;">
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
