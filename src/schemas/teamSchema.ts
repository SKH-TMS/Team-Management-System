import { z } from "zod";

// Define the Zod schema for team creation
export const teamSchema = z.object({
  teamName: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must be less than 100 characters"),
  teamLeader: z
    .array(
      z
        .string()
        .regex(
          /^User-(\d+)$/,
          "Team leader ID must be in the format 'User-<number>'."
        )
    )
    .min(1, "At least one team leader is required")
    .max(1, "Only one team leader is allowed"), // Ensure only one team leader

  members: z
    .array(
      z
        .string()
        .regex(
          /^User-(\d+)$/,
          "Member ID must be in the format 'User-<number>'."
        )
    )
    .min(2, "At least two Teammember are required") // Allow multiple members
    .max(5, "Max TeamMember Limit is 5"),
  createdBy: z
    .string()
    .regex(
      /^User-(\d+)$/,
      "createdBy ID must be in the format 'User-<number>'."
    ),
});
export const UpdateTeamSchema = z.object({
  teamName: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must be less than 100 characters"),
  teamLeader: z
    .array(
      z
        .string()
        .regex(
          /^User-(\d+)$/,
          "Team leader ID must be in the format 'User-<number>'."
        )
    )
    .min(1, "At least one team leader is required")
    .max(1, "Only one team leader is allowed"), // Ensure only one team leader

  members: z
    .array(
      z
        .string()
        .regex(
          /^User-(\d+)$/,
          "Member ID must be in the format 'User-<number>'."
        )
    )
    .min(2, "At least two Teammember are required") // Allow multiple members
    .max(5, "Max TeamMember Limit is 5"),
});
