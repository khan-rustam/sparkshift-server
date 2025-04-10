import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxLength: [1000, 'Description cannot be more than 1000 characters']
  },
  projectLink: {
    type: String,
    required: [true, 'Project link is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Portfolio', portfolioSchema); 