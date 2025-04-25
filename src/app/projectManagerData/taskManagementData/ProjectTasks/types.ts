// src/app/projectManagerData/taskManagementData/ProjectTasks/types.ts

export interface Task {
  TaskId: string;
  title: string;
  description: string;
  // assignedTo: string[]; // --- CHANGE 4: Remove this line ---
  deadline: string; // Keep as string if that's what API returns, or change to Date if parsed
  status: string; // Consider using TaskStatus type below
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
  gitHubUrl?: string;
  context?: string;
  submittedby?: string;
  subTasks?: string[]; // Add subTasks array if it's part of the Task model now
}

export interface Member {
  // Keep Member type for submitters
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

// Keep TaskStatus type
export type TaskStatus =
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Re Assigned";
