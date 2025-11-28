const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected...');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

const testPublicProfileAPI = async () => {
    try {
        const slug = 'pengurus-hmj-teknik-informatika';
        console.log(`\n🔍 Testing getPublicProfile for slug: ${slug}\n`);

        const user = await User.findOne({ slug }).select('nama organisasi avatar slug');

        if (user) {
            console.log('✅ User found in database!');
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('❌ User NOT found');

            // Check all slugs
            const allUsers = await User.find({}).select('slug nama');
            console.log('\n📋 All users with slugs:');
            allUsers.forEach(u => {
                console.log(`   - "${u.slug}" (${u.nama})`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

connectDB().then(() => testPublicProfileAPI());
