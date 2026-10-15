import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useOrganization } from './OrganizationContext';
import { useAuth } from './AuthContext';
import * as projectService from '../services/projectService';

const ProjectContext = createContext(null);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export function ProjectProvider({ children }) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    if (!currentOrganization?.id) {
      setProjects([]);
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const data = await projectService.getProjects(currentOrganization.id);
      setProjects(data);
      setLoading(false);
      return data;
    } catch (err) {
      console.error('Error in fetchProjects:', err);
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (projectData) => {
    if (!currentOrganization?.id || !user?.id) {
      return { success: false, error: 'Organization or user context missing' };
    }

    const res = await projectService.createProject({
      ...projectData,
      organizationId: currentOrganization.id,
      userId: user.id,
    });

    if (res.success) {
      await fetchProjects();
    }
    return res;
  };

  const handleUpdateProject = async (projectId, updates) => {
    const res = await projectService.updateProject(projectId, updates);
    if (res.success) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, ...res.project } : p))
      );
    }
    return res;
  };

  const handleDeleteProject = async (projectId) => {
    const res = await projectService.deleteProject(projectId);
    if (res.success) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
    return res;
  };

  const value = useMemo(
    () => ({
      projects,
      loading,
      error,
      refreshProjects: fetchProjects,
      createProject: handleCreateProject,
      updateProject: handleUpdateProject,
      deleteProject: handleDeleteProject,
    }),
    [projects, loading, error, fetchProjects]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}
