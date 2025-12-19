<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  createProject,
  deleteProject,
  fetchProjects,
  updateProject,
} from "@/services/projects";
import { fetchTeams } from "@/services/teams";
import { useBoardStore } from "@/stores/board";
import type { Project, Team } from "@/types/api";

const router = useRouter();
const boardStore = useBoardStore();

const loading = ref(false);
const error = ref<string | null>(null);
const errorSnack = ref(false);
const teams = ref<Team[]>([]);

const form = reactive({
  title: "",
  description: "",
  team: 0,
  is_active: true,
});

const selectedTeam = computed(() =>
  teams.value.find((t) => t.id === form.team)
);

const load = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [teamList, projectList] = await Promise.all([
      fetchTeams(),
      fetchProjects(),
    ]);
    teams.value = teamList;
    boardStore.projects = projectList;
    if (!boardStore.selectedProjectId && boardStore.projects.length > 0) {
      boardStore.selectedProjectId = boardStore.projects[0].id;
    }
    if (!form.team && teams.value.length > 0) {
      form.team = teams.value[0].id;
    }
  } catch (e: any) {
    errorSnack.value = true;
    error.value = e.message ?? "Projeler yüklenemedi";
  } finally {
    loading.value = false;
  }
};

const submit = async () => {
  if (!form.team) return;
  loading.value = true;
  error.value = null;
  try {
    const project = await createProject({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      team: form.team,
      is_active: form.is_active,
    });
    boardStore.projects = [project, ...boardStore.projects];
    if (!boardStore.selectedProjectId)
      boardStore.selectedProjectId = project.id;
    form.title = "";
    form.description = "";
  } catch (e: any) {
    errorSnack.value = true;
    error.value = e.message ?? "Proje oluşturulamadı";
  } finally {
    loading.value = false;
  }
};

const openOnBoard = async (project: Project) => {
  try {
    if (!project.is_active) {
      throw new Error("Pasif projeler board'da açılamaz.");
    }

    boardStore.selectProject(project.id);
    await router.push({ name: "dashboard" });
  } catch (e) {
    errorSnack.value = true;
    error.value =
      e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.";
  }
};

const remove = async (project: Project) => {
  const confirmed = window.confirm(`"${project.title}" projesi silinsin mi?`);
  if (!confirmed) return;
  loading.value = true;
  error.value = null;
  try {
    await deleteProject(project.id);
    boardStore.projects = boardStore.projects.filter(
      (p) => p.id !== project.id
    );
    if (boardStore.selectedProjectId === project.id) {
      boardStore.selectedProjectId = boardStore.projects[0]?.id ?? null;
      await boardStore.loadTasks();
    }
  } catch (e: any) {
    errorSnack.value = true;
    error.value = e.message ?? "Proje silinemedi";
  } finally {
    loading.value = false;
  }
};

const toggleActive = async (project: Project, next: boolean) => {
  loading.value = true;
  error.value = null;
  try {
    await updateProject(project.id, { is_active: next });
    await boardStore.loadProjects();
  } catch (e: any) {
    errorSnack.value = true;
    error.value = e.message ?? "Güncellenemedi";
  } finally {
    loading.value = false;
  }
};

const formatDate = (value: string) => {
  const date = new Date(value.replace(" ", "T"));
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

onMounted(load);
</script>

<template>
  <section class="page">
    <header class="header">
      <div>
        <h1>Projeler</h1>
        <p class="hint">
          Proje oluşturun ve yönetin. Projeler, görevlerin organize edilmesi ve
          takibi için kullanılır.
        </p>
      </div>
      <button class="ghost btn" type="button" @click="load" :disabled="loading">
        Yenile
      </button>
    </header>

    <div class="grid">
      <article class="panel">
        <h2>Yeni Proje</h2>
        <form class="form" @submit.prevent="submit">
          <label>
            <span>Başlık</span>
            <input
              v-model="form.title"
              required
              maxlength="255"
              placeholder="Örn: Mobil Uygulama"
            />
          </label>
          <label>
            <span>Açıklama</span>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Opsiyonel"
            ></textarea>
          </label>
          <div class="row">
            <label>
              <span>Takım</span>
              <select v-model.number="form.team" :disabled="teams.length === 0">
                <option v-for="team in teams" :key="team.id" :value="team.id">
                  {{ team.name }}
                </option>
              </select>
            </label>
            <label class="check">
              <span>Aktif</span>
              <input v-model="form.is_active" type="checkbox" />
            </label>
          </div>
          <p class="note" v-if="teams.length === 0">
            Önce bir takım oluşturman gerekiyor.
            <RouterLink to="/teams">Takımlar</RouterLink>
          </p>
          <button
            class="primary"
            type="submit"
            :disabled="loading || !form.team"
          >
            {{ loading ? "Oluşturuluyor..." : "Proje Oluştur" }}
          </button>
          <p class="note" v-if="selectedTeam && !error">
            Seçili Takım: {{ selectedTeam.name }}
          </p>
        </form>
      </article>

      <article class="panel">
        <h2>Mevcut Projeler</h2>
        <div v-if="loading && boardStore.projects.length === 0" class="note">
          Yükleniyor...
        </div>
        <ul class="list" v-else>
          <li
            v-for="project in boardStore.projects"
            :key="project.id"
            class="item"
          >
            <div class="main">
              <div class="title">Proje Başlığı: {{ project.title }}</div>
              <div class="">
                Proje Yetkilisi:
                {{ teams.find((t) => t.id === project.team)?.owner?.username }}
              </div>
              <div class="meta">
                <span>Proje No: {{ project.id }}</span>
                <span
                  >Takım:
                  {{ teams.find((t) => t.id == project.team)?.name }}</span
                >
                <span v-if="project.created_at"
                  >Oluşturulma Zamanı:
                  {{ formatDate(project.created_at) }}</span
                >
              </div>

              <p v-if="project.description" class="desc">
                {{ project.description }}
              </p>
            </div>
            <div class="actions">
              <label class="mini">
                <span>Aktif</span>
                <input
                  type="checkbox"
                  :checked="project.is_active ?? true"
                  @change="
                    toggleActive(
                      project,
                      ($event.target as HTMLInputElement).checked
                    )
                  "
                />
              </label>
              <button class="ghost" type="button" @click="openOnBoard(project)">
                Board'da aç
              </button>
              <button class="danger" type="button" @click="remove(project)">
                Sil
              </button>
            </div>
          </li>
        </ul>
      </article>
    </div>
    <v-snackbar v-model="errorSnack" color="error" multi-line :timeout="6000">
      {{ error }}
    </v-snackbar>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

h1 {
  margin: 0 0 6px;
  color: #0f172a;
}

.hint {
  margin: 0;
  color: #475569;
  font-size: 14px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
}

.panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

h2 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #0f172a;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #0f172a;
  font-weight: 700;
  font-size: 13px;
}

input,
textarea,
select {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font: inherit;
}

.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: end;
}

.check {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 10px;
}

.check span {
  margin-right: 10px;
}

.primary {
  background: linear-gradient(120deg, #3663f2, #90a8ac);
  color: rgb(233, 229, 229);
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.25);
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ghost {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  font-size: 12px;
  padding: 3px 6px;
  cursor: pointer;
}

.danger {
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #9f1239;
  border-radius: 10px;
  font-size: 12px;
  padding: 3px 6px;
  cursor: pointer;
}

.ghost:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #b91c1c;
  font-size: 13px;
  margin: 0;
}

.note {
  margin: 0;
  color: #475569;
  font-size: 13px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
}

.title {
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 4px;
}

.meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: #475569;
  font-size: 12px;
}

.desc {
  margin: 8px 0 0;
  color: #334155;
  font-size: 13px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  font-size: 12px;
  padding: 3px 6px;
  border-radius: 8px;
  font-weight: 900;
  cursor: pointer;
}

.mini {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  font-size: 12px;
  padding: 3px 6px;
}

.mini span {
  font-size: 12px;
  color: #475569;
  font-weight: 800;
}

.btn {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 10px;
  font-size: 16px;
}
</style>


