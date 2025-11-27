const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');
require('dotenv').config();

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

const updateSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Update Events
    const events = await Event.find({});
    for (const event of events) {
      if (!event.slug) {
        let baseSlug = generateSlug(event.nama);
        let slug = baseSlug;
        let counter = 1;

        while (await Event.findOne({ slug })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        await Event.updateOne({ _id: event._id }, { slug });
        console.log(`Updated event: ${event.nama} -> ${slug}`);
      }
    }

    // Update Users
    const users = await User.find({});
    for (const user of users) {
      if (!user.slug) {
        let baseSlug = generateSlug(user.nama);
        let slug = baseSlug;
        let counter = 1;

        while (await User.findOne({ slug })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        await User.updateOne({ _id: user._id }, { slug });
        console.log(`Updated user: ${user.nama} -> ${slug}`);
      }
    }

    console.log('Slug update completed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating slugs:', error);
    process.exit(1);
  }
};

updateSlugs();