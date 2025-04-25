// src/app/teamData/teamLeaderData/ProjectTasks/[projectId]/types.ts

// Task interface reflecting the current data model
// (No direct 'assignedTo' at the Task level)
export interface Task {
  TaskId: string;
  title: string;
  description: string;
  // assignedTo: string[]; // REMOVED - Assignment happens via Subtasks
  deadline: string; // Keep as string if API returns string, or change to Date if parsed
  status: string; // Consider using TaskStatus type below for better type safety
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
  gitHubUrl?: string; // URL submitted by Team Lead for the overall task
  context?: string; // Context submitted by Team Lead
  submittedby?: string; // UserID of the submitter (likely Team Lead)
  subTasks?: string[]; // Array of Subtask IDs associated with this Task
}

// Member interface (used for submitters or potentially team members in subtasks)
export interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string; // URL or path to profile picture
  email: string;
}

// TaskStatus type definition for better type checking
export type TaskStatus =
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Re Assigned";
