import { z } from "zod";

// Basic password validation (at least 6 chars)
const passwordValidation = z
  .string()
  .min(6, { message: "Password must be at least 6 characters long." })
  .max(50, { message: "Password too long (max 50)." });

// Name validation (letters, space, hyphen, apostrophe)
const nameValidation = z
  .string()
  .min(1, { message: "Name cannot be empty." })
  .max(30, { message: "Name too long (max 30)." })
  .regex(/^[a-zA-Z][a-zA-Z-' ]*[a-zA-Z]$|^[a-zA-Z]$/, {
    message: "Invalid characters (only letters, space, ', -)",
  });

export const adminRegisterSchema = z
  .object({
    firstname: nameValidation,
    lastname: nameValidation,
    email: z
      .string()
      .min(1, { message: "Email is required." })
      .max(50, { message: "Email too long (max 50)." })
      .email({ message: "Invalid email address." }),
    password: passwordValidation,
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password." }),
    contact: z
      .string()
      .max(20, { message: "Contact number too long (max 20)." })
      .regex(/^[0-9\s+()-]*$/, {
        message: "Invalid characters in contact number.",
      })
      .optional()
      .or(z.literal("")), // Allow empty string
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Point error to confirmPassword field
  });

// Type inferred from schema
export type AdminRegisterFormData = z.infer<typeof adminRegisterSchema>;

export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});
export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
// Schema for Reset Password Form
export const adminResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long." })
      .max(50, { message: "Password too long (max 50)." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Point error to confirmPassword field
  });

export type AdminResetPasswordFormData = z.infer<
  typeof adminResetPasswordSchema
>;

// Schema for updating profile info
export const adminProfileUpdateSchema = z.object({
  firstname: z
    .string()
    .min(1, "First name is required.")
    .max(30, "First name too long."),
  lastname: z
    .string()
    .min(1, "Last name is required.")
    .max(30, "Last name too long."),
  contact: z
    .string()
    .max(20, "Contact number too long.")
    .regex(/^[0-9\s+()-]*$/, "Invalid characters in contact number.")
    .optional()
    .or(z.literal("")),
});
export type AdminProfileUpdateFormData = z.infer<
  typeof adminProfileUpdateSchema
>;

// Schema for changing password
export const adminPasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters.")
      .max(50, "Password too long."),
    confirmPassword: z.string().min(1, "Please confirm new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password cannot be the same as the current one.",
    path: ["newPassword"],
  });
export type AdminPasswordChangeFormData = z.infer<
  typeof adminPasswordChangeSchema
>;
