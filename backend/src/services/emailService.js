import nodemailer from 'nodemailer';

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services or generic SMTP
    auth: {
        user: process.env.EMAIL_USER, // Check .env
        pass: process.env.EMAIL_PASS, // Check .env
    },
});

export const sendVerificationEmail = async (to, name) => {
    try {
        const info = await transporter.sendMail({
            from: `"${process.env.APP_NAME || 'Zarvo Event Platform'}" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Account Verified - Zarvo',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Congratulations, ${name}!</h2>
          <p>Your account has been actively <strong>verified</strong> by our administration team.</p>
          <p>You now have full access to create and publish events on the Zarvo platform.</p>
          <br/>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
          <br/><br/>
          <p>Best regards,<br/>The Zarvo Team</p>
        </div>
      `,
        });
        console.log('Verification email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw error to avoid failing the HTTP request, just log it
        // In production, we might want to handle this more robustly
        return false;
    }
};
