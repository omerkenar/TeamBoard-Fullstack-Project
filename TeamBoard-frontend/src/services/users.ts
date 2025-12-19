import { apiRequest } from "./api-client";
import type { UserList } from "@/types/api";

export const fetchUsers = async (params?: { search?: string; ordering?: string }) => {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.ordering) query.set("ordering", params.ordering);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<UserList[]>(`/api/users/${suffix}`);
};

export const fetchUser = async (id: number) =>
  apiRequest<UserList>(`/api/users/${id}/`);
