const mongoose = require('mongoose');

const AccessibilityFeaturesSchema = new mongoose.Schema({
  hasRamp: { type: Boolean, default: false },
  hasElevator: { type: Boolean, default: false },
  hasAccessibleToilet: { type: Boolean, default: false },
  hasAccessibleParking: { type: Boolean, default: false },
  hasWideDoors: { type: Boolean, default: false },
  hasAudioSignals: { type: Boolean, default: false },
  hasBrailleSignage: { type: Boolean, default: false },
  hasAccessibleTransport: { type: Boolean, default: false },
  hasLowFloorBus: { type: Boolean, default: false },
  hasWheelchairAvailable: { type: Boolean, default: false }
}, { _id: false });

const VoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['upvote', 'downvote', 'confirm'] },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const LocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    default: null
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  accessibilityType: {
    type: String,
    enum: [
      'public_building',
      'hospital',
      'government_office',
      'metro_station',
      'bus_stop',
      'railway_station',
      'airport',
      'shopping_mall',
      'park',
      'educational_institution',
      'religious_place',
      'restaurant',
      'hotel',
      'bank',
      'other'
    ],
    required: true
  },
  accessibilityStatus: {
    type: String,
    enum: ['fully_accessible', 'partially_accessible', 'not_accessible', 'unknown'],
    default: 'unknown'
  },
  accessibilityScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  features: {
    type: AccessibilityFeaturesSchema,
    default: () => ({})
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  photos: [{
    url: String,
    filename: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  votes: [VoteSchema],
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  confirmations: { type: Number, default: 0 },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  isApproved: {
    type: Boolean,
    default: true  // Auto-approve; admin can remove
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-calculate accessibility score
LocationSchema.methods.calculateScore = function() {
  const features = this.features;
  let score = 0;
  const weights = {
    hasRamp: 1.5,
    hasElevator: 1.5,
    hasAccessibleToilet: 1.5,
    hasAccessibleParking: 1.0,
    hasWideDoors: 1.0,
    hasAudioSignals: 0.5,
    hasBrailleSignage: 0.5,
    hasAccessibleTransport: 1.0,
    hasLowFloorBus: 0.5,
    hasWheelchairAvailable: 0.5
  };

  Object.keys(weights).forEach(key => {
    if (features[key]) score += weights[key];
  });

  this.accessibilityScore = Math.min(Math.round(score), 10);

  if (this.accessibilityScore >= 7) this.accessibilityStatus = 'fully_accessible';
  else if (this.accessibilityScore >= 4) this.accessibilityStatus = 'partially_accessible';
  else this.accessibilityStatus = 'not_accessible';

  return this.accessibilityScore;
};

// Auto-verify after 5 confirmations
LocationSchema.methods.checkVerification = function() {
  if (this.confirmations >= 5 && !this.isVerified) {
    this.isVerified = true;
    this.verifiedAt = new Date();
    return true;
  }
  return false;
};

// Index for geo queries
LocationSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
LocationSchema.index({ city: 1 });
LocationSchema.index({ accessibilityStatus: 1 });
LocationSchema.index({ isVerified: 1 });

module.exports = mongoose.model('Location', LocationSchema);
