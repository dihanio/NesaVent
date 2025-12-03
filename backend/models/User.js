const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Fungsi untuk generate slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

const userSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: [true, 'Nama wajib diisi'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: 6
  },
  nomorTelepon: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'mahasiswa', 'mitra', 'admin'],
    default: 'user'
  },
  organisasi: {
    type: String,
    trim: true
  },
  // Field khusus mahasiswa
  nim: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allow null values to be non-unique
    validate: {
      validator: function (v) {
        // Jika ada NIM, harus 11 digit angka
        if (v && v.length > 0) {
          return /^\d{11}$/.test(v);
        }
        return true; // Allow empty/null
      },
      message: 'NIM harus terdiri dari 11 digit angka'
    }
  },
  programStudi: {
    type: String,
    trim: true
  },
  fakultas: {
    type: String,
    trim: true
  },
  ktm: {
    type: String,
    trim: true
  },
  studentVerificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'approved', 'rejected'],
    default: 'unverified'
  },
  studentVerificationNote: {
    type: String,
    trim: true
  },
  // Backward compatibility - computed field
  isStudentVerified: {
    type: Boolean,
    get: function() {
      return this.studentVerificationStatus === 'approved';
    }
  },
  avatar: {
    type: String,
    default: 'https://www.gravatar.com/avatar/?d=mp'
  },
  coverImage: {
    type: String,
    default: null
  },
  themeColor: {
    type: String,
    default: 'blue', // blue, indigo, purple, pink, red, orange, yellow, green, teal, cyan
    enum: ['blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'teal', 'cyan']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  resetPasswordCode: {
    type: String,
    default: null
  },
  resetPasswordCodeExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook untuk generate slug
userSchema.pre('save', async function () {
  if (this.isModified('nama') || this.isNew) {
    let baseSlug = slugify(this.nama);
    let slug = baseSlug;
    let counter = 1;

    // Check if slug already exists
    while (true) {
      const existingUser = await mongoose.models.User.findOne({ slug });
      if (!existingUser || existingUser._id.toString() === this._id.toString()) {
        this.slug = slug;
        break;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }
  }
});

// Pre-save hook untuk hash password
userSchema.pre('save', async function () {
  console.log(`[USER MODEL] Pre-save hook triggered for user: ${this.email}`);
  console.log(`[USER MODEL] Password modified: ${this.isModified('password')}`);

  if (this.isModified('password')) {
    console.log(`[USER MODEL] Hashing password for: ${this.email}`);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    console.log(`[USER MODEL] Password hashed successfully for: ${this.email}`);
  } else {
    console.log(`[USER MODEL] Password not modified, skipping hash for: ${this.email}`);
  }
});

// Virtual field untuk angkatan (dari 2 digit pertama NIM)
userSchema.virtual('angkatan').get(function () {
  if (this.nim && this.nim.length >= 2) {
    const tahunAngka = parseInt(this.nim.substring(0, 2));
    return 2000 + tahunAngka; // 23 -> 2023
  }
  return null;
});

// Indexes for query optimization
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ slug: 1 }, { unique: true });
userSchema.index({ nim: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ studentVerificationStatus: 1 });

// Set toJSON dan toObject untuk include virtuals
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Method untuk cek password
userSchema.methods.matchPassword = async function (enteredPassword) {
  console.log(`[USER MODEL] Checking password for user: ${this.email}`);
  console.log(`[USER MODEL] Stored hash starts with: ${this.password.substring(0, 10)}...`);
  console.log(`[USER MODEL] Entered password starts with: ${enteredPassword.substring(0, 3)}...`);

  const result = await bcrypt.compare(enteredPassword, this.password);

  console.log(`[USER MODEL] Password match result: ${result}`);

  return result;
};

module.exports = mongoose.model('User', userSchema);
