import express from 'express';
import nodemailer from 'nodemailer';
import { Event } from '../models/Event.js';
import { Participation } from '../models/Participation.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// POST /api/participation - Submit participation and send emails
router.post('/', auth, async (req, res) => {
  try {
    const { eventId, participant } = req.body;
    const userId = req.user._id;

    if (!eventId || !participant?.name || !participant?.email || !participant?.phone || !participant?.emergencyContact) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Fetch event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Save to database
    const newParticipation = new Participation({
      eventId,
      userId,
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      grade: participant.grade,
      schoolName: participant.schoolName,
      city: participant.city,
      role: participant.role || 'participant',
      isTeam: participant.isTeam || false,
      teamName: participant.teamName,
      teammateEmails: participant.teammateEmails || [],
      tShirtSize: participant.tShirtSize || 'NA',
      dietaryRestrictions: participant.dietaryRestrictions,
      parentalConsent: participant.parentalConsent || false,
      emergencyContact: participant.emergencyContact,
      schoolAuthorization: participant.schoolAuthorization || false,
    });

    await newParticipation.save();

    // Use organizer email from event if present, otherwise fallback to admin email
    const recipientOrganizerEmail = event.organizerEmail || process.env.ADMIN_EMAIL;
    const eventTitle = event.title;
    const organizerName = event.organizerName;

    // Send email to organizer
    await transporter.sendMail({
      from: `"EventDekho" <${process.env.SMTP_USER}>`,
      to: recipientOrganizerEmail,
      subject: `New Registration for Your Event: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 New Registration Received!</h2>
          <p>A new participant has registered for <strong>${eventTitle}</strong>.</p>
          
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Participant Profile:</h3>
            <p><strong>Name:</strong> ${participant.name}</p>
            <p><strong>Grade & School:</strong> Grade ${participant.grade}, ${participant.schoolName}</p>
            <p><strong>Location:</strong> ${participant.city}</p>
            <p><strong>Email:</strong> <a href="mailto:${participant.email}">${participant.email}</a></p>
            <p><strong>Phone:</strong> <a href="tel:${participant.phone}">${participant.phone}</a></p>
            
            <h3 style="margin-top: 20px; color: #1f2937;">Participation Details:</h3>
            <p><strong>Role:</strong> ${participant.role}</p>
            <p><strong>Team:</strong> ${participant.isTeam ? `Yes (${participant.teamName})` : 'Individual'}</p>
            ${participant.isTeam ? `<p><strong>Teammates:</strong> ${participant.teammateEmails.join(', ')}</p>` : ''}
            <p><strong>T-Shirt Size:</strong> ${participant.tShirtSize}</p>
            <p><strong>Dietary Needs:</strong> ${participant.dietaryRestrictions || 'None'}</p>
            
            <h3 style="margin-top: 20px; color: #1f2937;">Safety & Consent:</h3>
            <p><strong>Emergency Contact:</strong> ${participant.emergencyContact}</p>
            <p><strong>Parental Consent:</strong> ${participant.parentalConsent ? '✅ Confirmed' : '❌ Pending'}</p>
            <p><strong>School Informed:</strong> ${participant.schoolAuthorization ? '✅ Yes' : '❌ No'}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Reach out to the participant for any additional queries.
          </p>
        </div>
      `,
    });

    // Send confirmation email to participant
    await transporter.sendMail({
      from: `"EventDekho" <${process.env.SMTP_USER}>`,
      to: participant.email,
      subject: `Registration Confirmed! - ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 You're All Set!</h2>
          <p>Hi <strong>${participant.name}</strong>,</p>
          <p>Your registration for <strong>${eventTitle}</strong> is confirmed!</p>
          
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Event:</strong> ${eventTitle}</p>
            <p><strong>Organizer:</strong> ${organizerName}</p>
            <p><strong>Role:</strong> ${participant.role}</p>
          </div>
          
          <p>Please keep this email for your records. The organizer will contact you if there are any further updates.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Sent by EventDekho safely on behalf of ${organizerName}.
          </p>
        </div>
      `,
    });

    res.json({ message: 'Registration successful! Confirmation emails sent.' });
  } catch (err) {
    console.error('POST /api/participation error:', err.message);
    res.status(500).json({ message: 'Failed to submit registration. Please try again.' });
  }
});

export default router;
