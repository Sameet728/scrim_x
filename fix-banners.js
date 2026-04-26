const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './backend/.env'});

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Tournament = require('./backend/src/models/Tournament');
  const result = await Tournament.updateMany(
    { $or: [{ banner: { $exists: false } }, { banner: '' }] },
    { $set: { banner: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' } }
  );
  console.log('Fixed', result.modifiedCount, 'tournaments');
  
  // also clear cache
  // we don't have direct access to cache, but if we restart the backend it clears.
  process.exit(0);
});
