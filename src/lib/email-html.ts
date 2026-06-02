// Converts plain text email body into a clean HTML email
// Sending both HTML + text improves deliverability vs plain-text only
export function buildHtmlEmail(plainText: string): string {
  const paragraphs = plainText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      // Preserve single line breaks within a paragraph
      const lines = block.split('\n').map((l) => l.trim()).join('<br>');
      return `<p style="margin:0 0 16px 0;line-height:1.6;">${lines}</p>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monster Design</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#111111;padding:24px 32px;">
              <span style="font-size:22px;font-weight:900;color:#f97316;letter-spacing:-0.5px;">MONSTER</span>
              <span style="font-size:22px;font-weight:300;color:#ffffff;letter-spacing:-0.5px;"> DESIGN</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;color:#222222;font-size:15px;">
              ${paragraphs}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;border-top:1px solid #eeeeee;padding:20px 32px;">
              <p style="margin:0;font-size:12px;color:#888888;line-height:1.6;">
                Monster Design &nbsp;|&nbsp;
                <a href="https://monster-design.com" style="color:#f97316;text-decoration:none;">monster-design.com</a>
                &nbsp;|&nbsp;
                <a href="https://www.behance.net/monster_design_" style="color:#f97316;text-decoration:none;">Portfolio</a>
                &nbsp;|&nbsp;
                <a href="mailto:info@monster-design.com" style="color:#888888;text-decoration:none;">info@monster-design.com</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#aaaaaa;">
                You are receiving this email because we believe our design services may benefit your business.
                If you&apos;d prefer not to receive further emails, simply reply with &quot;unsubscribe&quot;.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
