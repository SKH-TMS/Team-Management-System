import mongoose, { Schema, model, models, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdmin extends Document {
  AdminId?: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  contact?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  profilepic: string;
  userType: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpires?: Date;
  profilePicFileId?: string;
}

const adminSchema = new Schema<IAdmin>(
  {
    passwordResetToken: {
      type: String,
      select: false,
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
    AdminId: { type: String, unique: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^(?!.*\.\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/,
        "Invalid email format",
      ],
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: [true, "Password is required"] },
    firstname: {
      type: String,
      required: [true, "First name is required"],
      match: [/^[A-Za-z]+([ '-][A-Za-z]+)*$/, "Invalid first name"],
    },
    lastname: {
      type: String,
      required: [true, "Last name is required"],
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
    profilePicFileId: {
      type: String,
      default: null,
    },
    userType: { type: String, required: [true, "User type is required"] },
  },

  {
    timestamps: true,
  }
);
// to save email address to lowercase
adminSchema.pre("save", function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

adminSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const lastAdmin = await mongoose
    .model<IAdmin>("Admin")
    .findOne({}, { AdminId: 1 })
    .sort({ AdminId: -1 });

  let newAdminNumber = 1;

  if (lastAdmin && lastAdmin.AdminId) {
    const match = lastAdmin.AdminId.match(/(\d+)$/);
    const maxNumber = match ? parseInt(match[0], 10) : 0;
    newAdminNumber = maxNumber + 1;
  }
  const paddedAdminNumber = String(newAdminNumber).padStart(5, "0"); // 5 digits padding
  this.AdminId = `Admin-${paddedAdminNumber}`;

  next();
});

// Pre-save hook to hash password before saving
adminSchema.pre("save", async function (next) {
  const admin = this as IAdmin;

  if (admin.isModified("password") && admin.password) {
    admin.password = await bcrypt.hash(admin.password, 10);
  }

  next();
});

// Method to compare passwords (for login)
adminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Export Admin Model
const Admin =
  models?.Admin || model<IAdmin>("Admin", adminSchema, "register_Admin");

export default Admin;
