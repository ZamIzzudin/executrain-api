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

const PRODUCT_TYPES = {
  APP_DEVELOPMENT: "App Development",
  IT_PRODUCT: "IT Product",
  CASE_STUDY: "Case Study",
};

const submit_product_inquiry = async (req, res) => {
  const {
    name,
    email,
    phone_number,
    company_name,
    product_name,
    product_type,
    message,
  } = req.body;

  try {
    if (
      !name ||
      !email ||
      !phone_number ||
      !company_name ||
      !product_name ||
      !product_type ||
      !message
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

    const productTypeLabel =
      PRODUCT_TYPES[product_type] || product_type || "-";

    const submittedAt = new Date().toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    });

    // Email to sales team
    const salesHtml = `
<html>
<head>
<title>New Product Inquiry</title>
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
          <img src="${MAIL_LOGO}" alt="logo_company" />
        </div>

        <h1 style="color:#ffffff;font-size:26px;font-weight:600;margin:0 0 8px;line-height:1.3;">New Product Inquiry</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0 0 4px;">A new product inquiry has been submitted and requires your attention.</p>
        <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0;">Submitted on <strong style="color:rgba(255,255,255,0.85);">${submittedAt}</strong></p>
      </div>
    </div>

    <!-- BODY -->
    <div style="background:#ffffff; padding:32px;">

      <!-- Intro copywriting -->
      <div style="margin-bottom:28px;">
        <p style="font-size:15px;font-weight:600;line-height:1.7;margin:0 0 12px;color:#BE0F34;">Hello Team,</p>
        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0;">A prospective client has shown interest in one of our products. Please review the inquiry details below and follow up with them.</p>
      </div>

      <!-- Section label -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="font-size:12px;font-weight:700;color:#BE0F34;letter-spacing:1px;text-transform:uppercase;">Inquiry Details</span>
      </div>

      <!-- Info table -->
      <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;width:42%;border-bottom:1px solid #e5e7eb;">Product Type</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${productTypeLabel}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Product Name</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${product_name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Name</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Company</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${company_name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Email Address</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${email}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Phone Number</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${phone_number}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;">Message</td>
            <td style="padding:13px 16px;color:#111827;white-space:pre-wrap;line-height:1.6;">${message}</td>
          </tr>
        </table>
      </div>

      <!-- CTA note -->
      <div style="background:#fef2f4;border-left:4px solid #BE0F34;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:28px;">
        <p style="font-size:13px;color:#7c1c2e;margin:0;line-height:1.6;">
          <strong>Action Required:</strong> Please follow up with this prospect at your earliest convenience. You can reply directly to this email to reach them.
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
        <a href="#" style="color:#9ca3af;text-decoration:none;">www.executrain.co.id</a>
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

    // Confirmation email to user
    const userHtml = `
<html>
<head>
<title>Product Inquiry Received</title>
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

        <h1 style="color:#ffffff;font-size:26px;font-weight:600;margin:0 0 8px;line-height:1.3;">We've Received Your Inquiry</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">Our team will review your inquiry and get back to you shortly.</p>
      </div>
    </div>

    <!-- BODY -->
    <div style="background:#ffffff; padding:32px;">

      <!-- Greeting -->
      <div style="margin-bottom:28px;">
        <p style="font-size:15px;font-weight:600;line-height:1.7;margin:0 0 12px;color:#BE0F34;">Dear ${name},</p>
        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0;">Thank you for your interest in <strong style="color:#BE0F34;">${product_name}</strong>. We have received your inquiry and our team will get back to you with detailed information. Below is a summary of your submission.</p>
      </div>

      <!-- Section label -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="font-size:12px;font-weight:700;color:#BE0F34;letter-spacing:1px;text-transform:uppercase;">Your Submission</span>
      </div>

      <!-- Info table -->
      <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;width:42%;border-bottom:1px solid #e5e7eb;">Product Type</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${productTypeLabel}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Product Name</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${product_name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Name</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Company</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${company_name}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Email Address</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${email}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Phone Number</td>
            <td style="padding:13px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${phone_number}</td>
          </tr>
          <tr>
            <td style="padding:13px 16px;background:#fafafa;color:#6b7280;font-weight:600;">Message</td>
            <td style="padding:13px 16px;color:#111827;white-space:pre-wrap;line-height:1.6;">${message}</td>
          </tr>
        </table>
      </div>

      <!-- What happens next -->
      <div style="background:#fef2f4;border-left:4px solid #BE0F34;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:28px;">
        <p style="font-size:13px;color:#7c1c2e;margin:0;line-height:1.6;">
          <strong>What happens next:</strong> Our team will review your inquiry and get back to you within 1-2 business days. If your matter is urgent, please don't hesitate to contact us directly via WhatsApp or phone.
        </p>
      </div>

      <!-- Closing -->
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">Thank you for your interest in ExecuTrain. We look forward to assisting you!</p>
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
      to: salesEmailEntry.socmed_link,
      subject: `[Product Inquiry] ${productTypeLabel} - ${product_name}`,
      html: salesHtml,
      replyTo: email,
    });

    await transporter.sendMail({
      from: `"${SMTP_GMAIL_FROM_NAME || "ExecuTrain Website"}" <${SMTP_GMAIL_USER}>`,
      to: email,
      subject: `We've Received Your Inquiry - ${product_name}`,
      html: userHtml,
    });

    return res.status(201).json({
      status: 201,
      message: "Product inquiry submitted successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Failed to submit product inquiry",
    });
  }
};

module.exports = {
  submit_product_inquiry,
};
