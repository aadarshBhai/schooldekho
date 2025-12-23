import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
    user: {
        type: String, // String to support both ObjectId and 'admin-env' virtual user
        required: true,
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
}, {
    timestamps: true,
});

// Compound index to ensure a user can only like an event once
likeSchema.index({ user: 1, eventId: 1 }, { unique: true });

export const Like = mongoose.model('Like', likeSchema);
