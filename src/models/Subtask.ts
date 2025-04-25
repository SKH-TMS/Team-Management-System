import mongoose, { Schema, model, models, Document } from "mongoose";

export interface ISubtask extends Document {
  SubtaskId: string;
  parentTaskId: string; // Task.TaskId of the parent task
  title: string;
  description: string;
  assignedTo: string; // userId of the assignee
  deadline: Date;
  status: string; // e.g. "Pending"|"In Progress"|"Completed"
  gitHubUrl?: string;
  context?: string;
  submittedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema<ISubtask>(
  {
    SubtaskId: { type: String, unique: true },
    parentTaskId: {
      type: String,
      required: [true, "Parent TaskId is required"],
    },
    title: { type: String, required: [true, "Title is required"] },
    description: { type: String, required: [true, "Description is required"] },
    assignedTo: {
      type: String,
      required: [true, "Assigned userId is required"],
    },
    deadline: { type: Date, required: [true, "Deadline is required"] },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
    gitHubUrl: {
      type: String,
      match: [
        /^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_-]+(\/[A-Za-z0-9_.-]+)?\/?$/,
        "Invalid GitHub URL",
      ],
    },
    context: String,
    submittedBy: { type: String, default: "Not-submitted" },
  },
  { timestamps: true }
);

// Auto-increment SubtaskId
subtaskSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const last = await mongoose
    .model<ISubtask>("Subtask")
    .findOne({}, { SubtaskId: 1 })
    .sort({ SubtaskId: -1 });

  let num = 1;
  if (last?.SubtaskId) {
    const m = last.SubtaskId.match(/(\d+)$/);
    num = (m ? parseInt(m[0], 10) : 0) + 1;
  }
  this.SubtaskId = `Subtask-${String(num).padStart(5, "0")}`;
  next();
});

const Subtask =
  models?.Subtask || model<ISubtask>("Subtask", subtaskSchema, "subtasks");

export default Subtask;
