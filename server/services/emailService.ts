import nodemailer from "nodemailer";

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify SMTP connection on startup
transporter.verify()
  .then(() => {
    console.log("✅ SMTP Server is ready to send emails");
  })
  .catch((error) => {
    console.error("❌ SMTP Connection Error:", error);
  });

/* ---------------------------------------------------------
   SEND ORDER EMAIL (Admin + Customer)
---------------------------------------------------------- */

export const sendOrderEmail = async (orderDetails: any) => {
  const {
    name,
    phone_number,
    email,
    address,
    cans,
    total_price,
    payment_method,
    order_time
  } = orderDetails;

  const adminMailOptions = {
    from: `"Neerza" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: "🚰 New Water Can Order Received",
    html: `
      <h2>New Order Received</h2>

      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Mobile:</strong> ${phone_number}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Address:</strong> ${address}</p>

      <hr/>

      <p><strong>Cans:</strong> ${cans}</p>
      <p><strong>Total Price:</strong> ₹${total_price}</p>
      <p><strong>Payment:</strong> ${payment_method}</p>
      <p><strong>Order Time:</strong> ${order_time}</p>
    `
  };

  const customerMailOptions = {
    from: `"Neerza" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "✅ Order Confirmed - Neerza",
    html: `
      <h2>Order Confirmed!</h2>

      <p>Hi <b>${name}</b>,</p>

      <p>Your order for <b>${cans} water cans</b> has been placed successfully.</p>

      <p><b>Total Amount:</b> ₹${total_price}</p>
      <p>Delivery will be done in <b>7 hours</b>.</p>

      <p>Thank you for choosing Neerza 💧</p>
    `
  };

  try {

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠ Email credentials missing");
      return;
    }

    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(customerMailOptions)
    ]);

    console.log("📧 Order emails sent successfully");

  } catch (error) {

    console.error("❌ Error sending order email:", error);

  }
};

/* ---------------------------------------------------------
   SEND OTP EMAIL
---------------------------------------------------------- */

export const sendOTPEmail = async (
  email: string,
  name: string,
  otp: string
) => {

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("❌ Email credentials missing. OTP not sent.");
    return false;
  }

  const htmlTemplate = `
    <div style="font-family: Arial; max-width: 600px; margin:auto; padding:20px">

      <h1 style="color:#2563eb;">Neerza</h1>

      <p>Hi <b>${name}</b>,</p>

      <p>Your email verification OTP is:</p>

      <h2 style="
        letter-spacing:6px;
        background:#eff6ff;
        padding:15px;
        text-align:center;
        border-radius:8px;
      ">
        ${otp}
      </h2>

      <p>This OTP is valid for <b>5 minutes</b>.</p>

      <p>Do not share this code with anyone.</p>

      <br/>

      <p>Thank you,<br/>Neerza</p>

    </div>
  `;

  const mailOptions = {

    from: `"Neerza Accounts" <${process.env.EMAIL_USER}>`,

    to: email,

    subject: "Verify Your Email - Neerza",

    html: htmlTemplate,

    text: `
Hi ${name}

Your OTP is: ${otp}

Valid for 5 minutes.

Neerza
`
  };

  try {

    const info = await transporter.sendMail(mailOptions);

    console.log("📧 OTP Email sent:", info.messageId);

    return true;

  } catch (error) {

    console.error("❌ Error sending OTP email:", error);

    return false;

  }
};