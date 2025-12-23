import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'organizer', 'admin'],
    default: 'user'
  },
  verified: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['school', 'ngo', 'community'],
    default: null
  },
  userSubtype: {
    type: String,
    enum: ['student', 'parent'],
    default: null
  },
  grade: {
    type: String,
    enum: ['9', '10', '11', '12'],
    default: null
  },
  interests: [{
    type: String,
    enum: ['academic_tech', 'leadership_literary', 'sports_fitness', 'creative_arts']
  }],
  parentalConsent: {
    type: Boolean,
    default: false
  },
  childPhone: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  designation: {
    type: String,
    default: ''
  },
  schoolName: {
    type: String,
    default: ''
  },
  schoolAddress: {
    type: String,
    default: ''
  },
  verificationFile: {
    type: String,
    default: ''
  },
  principalName: {
    type: String,
    default: ''
  },
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' }
  },
  preferredCommunication: {
    type: String,
    enum: ['whatsapp', 'email'],
    default: 'email'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);
