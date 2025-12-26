import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxLength: 100 },
    content: { type: String, required: true, maxLength: 500 },
    link: { type: String, validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/i.test(v);
      },
      message: 'Link must be a valid URL starting with http:// or https://'
    }},
    category: { 
      type: String, 
      enum: ['general', 'feature', 'update', 'event', 'deadline'],
      default: 'general'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    isActive: { type: Boolean, default: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorEmail: { type: String, required: true },
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    tags: [{ type: String, maxLength: 20 }],
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Index for active announcements
announcementSchema.index({ isActive: 1, createdAt: -1 });
announcementSchema.index({ category: 1, priority: 1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
