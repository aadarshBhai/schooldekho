import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['academic_tech', 'leadership_literary', 'sports_fitness', 'creative_arts'],
    },
    organizerId: { type: String, required: true },
    organizerName: { type: String, required: true },
    organizerAvatar: { type: String, default: '' },
    organizerEmail: { type: String, default: '' }, // Email for participation notifications
    images: [{ type: String }], // Array of Cloudinary URLs
    video: { type: String }, // Cloudinary URL for video
    image: { type: String }, // Backward compatibility (first image)
    location: { type: String, required: true },
    date: { type: String, required: true }, // ISO date string
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    isLiked: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    isSponsored: { type: Boolean, default: false },
    teaser: { type: String, maxLength: 150 },
    subCategoryTags: [{ type: String }],
    mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'offline' },
    eligibility: [{ type: String, enum: ['9', '10', '11', '12'] }],
    registrationFee: { type: String, default: 'Free' },
    prizePool: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    venueLink: { type: String },
    // Professional/Granular Fields
    subjectExpertise: {
      type: String,
      enum: ['Mathematics', 'Science', 'Arts', 'Sports Coach', 'Admin', 'NA'],
      default: 'NA'
    },
    experienceRequired: {
      type: String,
      enum: ['Fresher', '1-3 Years', '5+ Years', 'NA'],
      default: 'NA'
    },
    jobType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Visiting Faculty', 'NA'],
      default: 'NA'
    },
    entryType: {
      type: String,
      enum: ['Individual', 'Team-based'],
      default: 'Individual'
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);
