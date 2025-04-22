import mongoose, { Schema, model, models, Document } from "mongoose";
import bcrypt from "bcryptjs";

// Define IUser interface
export interface IUser extends Document {
  UserId: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  contact?: string;
  createdAt: Date;
  updatedAt: Date;
  profilepic: String;
  userType: String;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpires?: Date;
  profilePicFileId?: string;
}

// Define User Schema
const userSchema = new Schema<IUser>(
  {
    passwordResetToken: {
      type: String,
      select: false,
    },
    profilePicFileId: {
      type: String,
      default: null,
    },
    passwordResetTokenExpires: {
      type: Date,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpires: {
      type: Date,
      select: false,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      match: [
        /^(?!.*\.\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/,
        "Invalid email format",
      ],
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: [true, "password is required"] },
    firstname: {
      type: String,
      required: [true, "firstname is required"],
      match: [/^[A-Za-z]+([ '-][A-Za-z]+)*$/, "Invalid first name"],
    },
    lastname: {
      type: String,
      required: [true, "lastname is required"],
      match: [/^[A-Za-z]+([ '-][A-Za-z]+)*$/, "Invalid last name"],
    },
    contact: {
      type: String,
      match: [
        /^(?:\+?(\d{1,4})[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}$/,
        "Invalid contact number",
      ],
    },
    profilepic: {
      type: String,
      required: [true, "Profile picture is required"],
    },
    userType: { type: String, required: [true, "User type is required"] },
    UserId: { type: String, unique: true },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Pre-save hook to assign auto-incremented `UserId`
userSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  // Find the last task document and extract its teamId number
  const lastUser = await mongoose
    .model<IUser>("User")
    .findOne({}, { UserId: 1 })
    .sort({ UserId: -1 });

  let newUserNumber = 1; // Default for the first User

  if (lastUser && lastUser.UserId) {
    const match = lastUser.UserId.match(/(\d+)$/); // Extract numeric part from UserId
    const maxNumber = match ? parseInt(match[0], 10) : 0;
    newUserNumber = maxNumber + 1;
  }
  const paddedUserNumber = String(newUserNumber).padStart(5, "0"); // 5 digits padding
  this.UserId = `User-${paddedUserNumber}`;

  next();
});

// Pre-save hook to hash password before saving
userSchema.pre("save", async function (next) {
  const user = this as IUser;

  if (user.isModified("password") && user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }

  next();
});

// Method to compare passwords (for login)
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Export User Model
const User = models?.User || model<IUser>("User", userSchema, "register_user");

export default User;
