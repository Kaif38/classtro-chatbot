import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/classtro');
    console.log('✅ MongoDB connected successfully');
    
    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      email: String,
      password: String
    }));
    
    console.log('✅ User model works');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();