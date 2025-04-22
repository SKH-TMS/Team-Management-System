import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IAssignedProjectLog extends Document {
  AssignProjectId: string; // Unique Assignment ID
  projectId: string; // The project being assigned
  teamId: string; // The team assigned to the project
  assignedBy: string; // Project Manager who assigned the project
  tasksIds: string[];
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the AssignedProjectLogs Schema
const assignedProjectLogSchema = new Schema<IAssignedProjectLog>(
  {
    AssignProjectId: { type: String, unique: true },
    projectId: { type: String, required: [true, "Project Id is required"] },
    teamId: { type: String, required: [true, "team Id is required"] },
    assignedBy: { type: String, required: [true, "Assigner Id is required"] },
    deadline: { type: Date, required: [true, "deadline is required"] },
    tasksIds: {
      type: [String],
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate AssignProjectId like ProjectId

assignedProjectLogSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  // Find the last task document and extract its teamId number
  const lastAssignment = await mongoose
    .model<IAssignedProjectLog>("AssignedProjectLogs")
    .findOne({}, { AssignProjectId: 1 })
    .sort({ AssignProjectId: -1 });

  let newProjectNumber = 1; // Default for the first Project

  if (lastAssignment && lastAssignment.AssignProjectId) {
    const match = lastAssignment.AssignProjectId.match(/(\d+)$/); // Extract numeric part from ProjectId
    const maxNumber = match ? parseInt(match[0], 10) : 0;
    newProjectNumber = maxNumber + 1;
  }
  const paddedProjectNumber = String(newProjectNumber).padStart(5, "0"); // 5 digits padding
  this.AssignProjectId = `AssignProject-${paddedProjectNumber}`;

  next();
});

// Export the model
const AssignedProjectLog =
  models?.AssignedProjectLogs ||
  model<IAssignedProjectLog>(
    "AssignedProjectLogs",
    assignedProjectLogSchema,
    "assigned_project_2_team"
  );

export default AssignedProjectLog;
