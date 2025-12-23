import mongoose from 'mongoose';
import { Event } from './src/models/Event.js';
import { SponsorAd } from './src/models/SponsorAd.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/yourDB')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Update all unapproved events to approved
    const eventResult = await Event.updateMany(
      { approved: false },
      { $set: { approved: true } }
    );
    console.log(`Updated ${eventResult.modifiedCount} events to approved`);
    
    // Update sponsor ads with future start dates to start today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const adResult = await SponsorAd.updateMany(
      { startDate: { $gt: today } },
      { $set: { startDate: today } }
    );
    console.log(`Updated ${adResult.modifiedCount} ads to start today`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
