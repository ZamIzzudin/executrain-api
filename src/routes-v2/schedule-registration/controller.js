/** @format */

const nodemailer = require("nodemailer");
const SocmedRepository = require("../socmed/repository");
const {
  SMTP_GMAIL_USER,
  SMTP_GMAIL_APP_PASSWORD,
  SMTP_GMAIL_FROM_NAME,
} = require("../../config/var");

// Asset email (Azure Blob). Ganti sesuai key yang diupload ke container image.
const S3_BASE = "https://storagewebsitetoj.blob.core.windows.net/image";
const MAIL_BG = `${S3_BASE}/mail/background.jpg`;
const MAIL_LOGO = `${S3_BASE}/mail/logo.png`;
const MAIL_LOGO_COLORED = `${S3_BASE}/mail/logo-colored.png`;

const submit_registration = async (req, res) => {
  const {
    full_name,
    company_name,
    email_address,
    phone_number,
    product_name,
    schedule_date,
    schedule_type,
  } = req.body;

  try {
    if (
      !full_name ||
      !company_name ||
      !email_address ||
      !phone_number ||
      !product_name ||
      !schedule_date
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please complete all required fields",
      });
    }

    const salesEmailEntry = await SocmedRepository.findByName("SALES_EMAIL");

    if (!salesEmailEntry?.socmed_link) {
      return res.status(404).json({
        status: 404,
        message: "Sales email is not configured",
      });
    }

    if (!SMTP_GMAIL_USER || !SMTP_GMAIL_APP_PASSWORD) {
      return res.status(500).json({
        status: 500,
        message: "SMTP Gmail credentials are not configured",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_GMAIL_USER,
        pass: SMTP_GMAIL_APP_PASSWORD,
      },
    });

    const scheduleType = schedule_type || "Regular";
    const submittedAt = new Date().toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    });

    const html = `
<html>
<head>
<title>Notification Email</title>
</head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

  * {
    font-family: 'Poppins', sans-serif;
    box-sizing: border-box;
  }
</style>
<body>
  
<div style="font-family: Arial, sans-serif;">
  <h2 class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);">Preview template email registrasi jadwal</h2>

<!-- //linear-gradient(135deg, #BE0F34 0%, #8B0A25 100%) -->
    <!-- BANNER HEADER -->
    <div style="background: url('${MAIL_BG}'); padding:0; overflow:hidden; position:relative; background-size: cover; background-position: center;">
      <div style="position:relative; z-index:1; padding:36px 32px 28px;">
        <!-- Logo area -->
        <div style="display:flex; align-items:center; justify-content: space-between; gap:10px; margin-bottom:24px;">

          <img src="${MAIL_LOGO}" alt="logo_company"/>
          <!-- <span style="color:rgba(255,255,255,0.9);font-size:15px;font-weight:700;letter-spacing:0.5px;">YOUR COMPANY</span> -->
        </div>

        <!-- Badge -->

        <h1 style="color:#ffffff;font-size:26px;font-weight:600;margin:0 0 8px;line-height:1.3;">Schedule Confirmation</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0 0 4px;">A new schedule has been submitted and is awaiting your review.</p>
        <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0;">Submitted on <strong style="color:rgba(255,255,255,0.85);">${submittedAt}</strong></p>
      </div>
    </div>

    <!-- BODY -->
    <div style="background:#ffffff; padding:32px;">

      <!-- Intro copywriting -->
      <div style="margin-bottom:28px;">
        <p style="font-size:15px;font-weight:600 ;line-height:1.7;margin:0 0 12px; color:#BE0F34">Hello Team,</p>
        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0;">A new schedule registration has just been submitted through our platform. Please review the details below and take the necessary action to confirm or follow up with the client.</p>
      </div>

      <!-- Section label -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="font-size:12px;font-weight:700;color:#BE0F34;letter-spacing:1px;text-transform:uppercase;">Submission Details</span>
      </div>

      <!-- Info table -->
      <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;width:42%;border-bottom:1px solid #e5e7eb;">Full Name</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${full_name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Company</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${company_name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Email Address</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${email_address}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Phone Number</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${phone_number}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Product</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${product_name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Schedule Date</td>
            <td style="padding:13px 16px;border-bottom:1px solid #e5e7eb;">
              <span style="color:#111827;">${schedule_date}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;">Schedule Type</td>
            <td style="padding:13px 16px;">
              <span style="display:inline-block;background:#fef2f4;color:#BE0F34;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">${scheduleType}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA note -->
      <div style="background:#fef2f4;border-left:4px solid #BE0F34;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:28px;">
        <p style="font-size:13px;color:#7c1c2e;margin:0;line-height:1.6;">
          <strong>Action Required:</strong> Please review the schedule and coordinate with the client to confirm the meeting time. Respond promptly to ensure a positive experience.
        </p>
      </div>

      <!-- Closing -->
      <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0;">If you have any questions or need further assistance, feel free to reach out to the operations team.<br><br>
      Best regards,<br>
      <strong style="color:#374151;">Administrator</strong><br>
      <span style="color:#BE0F34;">PT. ExecuTrain Nusantarajaya</span>
      </p>
    </div>

    <!-- DIVIDER -->
    <div style="background:#ffffff;padding:0 32px;">
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;">
    </div>

    <!-- FOOTER -->
    <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:24px 32px 28px;">

      <!-- Logo + company name -->
      <div style="display:flex;flex-direction: column; align-items:center;justify-content:center;gap:10px;margin-bottom:16px; width: 100%; height: 75px; background-image: url('${MAIL_LOGO_COLORED}'); background-repeat: no-repeat; background-size: contain; background-position: center;">            
      </div>
      <p style="text-align:center;font-size:12px;color:#9ca3af;margin:0 0 14px;line-height:1.7;">
        Plaza Setiabudi, Setiabudi Atrium Building, 2nd Floor - Suite 203,<br/>Jl. HR. Rasuna Said. Kav. 62, South Jakarta - 12920, Indonesia
      </p>

      <!-- Address -->


      <!-- Contact & legal -->
      <p style="text-align:center;font-size:11px;color:#d1d5db;margin:0 0 6px;">
        <a href="mailto:sales@executrain.co.id" style="color:#9ca3af;text-decoration:none;">sales@executrain.co.id</a>
        &nbsp;·&nbsp;
        <a href="tel:+6281292506850" style="color:#9ca3af;text-decoration:none;">+62 8129 2506 850</a>
        &nbsp;·&nbsp;
        <a href="#" style="color:#9ca3af;text-decoration:none;">www.executrain.co.id</a>
      </p>
      <p style="text-align:center;font-size:11px;color:#d1d5db;margin:0;">
        © 2026 PT. ExecuTrain Nusantarajaya. All rights reserved. &nbsp;·&nbsp;
      </p>
    </div>
</div>

  </body>
  </html>

    `;

    await transporter.sendMail({
      from: `"${SMTP_GMAIL_FROM_NAME || "ExecuTrain Website"}" <${SMTP_GMAIL_USER}>`,
      to: salesEmailEntry.socmed_link,
      subject: `[${scheduleType}] Schedule Registration - ${product_name}`,
      html,
      replyTo: email_address,
    });

    const userHtml = `
<html>
<head>
<title>Class Registration Confirmation</title>
</head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

  * {
    font-family: 'Poppins', sans-serif;
    box-sizing: border-box;
  }
</style>
<body>

<div>
  <div>

    <!-- BANNER HEADER -->
    <div style="background: url('${MAIL_BG}'); padding:0; overflow:hidden; position:relative; background-size: cover; background-position: center;">
      <div style="position:relative; z-index:1; padding:36px 32px 28px;">
        <div style="display:flex; align-items:center; justify-content: space-between; gap:10px; margin-bottom:24px;">
          <img src="${MAIL_LOGO}" alt="ExecuTrain" />
        </div>

        <h1 style="color:#ffffff;font-size:26px;font-weight:600;margin:0 0 8px;line-height:1.3;">Class Registration Confirmation</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">Your registration has been received and is being reviewed.</p>
      </div>
    </div>

    <!-- BODY -->
    <div style="background:#ffffff; padding:32px;">

      <!-- Greeting -->
      <div style="margin-bottom:28px;">
        <p style="font-size:15px;font-weight:600;line-height:1.7;margin:0 0 12px;color:#BE0F34;">Dear ${full_name},</p>
        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0;">Thank you for registering for our training program. We have successfully received your submission and our team is currently reviewing the details.</p>
      </div>

      <!-- Section label -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="font-size:12px;font-weight:700;color:#BE0F34;letter-spacing:1px;text-transform:uppercase;">Registration Summary</span>
      </div>

      <!-- Info table -->
      <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;width:42%;border-bottom:1px solid #e5e7eb;">Full Name</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${full_name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Company</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${company_name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Email Address</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${email_address}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Phone Number</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${phone_number}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Product</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${product_name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Schedule Date</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${schedule_date}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;">Schedule Type</td>
            <td style="padding:13px 16px;">
              <span style="display:inline-block;background:#fef2f4;color:#BE0F34;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">${scheduleType}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- What happens next -->
      <div style="background:#fef2f4;border-left:4px solid #BE0F34;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:28px;">
        <p style="font-size:13px;color:#7c1c2e;margin:0;line-height:1.6;">
          <strong>What happens next:</strong> Our team will reach out to you shortly to confirm the schedule and provide further details regarding the class. If you have any questions in the meantime, please don't hesitate to contact us.
        </p>
      </div>

      <!-- Closing -->
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">Thank you for choosing us for your training needs. We look forward to having you in class!</p>
      <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0;">
        Best regards,<br>
        <strong style="color:#BE0F34;">ExecuTrain of Jakarta</strong>
      </p>
    </div>

    <!-- DIVIDER -->
    <div style="background:#ffffff;padding:0 32px;">
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;">
    </div>

    <!-- FOOTER -->
    <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:24px 32px 28px;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;margin-bottom:16px;width:100%;height:75px;background-image:url('${MAIL_LOGO_COLORED}');background-repeat:no-repeat;background-size:contain;background-position:center;">
      </div>
      <p style="text-align:center;font-size:12px;color:#9ca3af;margin:0 0 14px;line-height:1.7;">
        Plaza Setiabudi, Setiabudi Atrium Building, 2nd Floor - Suite 203,<br/>Jl. HR. Rasuna Said. Kav. 62, South Jakarta - 12920, Indonesia
      </p>
      <p style="text-align:center;font-size:11px;color:#d1d5db;margin:0 0 6px;">
        <a href="mailto:sales@executrain.co.id" style="color:#9ca3af;text-decoration:none;">sales@executrain.co.id</a>
        &nbsp;·&nbsp;
        <a href="tel:+6281292506850" style="color:#9ca3af;text-decoration:none;">+62 8129 2506 850</a>
        &nbsp;·&nbsp;
        <a href="https://www.executrain.co.id" style="color:#9ca3af;text-decoration:none;">www.executrain.co.id</a>
      </p>
      <p style="text-align:center;font-size:11px;color:#d1d5db;margin:0;">
        &copy; 2026 PT. ExecuTrain Nusantarajaya. All rights reserved.
      </p>
    </div>

  </div>
</div>

</body>
</html>
    `;

    await transporter.sendMail({
      from: `"${SMTP_GMAIL_FROM_NAME || "ExecuTrain Website"}" <${SMTP_GMAIL_USER}>`,
      to: email_address,
      subject: `Class Registration Confirmation - ${product_name}`,
      html: userHtml,
    });

    return res.status(201).json({
      status: 201,
      message: "Registration submitted successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Failed to submit registration",
    });
  }
};

module.exports = {
  submit_registration,
};
