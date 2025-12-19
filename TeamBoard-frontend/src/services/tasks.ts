import { apiRequest } from './api-client'
import type { Task, TaskRequest } from '@/types/api'

export const fetchTasks = async (params?: { search?: string; ordering?: string }) => {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.ordering) query.set('ordering', params.ordering)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiRequest<Task[]>(`/api/tasks/${suffix}`)
}

export const fetchTask = async (id: number) => apiRequest<Task>(`/api/tasks/${id}/`)

export const createTask = async (payload: TaskRequest) =>
  apiRequest<Task>('/api/tasks/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateTask = async (id: number, payload: Partial<TaskRequest>) =>
  apiRequest<Task>(`/api/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

export const deleteTask = async (id: number) =>
  apiRequest<void>(`/api/tasks/${id}/`, {
    method: 'DELETE',
  })
