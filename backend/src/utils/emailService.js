import nodemailer from "nodemailer";

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "fahadvohra143@gmail.com";

// Create Nodemailer transport for real SMTP / Gmail email delivery
const getTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  if (smtpUser && smtpPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  // Fallback dev transport logging to console when SMTP credentials are not yet added in .env
  return nodemailer.createTransport({
    jsonTransport: true,
  });
};


/**
 * Send notification email to Admin when a new student registers
 */
export const sendAdminRegistrationNotification = async (studentInfo) => {
  const mailOptions = {
    from: `"EduMaster ERP" <noreply@edumaster.com>`,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `🚨 New Student Registered: ${studentInfo.fullName} (${studentInfo.studentId || "NEW"})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #38bdf8; margin-top: 0;">🎓 New Student Registration Alert</h2>
        <p style="color: #94a3b8;">A new student has successfully registered on EduMaster System.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; text-align: left; font-size: 14px;">
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Student Name:</th>
            <td style="padding: 10px; font-weight: bold; color: #ffffff;">${studentInfo.fullName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Student ID:</th>
            <td style="padding: 10px; font-weight: bold; color: #38bdf8;">${studentInfo.studentId || "N/A"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Mobile:</th>
            <td style="padding: 10px; color: #ffffff;">${studentInfo.mobile}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Email:</th>
            <td style="padding: 10px; color: #ffffff;">${studentInfo.email || "N/A"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Registration Time:</th>
            <td style="padding: 10px; color: #94a3b8;">${new Date().toLocaleString("en-IN")}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 12px; background: #1e293b; border-radius: 8px; font-size: 12px; color: #cbd5e1;">
          EduMaster ERP Automated System Notification
        </div>
      </div>
    `,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);

    console.log(`[EMAIL SENT] Admin Notification sent to ${ADMIN_NOTIFICATION_EMAIL}:`, info.messageId || info);
    return true;
  } catch (err) {
    console.error("[EMAIL ERROR] Failed to send admin email:", err);
    return false;
  }
};

/**
 * Send notification email to Admin when a new Inquiry is generated
 */
export const sendAdminInquiryNotification = async (inquiryInfo) => {
  const mailOptions = {
    from: `"EduMaster ERP" <noreply@edumaster.com>`,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `📩 New Inquiry Received: ${inquiryInfo.fullName} (${inquiryInfo.inquiryNumber || "NEW"})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #06b6d4; margin-top: 0;">📩 New Student Inquiry Alert</h2>
        <p style="color: #94a3b8;">A new inquiry has been submitted on the EduMaster ERP system.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; text-align: left; font-size: 14px;">
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Inquiry Number:</th>
            <td style="padding: 10px; font-weight: bold; color: #06b6d4;">${inquiryInfo.inquiryNumber || "N/A"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Applicant Name:</th>
            <td style="padding: 10px; font-weight: bold; color: #ffffff;">${inquiryInfo.fullName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Mobile:</th>
            <td style="padding: 10px; color: #ffffff;">${inquiryInfo.mobile}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Email:</th>
            <td style="padding: 10px; color: #ffffff;">${inquiryInfo.email || "N/A"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Course Interested:</th>
            <td style="padding: 10px; color: #38bdf8;">${inquiryInfo.courseName || "General Course"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Remarks/Message:</th>
            <td style="padding: 10px; color: #94a3b8;">${inquiryInfo.remarks || "No remarks provided"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <th style="padding: 10px; color: #cbd5e1;">Date & Time:</th>
            <td style="padding: 10px; color: #94a3b8;">${new Date().toLocaleString("en-IN")}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 12px; background: #1e293b; border-radius: 8px; font-size: 12px; color: #cbd5e1;">
          EduMaster ERP Automated System Notification
        </div>
      </div>
    `,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);

    console.log(`[EMAIL SENT] Admin Inquiry Alert sent to ${ADMIN_NOTIFICATION_EMAIL}:`, info.messageId || info);
    return true;
  } catch (err) {
    console.error("[EMAIL ERROR] Failed to send inquiry email to admin:", err);
    return false;
  }
};


/**
 * Send Forgot Password Reset OTP/Email to student
 */
export const sendForgotPasswordEmail = async (toEmail, studentName, resetOtp) => {
  const mailOptions = {
    from: `"EduMaster ERP Support" <support@edumaster.com>`,
    to: toEmail,
    subject: `🔑 Password Reset OTP Code: ${resetOtp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #38bdf8; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #cbd5e1;">Hello ${studentName || "Student"},</p>
        <p style="color: #94a3b8;">We received a request to reset your EduMaster account password. Use the OTP code below to reset your password:</p>
        
        <div style="margin: 20px 0; text-align: center;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; background: #0284c7; color: #ffffff; border-radius: 8px; display: inline-block;">
            ${resetOtp}
          </span>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px;">This OTP code is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);

    console.log(`[EMAIL SENT] Reset OTP sent to ${toEmail}:`, info.messageId || info);
    return true;
  } catch (err) {
    console.error("[EMAIL ERROR] Failed to send reset email:", err);
    return false;
  }
};
