import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, subject, message } = await req.json();

    // Validate input
    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Configure the email transporter (Using Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your Gmail App Password
      },
    });

    // Define email options
    const mailOptions = {
      from: `"DecentralClaim Support" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL, // Admin address receiving the feedback
      replyTo: email || process.env.EMAIL_USER,
      subject: `[Support Request] ${subject}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0;">New Support Request</h2>
          </div>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
            <p><strong>From:</strong> ${email || 'Anonymous User'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
            <h3 style="color: #333;">Message:</h3>
            <div style="background: white; padding: 15px; border-left: 4px solid #667eea; border-radius: 5px;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
            <p style="font-size: 12px; color: #888;">
              This message was sent from DecentralizedClaim Help Center
            </p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Support ticket created! We will contact you shortly.' 
    });
  } catch (error) {
    console.error('Failed to send support email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email. Please try again.' },
      { status: 500 }
    );
  }
}
