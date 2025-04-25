import mongoose, { Schema, model, models, Document } from "mongoose";

export interface ITask extends Document {
  TaskId: string;
  title: string;
  description: string;
  // assignedTo: string[];
  deadline: Date;
  status: string; // E.g., "Pending", "In Progress", "Completed"
  createdAt: Date;
  updatedAt: Date;
  subTasks?: string[];
  gitHubUrl?: string;
  context?: string;
  submittedby?: string;
}

const taskSchema = new Schema<ITask>(
  {
    gitHubUrl: {
      type: String,
      match: [
        /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_.-]+)?\/?$/,
        "Please enter a valid GitHub repository URL",
      ],
    },
    context: { type: String },
    submittedby: { type: String, default: "Not-submitted" },
    TaskId: { type: String, unique: true },
    title: {
      type: String,
      required: [true, "Task title is required"],
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
    },
    // assignedTo: {
    //   type: [String],
    //   required: [true, "Assigned user ID is required"],
    // },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Re Assigned"],
      default: "Pending",
    },
    deadline: { type: Date, required: [true, "Due date is required"] },
    subTasks: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate TaskId
taskSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  // Find the last task document and extract its TaskId number
  const lastTask = await mongoose
    .model<ITask>("Task")
    .findOne({}, { TaskId: 1 })
    .sort({ TaskId: -1 });

  let newTaskNumber = 1; // Default for the first task

  if (lastTask && lastTask.TaskId) {
    const match = lastTask.TaskId.match(/(\d+)$/); // Extract numeric part from TaskId
    const maxNumber = match ? parseInt(match[0], 10) : 0;
    newTaskNumber = maxNumber + 1;
  }

  const paddedTaskNumber = String(newTaskNumber).padStart(5, "0"); // 4 digits padding
  this.TaskId = `Task-${paddedTaskNumber}`;

  next();
});

const Task = models?.Task || model<ITask>("Task", taskSchema, "tasks");

export default Task;
