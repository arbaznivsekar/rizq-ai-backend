import { Schema, model, Document } from "mongoose";
import bcrypt from "bcrypt";

// Interface for User document
interface IUser extends Document {
  _id: any;
  email: string;
  password?: string;
  name?: string;
  image?: string;
  phone?: string;
  roles: string[];
  location?: string;
  bio?: string;
  headline?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    current?: boolean;
    /**
     * Markdown-formatted description authored by the user.
     * This text is passed through to resume generation without stripping bullets.
     */
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    field?: string;
    startDate?: Date;
    endDate?: Date;
    current?: boolean;
  }>;
  projects?: Array<{
    name: string;
    associatedWith?: string;
    startDate?: Date;
    endDate?: Date;
    current?: boolean;
    description?: string;
    url?: string;
    technologies?: string[];
    media?: string[];
    collaborators?: string;
  }>;
  preferences?: {
    jobTypes?: string[];
    locations?: string[];
    remotePreference?: 'remote' | 'hybrid' | 'onsite' | 'any';
    salaryExpectation?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    availability?: string;
  };
  social?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
  };
  resumeUrl?: string;
  resumeText?: string;
  resumeUpdatedAt?: Date;
  gmailRefreshToken?: string;
  gmailAccessToken?: string;
  gmailTokenExpiry?: Date;
  gmailConnectedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema(
{
email: { type: String, index: true, unique: true, required: true },
password: { type: String, required: false, select: false }, // Optional for Gmail-only auth
name: String,
image: String,
phone: String,
roles: { type: [String], default: ["user"] },

// Profile Information
location: String,
bio: String,
headline: String, // Professional headline (e.g., "Senior Software Engineer")
skills: [String],
experience: [{
  title: String,
  company: String,
  location: String,
  startDate: Date,
  endDate: Date,
  current: Boolean,
  description: String,
}],
education: [{
  degree: String,
  institution: String,
  field: String,
  startDate: Date,
  endDate: Date,
  current: Boolean,
}],
projects: [{
  name: String,
  associatedWith: String, // Personal Project, Company/Organization name
  startDate: Date,
  endDate: Date,
  current: Boolean, // Currently working on this
  description: String,
  url: String, // Project URL/link
  technologies: [String], // Technologies/skills used
  media: [String], // Image URLs
  collaborators: String, // Collaborators names/info
}],

// Job Preferences
preferences: {
  jobTypes: [String], // ['Full-time', 'Contract', etc.]
  locations: [String],
  remotePreference: { type: String, enum: ['remote', 'hybrid', 'onsite', 'any'] },
  salaryExpectation: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' },
  },
  availability: String, // 'Immediate', '2 weeks notice', etc.
},

// Social Links
social: {
  linkedin: String,
  github: String,
  portfolio: String,
  twitter: String,
},

// Resume
resumeUrl: String,
resumeText: String,
resumeUpdatedAt: Date,

// Gmail OAuth tokens
gmailRefreshToken: { type: String },
gmailAccessToken: { type: String },
gmailTokenExpiry: { type: Date },
gmailConnectedAt: { type: Date },
},
{ timestamps: true }
);

// Hash password before saving (only if password exists)
userSchema.pre("save", async function(next) {
  if (!this.isModified("password") || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

export default model<IUser>("User", userSchema);

