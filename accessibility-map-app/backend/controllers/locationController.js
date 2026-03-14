const Location = require('../models/Location');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Get all locations (with filters)
// @route   GET /api/locations
// @access  Public
const getLocations = async (req, res) => {
  try {
    const { city, type, status, verified, lat, lng, radius = 10 } = req.query;
    const filter = { isApproved: true };

    if (city) filter.city = { $regex: city, $options: 'i' };
    if (type) filter.accessibilityType = type;
    if (status) filter.accessibilityStatus = status;
    if (verified === 'true') filter.isVerified = true;

    const locations = await Location.find(filter)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(500);

    // If lat/lng provided, filter by radius (km)
    let results = locations;
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      results = locations.filter(loc => {
        const dLat = (loc.coordinates.lat - userLat) * Math.PI / 180;
        const dLng = (loc.coordinates.lng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLat * Math.PI/180) * Math.cos(loc.coordinates.lat * Math.PI/180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = 6371 * c;
        return distance <= radiusKm;
      });
    }

    res.json({ success: true, count: results.length, locations: results });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch locations.' });
  }
};

// @desc    Get single location
// @route   GET /api/locations/:id
// @access  Public
const getLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate('createdBy', 'name role');
    if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });
    res.json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not fetch location.' });
  }
};

// @desc    Add new location
// @route   POST /api/locations
// @access  Private
const addLocation = async (req, res) => {
  try {
    const {
      name, city, state, address, lat, lng,
      accessibilityType, description,
      hasRamp, hasElevator, hasAccessibleToilet, hasAccessibleParking,
      hasWideDoors, hasAudioSignals, hasBrailleSignage,
      hasAccessibleTransport, hasLowFloorBus, hasWheelchairAvailable
    } = req.body;

    if (!name || !city || !address || !lat || !lng || !accessibilityType) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
    }

    const photos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        photos.push({
          url: `/uploads/${file.filename}`,
          filename: file.filename
        });
      });
    }

    const parseBool = (val) => val === 'true' || val === true;

    const location = new Location({
      name, city, state, address,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      accessibilityType,
      description,
      photos,
      features: {
        hasRamp: parseBool(hasRamp),
        hasElevator: parseBool(hasElevator),
        hasAccessibleToilet: parseBool(hasAccessibleToilet),
        hasAccessibleParking: parseBool(hasAccessibleParking),
        hasWideDoors: parseBool(hasWideDoors),
        hasAudioSignals: parseBool(hasAudioSignals),
        hasBrailleSignage: parseBool(hasBrailleSignage),
        hasAccessibleTransport: parseBool(hasAccessibleTransport),
        hasLowFloorBus: parseBool(hasLowFloorBus),
        hasWheelchairAvailable: parseBool(hasWheelchairAvailable)
      },
      createdBy: req.user._id
    });

    location.calculateScore();
    await location.save();

    // Update user's contribution count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { contributionsCount: 1 }
    });

    // Check for promotion
    const user = await User.findById(req.user._id);
    if (user.checkPromotion()) await user.save();

    res.status(201).json({
      success: true,
      message: '📍 Location successfully add ho gayi! SAHAJ ke liye aapka shukriya 🙏',
      location
    });
  } catch (error) {
    console.error('Add location error:', error);
    res.status(500).json({ success: false, message: 'Could not add location.' });
  }
};

// @desc    Vote / Verify location
// @route   POST /api/locations/:id/vote
// @access  Private
const voteLocation = async (req, res) => {
  try {
    const { type } = req.body; // 'upvote', 'downvote', 'confirm'
    const location = await Location.findById(req.params.id);

    if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });

    // Check if user already voted
    const existingVote = location.votes.find(v => v.user?.toString() === req.user._id.toString());

    if (existingVote) {
      // Remove existing vote
      location.votes = location.votes.filter(v => v.user?.toString() !== req.user._id.toString());
      
      if (existingVote.type === 'upvote') location.upvotes = Math.max(0, location.upvotes - 1);
      else if (existingVote.type === 'downvote') location.downvotes = Math.max(0, location.downvotes - 1);
      else if (existingVote.type === 'confirm') location.confirmations = Math.max(0, location.confirmations - 1);

      // If same type, just remove (toggle off)
      if (existingVote.type === type) {
        await location.save();
        return res.json({ success: true, message: 'Vote removed.', location });
      }
    }

    // Add new vote
    location.votes.push({ user: req.user._id, type });

    if (type === 'upvote') location.upvotes += 1;
    else if (type === 'downvote') location.downvotes += 1;
    else if (type === 'confirm') {
      location.confirmations += 1;
      location.checkVerification();

      // Update user verification count
      await User.findByIdAndUpdate(req.user._id, { $inc: { verificationsCount: 1 } });
    }

    await location.save();

    res.json({
      success: true,
      message: type === 'confirm' ? '✅ Verification recorded!' : '👍 Vote recorded!',
      location
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ success: false, message: 'Could not record vote.' });
  }
};

// @desc    Update location (creator or admin)
// @route   PUT /api/locations/:id
// @access  Private
const updateLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });

    const isOwner = location.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    Object.assign(location, req.body);
    if (req.body.features) location.calculateScore();
    location.updatedAt = new Date();

    await location.save();
    res.json({ success: true, message: 'Location updated.', location });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
};

// @desc    Delete location (admin only)
// @route   DELETE /api/locations/:id
// @access  Admin
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });

    // Delete uploaded photos
    location.photos.forEach(photo => {
      const filePath = path.join(__dirname, '../../', photo.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await location.deleteOne();
    res.json({ success: true, message: 'Location removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
};

// @desc    Flag/Unflag location (admin)
// @route   PUT /api/locations/:id/flag
// @access  Admin
const flagLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { isFlagged: req.body.flag, isApproved: !req.body.flag },
      { new: true }
    );
    if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });
    res.json({ success: true, message: req.body.flag ? 'Location flagged.' : 'Location approved.', location });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Action failed.' });
  }
};

// @desc    Dashboard stats
// @route   GET /api/dashboard
// @access  Public
const getDashboard = async (req, res) => {
  try {
    const totalLocations = await Location.countDocuments({ isApproved: true });
    const verifiedLocations = await Location.countDocuments({ isVerified: true, isApproved: true });
    const totalUsers = await User.countDocuments({ isActive: true });

    // City-wise accessibility stats
    const cityStats = await Location.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: '$city',
          total: { $sum: 1 },
          fullyAccessible: {
            $sum: { $cond: [{ $eq: ['$accessibilityStatus', 'fully_accessible'] }, 1, 0] }
          },
          partiallyAccessible: {
            $sum: { $cond: [{ $eq: ['$accessibilityStatus', 'partially_accessible'] }, 1, 0] }
          },
          avgScore: { $avg: '$accessibilityScore' }
        }
      },
      {
        $project: {
          city: '$_id',
          total: 1,
          fullyAccessible: 1,
          partiallyAccessible: 1,
          avgScore: { $round: ['$avgScore', 1] },
          accessibilityPercent: {
            $round: [{
              $multiply: [{ $divide: [{ $add: ['$fullyAccessible', { $multiply: ['$partiallyAccessible', 0.5] }] }, '$total'] }, 100]
            }, 0]
          }
        }
      },
      { $sort: { accessibilityPercent: -1 } },
      { $limit: 15 }
    ]);

    // Type distribution
    const typeStats = await Location.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: '$accessibilityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent additions
    const recentLocations = await Location.find({ isApproved: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name');

    // Top contributors
    const topContributors = await User.find({ contributionsCount: { $gt: 0 } })
      .sort({ contributionsCount: -1 })
      .limit(5)
      .select('name contributionsCount verificationsCount role city');

    res.json({
      success: true,
      stats: {
        totalLocations,
        verifiedLocations,
        totalUsers,
        verificationRate: totalLocations > 0 ? Math.round((verifiedLocations / totalLocations) * 100) : 0
      },
      cityStats,
      typeStats,
      recentLocations,
      topContributors
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Could not load dashboard.' });
  }
};

// @desc    Get flagged locations (admin)
// @route   GET /api/locations/flagged
// @access  Admin
const getFlaggedLocations = async (req, res) => {
  try {
    const locations = await Location.find({ isFlagged: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: locations.length, locations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not fetch flagged locations.' });
  }
};

module.exports = {
  getLocations, getLocation, addLocation, voteLocation,
  updateLocation, deleteLocation, flagLocation,
  getDashboard, getFlaggedLocations
};
