import mongoose, { Schema, model, models, Document } from "mongoose";

export interface ITeam extends Document {
  teamId: string;
  teamName: string;
  teamLeader: string[]; // Change to store only the userId of the team leader as array
  members: string[]; // Store only userId in members array
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Define Schema
const teamSchema = new Schema<ITeam>(
  {
    teamId: { type: String, unique: true },
    teamName: { type: String, required: true },
    teamLeader: { type: [String], required: true },
    members: {
      type: [String], // Members will now only contain an array of userIds
      required: true,
    },
    createdBy: { type: String, required: true },
  },

  { timestamps: true }
);

teamSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  // Find the last task document and extract its teamId number
  const lastTeam = await mongoose
    .model<ITeam>("Team")
    .findOne({}, { teamId: 1 })
    .sort({ teamId: -1 });

  let newTeamNumber = 1; // Default for the first Team

  if (lastTeam && lastTeam.teamId) {
    const match = lastTeam.teamId.match(/(\d+)$/); // Extract numeric part from teamId
    const maxNumber = match ? parseInt(match[0], 10) : 0;
    newTeamNumber = maxNumber + 1;
  }
  const paddedTeamNumber = String(newTeamNumber).padStart(5, "0"); // 4 digits padding
  this.teamId = `Team-${paddedTeamNumber}`;

  next();
});
const Team = models?.Team || model<ITeam>("Team", teamSchema, "teams");

export default Team;
