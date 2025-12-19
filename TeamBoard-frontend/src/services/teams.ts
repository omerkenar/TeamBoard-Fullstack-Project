import { apiRequest } from './api-client'
import type { Team, TeamRequest } from '@/types/api'

export const fetchTeams = async (params?: { search?: string; ordering?: string }) => {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.ordering) query.set('ordering', params.ordering)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiRequest<Team[]>(`/api/teams/${suffix}`)
}

export const fetchTeam = async (id: number) => apiRequest<Team>(`/api/teams/${id}/`)

export const createTeam = async (payload: TeamRequest) =>
  apiRequest<Team>('/api/teams/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateTeam = async (id: number, payload: Partial<TeamRequest>) =>
  apiRequest<Team>(`/api/teams/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

export const deleteTeam = async (id: number) =>
  apiRequest<void>(`/api/teams/${id}/`, {
    method: 'DELETE',
  })
