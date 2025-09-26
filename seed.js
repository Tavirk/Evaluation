const mongoose = require('mongoose');
const Category = require('./models/Category');
const News = require('./models/News');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/backend_project_db';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear old data
    await Category.deleteMany({});
    await News.deleteMany({});

    // Insert categories
    const categories = await Category.insertMany([
      { name: 'Political' },
      { name: 'Entertainment' },
      { name: 'Geographical' },
      { name: 'Sports' },
    ]);

    console.log('Categories seeded');

    // Insert news
    const newsData = [
      {
        title: 'Elections Coming Soon',
        content: 'The national elections are scheduled for next month.',
        category: 'Political',
      },
      {
        title: 'Movie Release',
        content: 'A new blockbuster movie is releasing this weekend.',
        category: 'Entertainment',
      },
      {
        title: 'Floods in Punjab',
        content: 'Heavy rainfall has caused floods in several areas.',
        category: 'Geographical',
      },
      {
        title: 'Cricket Tournament',
        content: 'The championship final will be played tomorrow.',
        category: 'Sports',
      },
    ];

    await News.insertMany(newsData);

    console.log('News seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
