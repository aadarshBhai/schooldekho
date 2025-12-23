import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Event } from './models/Event.js';

dotenv.config();

// List of demo organizer IDs that should be removed
const demoOrganizerIds = ['org-1', 'org-2', 'org-3', 'org-4', 'org-5', 'org-6'];

async function clearDemoEvents() {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI not set in .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Count events before deletion
    const totalBefore = await Event.countDocuments();
    console.log(`Total events before cleanup: ${totalBefore}`);

    // Delete events created by demo organizers
    const result = await Event.deleteMany({
        organizerId: { $in: demoOrganizerIds }
    });

    console.log(`Deleted ${result.deletedCount} demo events`);

    // Show remaining events
    const remaining = await Event.find({});
    console.log(`Remaining events: ${remaining.length}`);

    if (remaining.length > 0) {
        console.log('\nRemaining events:');
        remaining.forEach(event => {
            console.log(`- ${event.title} (by ${event.organizerName})`);
        });
    }

    await mongoose.disconnect();
    console.log('\nCleanup complete!');
}

clearDemoEvents().catch(err => {
    console.error('Cleanup error:', err);
    process.exit(1);
});
