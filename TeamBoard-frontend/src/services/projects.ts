import { apiRequest } from './api-client'
import type { Project, ProjectRequest } from '@/types/api'

export const fetchProjects = async (params?: { search?: string; ordering?: string }) => {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.ordering) query.set('ordering', params.ordering)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiRequest<Project[]>(`/api/projects/${suffix}`)
}

export const fetchProject = async (id: number) => apiRequest<Project>(`/api/projects/${id}/`)

export const createProject = async (payload: ProjectRequest) =>
  apiRequest<Project>('/api/projects/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateProject = async (id: number, payload: Partial<ProjectRequest>) =>
  apiRequest<Project>(`/api/projects/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

export const deleteProject = async (id: number) =>
  apiRequest<void>(`/api/projects/${id}/`, {
    method: 'DELETE',
  })
