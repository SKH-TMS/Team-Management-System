"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import type { Project, ProjectFilter } from "../types";

export function useProjects() {
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [unassignedProjects, setUnassignedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedAssignedProjectIds, setSelectedAssignedProjectIds] = useState<
    string[]
  >([]);
  const [selectedUnassignedProjectIds, setSelectedUnassignedProjectIds] =
    useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/projectManagerData/projectManagementData/getProjects",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      if (data.success) {
        setAssignedProjects(data.assignedProjects);
        setUnassignedProjects(data.unassignedProjects);
      } else {
        setError(data.message || "Failed to fetch projects.");
        toast.error(data.message || "Failed to fetch projects.");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to fetch projects. Please try again later.");
      toast.error("Failed to fetch projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const toggleSelectMode = useCallback(() => {
    if (isSelectMode) {
      setSelectedUnassignedProjectIds([]);
      setSelectedAssignedProjectIds([]);
    }
    setIsSelectMode((prev) => !prev);
  }, [isSelectMode]);

  const toggleAssignedProjectSelection = useCallback((projectId: string) => {
    setSelectedAssignedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
    setSelectedUnassignedProjectIds([]);
  }, []);

  const toggleUnassignedProjectSelection = useCallback((projectId: string) => {
    setSelectedUnassignedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
    setSelectedAssignedProjectIds([]);
  }, []);

  const deleteSelectedProjects = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/projectManagerData/projectManagementData/deleteSelectedProjects",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectIds: selectedUnassignedProjectIds }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Selected projects deleted successfully!");
        setUnassignedProjects((prev) =>
          prev.filter(
            (proj) => !selectedUnassignedProjectIds.includes(proj.ProjectId)
          )
        );
        setSelectedUnassignedProjectIds([]);
        return true;
      } else {
        toast.error(data.message || "Failed to delete projects.");
        return false;
      }
    } catch (error) {
      console.error("Error deleting projects:", error);
      toast.error("Failed to delete projects. Please try again.");
      return false;
    }
  }, [selectedUnassignedProjectIds]);

  const unassignSelectedProjects = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/projectManagerData/projectManagementData/unassignSelectedProjects",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectIds: selectedAssignedProjectIds }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Selected projects unassigned successfully!");
        // Remove from assigned list and add them to unassigned list
        const projectsToUnassign = assignedProjects.filter((proj) =>
          selectedAssignedProjectIds.includes(proj.ProjectId)
        );
        setAssignedProjects((prev) =>
          prev.filter(
            (proj) => !selectedAssignedProjectIds.includes(proj.ProjectId)
          )
        );
        setUnassignedProjects((prev) => [...prev, ...projectsToUnassign]);
        setSelectedAssignedProjectIds([]);
        return true;
      } else {
        toast.error(data.message || "Failed to unassign projects.");
        return false;
      }
    } catch (error) {
      console.error("Error unassigning projects:", error);
      toast.error("Failed to unassign projects. Please try again.");
      return false;
    }
  }, [assignedProjects, selectedAssignedProjectIds]);

  const filteredAssignedProjects = useMemo(() => {
    return assignedProjects.filter(
      (project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.ProjectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.teamName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assignedProjects, searchQuery]);

  const filteredUnassignedProjects = useMemo(() => {
    return unassignedProjects.filter(
      (project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.ProjectId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unassignedProjects, searchQuery]);

  const sortedAssignedProjects = useMemo(() => {
    return [...filteredAssignedProjects].sort((a, b) => {
      const statusOrder: { [key: string]: number } = {
        Pending: 1,
        "In Progress": 2,
        Completed: 3,
      };
      return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    });
  }, [filteredAssignedProjects]);

  return {
    assignedProjects,
    unassignedProjects,
    loading,
    error,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    isSelectMode,
    selectedAssignedProjectIds,
    selectedUnassignedProjectIds,
    filteredAssignedProjects,
    filteredUnassignedProjects,
    sortedAssignedProjects,
    fetchProjects,
    toggleSelectMode,
    toggleAssignedProjectSelection,
    toggleUnassignedProjectSelection,
    deleteSelectedProjects,
    unassignSelectedProjects,
  };
}
