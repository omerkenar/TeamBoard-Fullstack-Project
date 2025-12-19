<script setup lang="ts">
import { computed, onMounted } from "vue";
import KanbanBoard from "@/components/KanbanBoard.vue";
import { useBoardStore } from "@/stores/board";
import { useTeamStore } from "@/stores/team";

const boardStore = useBoardStore();
const teamStore = useTeamStore();

const onMove = (payload: {
  taskId: number;
  toStatus: string;
  toIndex: number;
  fromStatus?: string;
}) => {
  boardStore.moveTask(
    payload.taskId,
    payload.toStatus as any,
    payload.toIndex,
    payload.fromStatus as any
  );
};

onMounted(async () => {
  await boardStore.loadProjects();
  await teamStore.loadTeams();
  await boardStore.loadTasks();
});

const activeProjects = computed(() =>
  boardStore.projects.filter((project) => project.is_active)
);
</script>

<template>
  <section class="hero">
    <div>
      <p class="eyebrow">BİLGİLENDİRME ALANI</p>
      <h1>TeamBord Proje Yönetimi</h1>
      <p class="lede">
        Takım ve projelerini yönet, görevlerini sürükle-bırak ile güncelle.
      </p>
      <div class="selectors">
        <label class="select">
          <span class="spn-task">Task Eklemek İstediğiniz Projeyi Seçin</span>
          <select
            v-model.number="boardStore.selectedProjectId"
            @change="
              boardStore.selectedProjectId &&
                boardStore.selectProject(boardStore.selectedProjectId)
            "
          >
            <option
              v-for="project in activeProjects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.title }}
            </option>
          </select>
        </label>
      </div>
    </div>
    <div class="metrics">
      <div class="metric">
        <span class="label">Projeler</span>
        <span class="value">{{ boardStore.projects.length }}</span>
      </div>
      <div class="metric">
        <span class="label">Tasks</span>
        <span class="value">{{ boardStore.tasks.length }}</span>
      </div>
      <div class="metric">
        <span class="label">Aktif</span>
        <span class="value">{{
          boardStore.boardColumns.find((c) => c.id === "in_progress")?.tasks
            .length ?? 0
        }}</span>
      </div>
    </div>
  </section>

  <KanbanBoard
    :columns="boardStore.boardColumns"
    :loading="boardStore.loading"
    @move="onMove"
  />
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.hero h1 {
  margin: 6px 0 8px;
  font-size: 30px;
  color: #0f172a;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-size: 12px;
  color: #475569;
  margin: 0;
}

.lede {
  margin: 0 0 16px;
  color: #475569;
  line-height: 1.5;
}

.spn-task {
  font-weight: 600;
  font-size: 16px;
}
.selectors {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #0f172a;
  border-radius: 8px;
  border: 0.5px solid rgb(179, 179, 221);
  padding: 2%;
  box-shadow: 2px 4px 2px rgba(15, 23, 42, 0.06);
}

.select select {
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  min-width: 220px;
  background: #f8fafc;
  font: inherit;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.metric {
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.label {
  display: block;
  font-size: 12px;
  color: #475569;
}

.value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
}
</style>
