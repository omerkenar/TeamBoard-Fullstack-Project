import { defineStore } from "pinia";
import { fetchTeams } from "@/services/teams";

import type { Project, Team } from "@/types/api";

export const useTeamStore = defineStore("team", {
  state: () => ({
    loading: false,
    teams: [] as Team[],
  }),
  getters: {
    getProjectOwner: (state) => {
      return (project: Project | undefined): number | undefined => {
        const team = state.teams.find((t) => t.id === project?.team);
        return team?.owner?.id;
      };
    },
  },
  actions: {
    async loadTeams() {
      this.loading = true;
      try {
        this.teams = await fetchTeams();
      } catch (error: any) {
        console.error("Failed to load teams:", error.message);
      } finally {
        this.loading = false;
      }
    },
    checkProjectOwner(
      project: Project | undefined,
      userId: number | null
    ): boolean {
      const ownerId = this.getProjectOwner(project);
      return ownerId === userId;
    },
  },
});
