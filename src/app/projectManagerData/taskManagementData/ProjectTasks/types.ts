export interface Task {
  TaskId: string;
  title: string;
  description: string;
  assignedTo: string[];
  deadline: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  gitHubUrl?: string;
  context?: string;
  submittedby?: string;
}

export interface Member {
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

export type TaskStatus =
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Re Assigned";
