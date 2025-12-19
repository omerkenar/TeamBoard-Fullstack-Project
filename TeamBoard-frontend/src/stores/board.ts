import { defineStore } from "pinia";
import { fetchProjects } from "@/services/projects";
import {
  createTask,
  fetchTasks,
  updateTask,
  deleteTask,
} from "@/services/tasks";
import { useAuthStore } from "@/stores/auth";
import type { Project, Status, Task } from "@/types/api";
import TeamsView from "@/views/TeamsView.vue";
import { useTeamStore } from "./team";

export type BoardColumn = {
  id: Status;
  title: string;
  tasks: Task[];
};

type BoardState = {
  loading: boolean;
  projects: Project[];
  selectedProjectId: number | null;
  tasks: Task[];
  error: string | null;
};

export const statusColumns: BoardColumn[] = [
  { id: "todo", title: "To Do", tasks: [] },
  { id: "in_progress", title: "In Progress", tasks: [] },
  { id: "done", title: "Done", tasks: [] },
];

export const useBoardStore = defineStore("board", {
  state: (): BoardState => ({
    loading: false,
    projects: [],
    selectedProjectId: null,
    tasks: [],
    error: null,
  }),
  getters: {
    boardColumns(state): BoardColumn[] {
      return statusColumns.map((col) => ({
        ...col,
        tasks: state.tasks.filter((task) => task.status === col.id),
      }));
    },
    selectedProject(state): Project | undefined {
      return state.projects.find((p) => p.id === state.selectedProjectId);
    },
  },
  actions: {
    async loadProjects() {
      this.loading = true;
      try {
        this.projects = await fetchProjects();
        if (!this.selectedProjectId && this.projects.length > 0) {
          this.selectedProjectId = this.projects[0].id;
        }
      } catch (error: any) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    async loadTasks(projectId?: number) {
      if (!projectId && !this.selectedProjectId) return;
      const targetId = projectId ?? this.selectedProjectId;
      if (!targetId) return;
      this.loading = true;
      try {
        const allTasks = await fetchTasks();
        this.tasks = allTasks.filter((task) => task.project === targetId);
      } catch (error: any) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    async moveTask(
      taskId: number,
      toStatus: Status,
      toIndex: number,
      fromStatus?: Status
    ) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const auth = useAuthStore();
      const myId = auth.user?.id ?? null;
      const isOwner = useTeamStore().checkProjectOwner(
        this.selectedProject,
        useTeamStore().teams.find((t) => t.id === this.selectedProject?.team)
          ?.owner?.id ?? null
      );

      if (myId === null || (task.assignee !== (myId as number) && !isOwner)) {
        this.error = "Sadece size atanmış görevleri güncelleyebilirsiniz.";
        return;
      }

      // update local ordering
      const nextTasks = this.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: toStatus,
            }
          : t
      );

      const targetTasks = nextTasks.filter(
        (t) => t.status === toStatus && t.id !== taskId
      );
      targetTasks.splice(toIndex, 0, { ...task, status: toStatus });
      const merged = nextTasks
        .filter((t) => t.status !== toStatus)
        .concat(targetTasks);
      this.tasks = merged;

      try {
        await updateTask(taskId, { status: toStatus });
      } catch (error: any) {
        this.error = error.message;
        // rollback on failure
        if (fromStatus) {
          this.tasks = this.tasks.map((t) =>
            t.id === taskId ? { ...t, status: fromStatus } : t
          );
        }
      }
    },
    async addTask(payload: {
      title: string;
      description?: string;
      due_date?: string | null;
      assignee?: number | null;
    }) {
      if (!this.selectedProjectId) return false;
      this.loading = true;
      this.error = null;
      try {
        const task = await createTask({
          title: payload.title,
          description: payload.description,
          project: this.selectedProjectId,
          status: "todo",
          due_date: payload.due_date ?? null,
          assignee: payload.assignee ?? null,
        });
        if (task.project === this.selectedProjectId) {
          this.tasks = [task, ...this.tasks];
        }
        return true;
      } catch (error: any) {
        this.error = error.message;
        return false;
      } finally {
        this.loading = false;
      }
    },
    async updateTask(
      taskId: number,
      payload: {
        title?: string;
        description?: string;
        due_date?: string | null;
        assignee?: number | null;
      }
    ) {
      this.loading = true;
      this.error = null;
      try {
        const updatedTask = await updateTask(taskId, payload);
        this.tasks = this.tasks.map((t) => (t.id === taskId ? updatedTask : t));
        return true;
      } catch (error: any) {
        this.error = error.message;
        return false;
      } finally {
        this.loading = false;
      }
    },
    async deleteTask(taskId: number) {
      this.loading = true;
      this.error = null;
      try {
        await deleteTask(taskId);
        this.tasks = this.tasks.filter((t) => t.id !== taskId);
      } catch (error: any) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    selectProject(id: number) {
      this.selectedProjectId = id;
      this.loadTasks(id);
    },
  },
});
