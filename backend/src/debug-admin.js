import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

const runDebug = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Testing User.find query for pending users...');
        const filter = { role: 'organizer', verified: false };
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

        console.log('Query successful.');
        console.log(`Found ${users.length} pending users.`);
        console.log('Sample user:', users[0]);

        process.exit(0);
    } catch (error) {
        console.error('Debug script failed:', error);
        process.exit(1);
    }
};

runDebug();
