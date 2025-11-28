const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected...');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const checkMitraSlug = async () => {
    try {
        console.log('\n🔍 Mencari mitra dengan slug: pengurus-hmj-teknik-informatika\n');

        const mitra = await User.findOne({ slug: 'pengurus-hmj-teknik-informatika' });

        if (mitra) {
            console.log('✅ Mitra ditemukan!');
            console.log('   ID:', mitra._id);
            console.log('   Nama:', mitra.nama);
            console.log('   Email:', mitra.email);
            console.log('   Slug:', mitra.slug);
            console.log('   Organisasi:', mitra.organisasi);
            console.log('   Role:', mitra.role);
        } else {
            console.log('❌ Mitra tidak ditemukan!');
            console.log('\n🔍 Mencari semua mitra...\n');

            const allMitras = await User.find({ role: 'mitra' });
            console.log(`   Total mitra di database: ${allMitras.length}`);

            if (allMitras.length > 0) {
                console.log('\n   Daftar mitra yang ada:');
                allMitras.forEach((m, i) => {
                    console.log(`   ${i + 1}. ${m.nama} (slug: ${m.slug})`);
                });
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

connectDB().then(() => checkMitraSlug());
