import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Portfolio from '../models/Portfolio.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all portfolio items
router.get('/', async (req, res) => {
  try {
    const portfolioItems = await Portfolio.find().sort({ createdAt: -1 });
    res.json(portfolioItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new portfolio item (protected route)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: 'portfolio',
      resource_type: 'auto'
    });

    // Create portfolio item with Cloudinary URL
    const portfolio = new Portfolio({
      ...req.body,
      imageUrl: uploadResponse.secure_url
    });

    const savedPortfolio = await portfolio.save();
    res.status(201).json(savedPortfolio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update portfolio item (protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedPortfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPortfolio) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    res.json(updatedPortfolio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete portfolio item (protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    // Extract public_id from Cloudinary URL more robustly
    const urlParts = portfolio.imageUrl.split('/');
    const publicId = urlParts.slice(-1)[0].split('.')[0];
    const folder = urlParts[urlParts.length - 2];
    
    // Delete from Cloudinary with proper path
    await cloudinary.uploader.destroy(`${folder}/${publicId}`);

    // Delete from database
    await portfolio.deleteOne();
    res.json({ message: 'Portfolio item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 