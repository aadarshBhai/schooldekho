import mongoose from 'mongoose';

const sponsorAdSchema = new mongoose.Schema(
    {
        // Section A: The "Brand" Info
        sponsorName: { type: String, required: true },
        websiteLink: { type: String, required: true },

        // Section B: High-Impact Visuals
        images: [{ type: String }],
        headline: { type: String, required: true, maxLength: 50 },
        description: { type: String, required: true },

        // Section C: Simple Targeting
        targetCities: [{ type: String }], // empty means 'All India'
        categoryLabel: {
            type: String,
            enum: ['School Admission', 'Teacher Hiring', 'Brand Event'],
            required: true
        },

        // Section D: MVP Tracking
        internalAdId: { type: String, required: true, unique: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

// Index for performance on date filtering
sponsorAdSchema.index({ endDate: 1, startDate: 1 });

export const SponsorAd = mongoose.model('SponsorAd', sponsorAdSchema);
