"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
//TODO:Remove herioicons
import {
  ArrowLeftIcon,
  ClipboardDocumentIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  LinkIcon,
  ChatBubbleBottomCenterTextIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

interface ProjectDetailsData {
  _id: string;
  ProjectId: string;
  title: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AssigneeProfile {
  _id: string;
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
  email: string;
}

interface TaskDetailsData {
  _id: string;
  TaskId: string;
  title: string;
  description: string;
  assignedTo: AssigneeProfile[];
  deadline: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  gitHubUrl?: string;
  context?: string;
  submittedby?: string | AssigneeProfile | null;
}

interface ProjectTasksResponse {
  success: boolean;
  projectDetails?: ProjectDetailsData;
  tasks?: TaskDetailsData[];
  message?: string;
}

const ProjectTasksSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="mb-10 p-6 bg-white rounded-lg shadow border border-gray-200">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-5"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-100">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>

    <div className="h-7 bg-gray-200 rounded w-1/3 mb-5"></div>
    <div className="space-y-5">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-lg shadow border border-gray-200"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProjectDetailsCard: React.FC<{ project: ProjectDetailsData }> = ({
  project,
}) => {
  const getStatusBadge = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          color: "bg-green-100 text-green-800",
          icon: <CheckCircleIcon className="w-4 h-4 mr-1" />,
        };
      case "in progress":
        return {
          color: "bg-blue-100 text-blue-800",
          icon: <ClockIcon className="w-4 h-4 mr-1" />,
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: <ClockIcon className="w-4 h-4 mr-1" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: <PaperClipIcon className="w-4 h-4 mr-1" />,
        };
    }
  };
  const statusBadge = getStatusBadge(project.status);

  return (
    <header className="bg-gradient-to-r from-blue-100 to-white mb-10 p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
            {project.title}
          </h1>
          <p className="text-sm text-gray-500">
            Project ID: {project.ProjectId}
          </p>
        </div>
        <span
          className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full ${statusBadge.color}`}
        >
          {statusBadge.icon}
          {project.status || "N/A"}
        </span>
      </div>
      <p className="text-base text-gray-700 mb-4 leading-relaxed">
        {project.description}
      </p>
      <div className="text-xs text-gray-500 border-t border-gray-100 pt-3 mt-3 flex items-center justify-between flex-wrap gap-2">
        <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>

        <span>
          Last Updated: {new Date(project.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </header>
  );
};

const TaskCard: React.FC<{ task: TaskDetailsData }> = ({ task }) => {
  const deadlineDate = task.deadline
    ? new Date(task.deadline).toLocaleDateString()
    : "N/A";
  const getStatusBadge = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          color: "bg-green-100 text-green-800",
          icon: <CheckCircleIcon className="w-4 h-4 mr-1" />,
        };
      case "in progress":
        return {
          color: "bg-blue-100 text-blue-800",
          icon: <ClockIcon className="w-4 h-4 mr-1" />,
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: <ClockIcon className="w-4 h-4 mr-1" />,
        };
      case "re assigned":
        return {
          color: "bg-purple-100 text-purple-800",
          icon: <ClockIcon className="w-4 h-4 mr-1" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: <PaperClipIcon className="w-4 h-4 mr-1" />,
        };
    }
  };
  const statusBadge = getStatusBadge(task.status);

  return (
    <div className="bg-gradient-to-r from-slate-200 to-white  p-5 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
        <span
          className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${statusBadge.color}`}
        >
          {statusBadge.icon}
          {task.status || "N/A"}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">Task ID: {task.TaskId}</p>
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {task.description}
      </p>

      {(task.context || task.gitHubUrl) && (
        <div className="mb-4 pt-3 border-t border-gray-100 text-sm space-y-2">
          {task.context && (
            <div className="flex items-start">
              <ChatBubbleBottomCenterTextIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
              <p className="text-gray-600">
                <span className="font-medium">Context:</span> {task.context}
              </p>
            </div>
          )}
          {task.gitHubUrl && (
            <div className="flex items-start">
              <LinkIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
              <a
                href={task.gitHubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                GitHub Link
              </a>
            </div>
          )}
        </div>
      )}

      <div className=" flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-500">Assigned:</span>
          <div className="flex -space-x-1 overflow-hidden">
            {task.assignedTo?.map((assignee) => (
              <div>
                <Image
                  key={assignee.UserId}
                  src={assignee.profilepic || "/default-profile.png"}
                  alt={`${assignee.firstname} ${assignee.lastname}`}
                  title={`${assignee.firstname} ${assignee.lastname} --${assignee.email}`}
                  width={28}
                  height={28}
                  className="inline-block h-7 w-7 rounded-full ring-2 ring-gray-200 object-cover cursor-pointer"
                />
              </div>
            ))}
            {(!task.assignedTo || task.assignedTo.length === 0) && (
              <span className="text-xs italic text-gray-400">Unassigned</span>
            )}
          </div>
        </div>
        \
        <div className="flex items-center text-xs text-gray-500">
          <CalendarDaysIcon className="w-4 h-4 mr-1 text-gray-400" />
          <span>Deadline: {deadlineDate}</span>
        </div>
      </div>
    </div>
  );
};

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => <></>;

function ProjectTasksDetailsContent() {
  const [projectDetails, setProjectDetails] =
    useState<ProjectDetailsData | null>(null);
  const [tasks, setTasks] = useState<TaskDetailsData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const projectIdParam = params?.projectId;
  const targetProjectId = Array.isArray(projectIdParam)
    ? projectIdParam[0]
    : projectIdParam;

  useEffect(() => {
    if (!targetProjectId) {
      setError("Project ID not found in URL.");
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedProjectId = encodeURIComponent(targetProjectId);
        const response = await fetch(
          `/api/adminData/ProjectTasksDetails/${encodedProjectId}`
        );
        if (!response.ok) {
          /* ... error handling ... */
          let errorMsg = "Failed to fetch project details.";
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Unauthorized access.";
            router.push("/adminData/LoginAdmin");
          } else if (response.status === 404)
            errorMsg = `Project with ID ${targetProjectId} not found.`;
          else {
            try {
              const d = await response.json();
              errorMsg = d.message || errorMsg;
            } catch (e) {}
          }
          throw new Error(errorMsg);
        }
        const data: ProjectTasksResponse = await response.json();
        if (data.success) {
          setProjectDetails(data.projectDetails || null);
          setTasks(data.tasks || []);
        } else {
          throw new Error(
            data.message || "Could not retrieve project details."
          );
        }
      } catch (err) {
        console.error("Fetch Project Details Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [targetProjectId]);

  if (loading) {
    return (
      <div>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <ProjectTasksSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!projectDetails) {
    return (
      <div>
        <ErrorMessage message="Project data could not be loaded or project not found." />
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <button
          onClick={() => router.back()}
          className="bg-slate-200 mb-6 inline-flex items-center text-lg font-medium text-black hover:bg-slate-300 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back
        </button>

        <ProjectDetailsCard project={projectDetails} />

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center border-b pb-2">
            <ListBulletIcon className="w-6 h-6 mr-2 text-indigo-600 flex-shrink-0" />{" "}
            Associated Tasks
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({tasks?.length ?? 0})
            </span>
          </h2>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-5">
              {tasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-gray-100 rounded-lg border border-dashed border-gray-300">
              <ClipboardDocumentIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 italic">
                No tasks found associated with this project assignment.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ProjectTasksDetailsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="flex justify-center items-center min-h-screen">
            Loading Project Details...
          </div>
        </div>
      }
    >
      <ProjectTasksDetailsContent />
    </Suspense>
  );
}
