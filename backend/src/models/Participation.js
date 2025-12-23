import mongoose from 'mongoose';

const participationSchema = new mongoose.Schema(
    {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        // Section A: Profile Snapshot (Pre-filled from account)
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        grade: { type: String },
        schoolName: { type: String },
        city: { type: String },

        // Section B: Participation Details
        role: { type: String, enum: ['participant', 'volunteer', 'attendee'], default: 'participant' },
        isTeam: { type: Boolean, default: false },
        teamName: { type: String },
        teammateEmails: [{ type: String }],
        tShirtSize: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'NA'], default: 'NA' },
        dietaryRestrictions: { type: String },

        // Section C: Verification & Consent
        parentalConsent: { type: Boolean, required: true },
        emergencyContact: { type: String, required: true },
        schoolAuthorization: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const Participation = mongoose.model('Participation', participationSchema);
