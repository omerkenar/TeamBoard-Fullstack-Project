export type TokenPair = {
  access: string;
  refresh: string;
};

export type User = {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

export type UserList = {
  id: number;
  username: string;
  display_name: string;
};

export type Team = {
  id: number;
  name: string;
  owner?: User;
  members?: User[];
  created_at?: string;
};

export type TeamRequest = {
  name: string;
  member_ids?: number[];
};

export type Project = {
  id: number;
  title: string;
  description?: string;
  team: number;
  is_active?: boolean;
  created_at?: string;
};

export type ProjectRequest = {
  title: string;
  description?: string;
  team: number;
  is_active?: boolean;
};

export type Status = "todo" | "in_progress" | "done";

export type Task = {
  id: number;
  title: string;
  description?: string;
  project: number;
  assignee?: number | null;
  assignee_detail?: User;
  status: Status;
  due_date?: string | null;
  created_at?: string;
};

export type TaskRequest = {
  title: string;
  description?: string;
  project: number;
  assignee?: number | null;
  status?: Status;
  due_date?: string | null;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};
