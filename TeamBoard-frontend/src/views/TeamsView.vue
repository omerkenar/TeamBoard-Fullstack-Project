<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import {
  createTeam,
  deleteTeam,
  fetchTeams,
  fetchTeam,
  updateTeam,
} from "@/services/teams";
import { fetchUsers } from "@/services/users";
import type { Team, UserList } from "@/types/api";

const loading = ref(false);
const error = ref<string | null>(null);
const errorSnack = ref(false);
const teams = ref<Team[]>([]);
const usersLoading = ref(false);
const usersError = ref<string | null>(null);
const usersErrorSnack = ref(false);
const users = ref<UserList[]>([]);
const editingTeamId = ref<number | null>(null);
const editingMemberIds = ref<number[]>([]);
const updatingMembers = ref(false);
const updateMembersError = ref<string | null>(null);
const updateMembersErrorSnack = ref(false);

const form = reactive({
  name: "",
  member_ids: [] as number[],
});

const load = async () => {
  loading.value = true;
  error.value = null;
  try {
    teams.value = await fetchTeams();
  } catch (e: any) {
    errorSnack.value = true;
    error.value = e.message ?? "Takımlar yüklenemedi";
  } finally {
    loading.value = false;
  }
};

const loadUsers = async () => {
  usersLoading.value = true;
  usersError.value = null;
  try {
    users.value = await fetchUsers({ ordering: "username" });
  } catch (e: any) {
    usersErrorSnack.value = true;
    usersError.value = e.message ?? "Kullanicilar yuklenemedi";
    users.value = [];
  } finally {
    usersLoading.value = false;
  }
};

const submit = async () => {
  loading.value = true;
  error.value = null;
  try {
    const team = await createTeam({
      name: form.name.trim(),
      member_ids: form.member_ids.length ? form.member_ids : undefined,
    });
    form.name = "";
    form.member_ids = [];

    // Ensure we have members/owner details (some backends return minimal payload on create).
    try {
      const full = await fetchTeam(team.id);
      teams.value = [full, ...teams.value.filter((t) => t.id !== full.id)];
    } catch {
      teams.value = [team, ...teams.value];
    }
  } catch (e: any) {
    errorSnack.value = true;
    error.value = e.message ?? "Takım oluşturulamadı";
  } finally {
    loading.value = false;
  }
};

const remove = async (team: Team) => {
  const confirmed = window.confirm(`"${team.name}" takımı silinsin mi?`);
  if (!confirmed) return;
  loading.value = true;
  error.value = null;
  try {
    await deleteTeam(team.id);
    teams.value = teams.value.filter((t) => t.id !== team.id);
  } catch (e: any) {
    errorSnack.value = true;
    error.value = e.message ?? "Takım silinemedi";
  } finally {
    loading.value = false;
  }
};

const toggleMemberEditor = async (team: Team) => {
  updateMembersError.value = null;

  if (editingTeamId.value === team.id) {
    editingTeamId.value = null;
    editingMemberIds.value = [];
    return;
  }

  editingTeamId.value = team.id;

  let fullTeam = team;
  if (!fullTeam.members) {
    try {
      fullTeam = await fetchTeam(team.id);
      teams.value = teams.value.map((t) =>
        t.id === fullTeam.id ? fullTeam : t
      );
    } catch {
      // If we can't load members, default to empty selection.
    }
  }

  editingMemberIds.value = (fullTeam.members ?? [])
    .map((m) => m.id)
    .filter((id) => id !== fullTeam.owner?.id);
};

const confirmMemberUpdate = async (team: Team) => {
  updatingMembers.value = true;
  updateMembersError.value = null;
  try {
    const memberIds = editingMemberIds.value.filter(
      (id) => id !== team.owner?.id
    );
    await updateTeam(team.id, { member_ids: memberIds });
    const full = await fetchTeam(team.id);
    teams.value = teams.value.map((t) => (t.id === full.id ? full : t));
    editingTeamId.value = null;
    editingMemberIds.value = [];
  } catch (e: any) {
    updateMembersErrorSnack.value = true;
    updateMembersError.value = e.message ?? "Takim uyeleri guncellenemedi";
  } finally {
    updatingMembers.value = false;
  }
};

const editableUsersFor = (team: Team) =>
  users.value.filter((u) => u.id !== team.owner?.id);

onMounted(() => {
  load();
  loadUsers();
});
</script>

<template>
  <section class="page">
    <header class="header">
      <div>
        <h1>Takımlar</h1>
        <p class="hint">
          Proje takımlarını oluşturun ve yönetin. Takım üyeleri, projelere
          atandığında görev ataması için kullanılabilir.
        </p>
      </div>
      <button class="ghost" type="button" @click="load" :disabled="loading">
        Yenile
      </button>
    </header>

    <div class="grid">
      <article class="panel">
        <h2>Yeni Takım</h2>
        <form class="form" @submit.prevent="submit">
          <label>
            <span>Takım Adı</span>
            <input
              v-model="form.name"
              required
              maxlength="255"
              placeholder="Örn: Frontend"
            />
          </label>
          <label>
            <span>Takım Üyeleri</span>
            <v-select
              v-model="form.member_ids"
              :items="users"
              item-title="username"
              item-value="id"
              multiple
              chips
              closable-chips
              clearable
              :loading="usersLoading"
              :disabled="usersLoading || users.length === 0"
              placeholder="Kullanıcı seç"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
            />
          </label>
          <button class="primary" type="submit" :disabled="loading">
            {{ loading ? "Oluşturuluyor..." : "Takım Oluştur" }}
          </button>
          <p class="note" v-if="!error">
            Not: Üyeler sisteme kayıtlı tüm kullanıcılardan listelenir.
          </p>
        </form>
      </article>

      <article class="panel">
        <h2>Mevcut takımlar</h2>
        <div v-if="loading && teams.length === 0" class="note">
          Yükleniyor...
        </div>
        <ul class="list" v-else>
          <li v-for="team in teams" :key="team.id" class="item">
            <div class="main">
              <div class="title">{{ team.name }}</div>
              <div class="meta">
                <span>#{{ team.id }}</span>
                <span v-if="team.owner"
                  >Takım Sorumlusu: {{ team.owner.username }}</span
                >
                <span>Üyeler: {{ team.members?.length ?? 0 }}</span>
              </div>
              <div v-if="team.members?.length" class="members">
                <span v-for="m in team.members" :key="m.id" class="chip"
                  >@{{ m.username }}</span
                >
              </div>
              <div v-if="editingTeamId === team.id" class="member-editor">
                <div class="editor-title">Uyeleri guncelle</div>
                <v-select
                  v-model="editingMemberIds"
                  :items="editableUsersFor(team)"
                  item-title="username"
                  item-value="id"
                  multiple
                  chips
                  closable-chips
                  clearable
                  :loading="usersLoading"
                  :disabled="
                    usersLoading || users.length === 0 || updatingMembers
                  "
                  placeholder="Kullanici sec"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                />
                <button
                  class="primary"
                  type="button"
                  @click="confirmMemberUpdate(team)"
                  :disabled="updatingMembers"
                >
                  {{ updatingMembers ? "Guncelleniyor..." : "Onayla" }}
                </button>
              </div>
            </div>
            <div class="actions">
              <button class="danger" type="button" @click="remove(team)">
                Sil
              </button>
              <button
                class="btn ghost"
                type="button"
                @click="toggleMemberEditor(team)"
                :disabled="usersLoading || !!usersError"
              >
                Ekle/Çıkar
              </button>
            </div>
          </li>
        </ul>
      </article>
    </div>
    <v-snackbar v-model="errorSnack" color="error" multi-line :timeout="6000">
      {{ error }}
    </v-snackbar>
    <v-snackbar
      v-model="usersErrorSnack"
      color="error"
      multi-line
      :timeout="6000"
    >
      {{ usersError }}
    </v-snackbar>
    <v-snackbar
      v-model="updateMembersErrorSnack"
      color="error"
      multi-line
      :timeout="6000"
    >
      {{ updateMembersError }}
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

input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font: inherit;
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
  padding: 10px 12px;
  font-weight: 700;
  cursor: pointer;
}

.danger {
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #9f1239;
  border-radius: 8px;
  padding: 3px 6px;
  font-weight: 900;
  font-size: 12px;
  cursor: pointer;
}

.btn {
  font-size: 12px;
  padding: 3px 6px;
  border-radius: 8px;
  font-weight: 900;
  cursor: pointer;
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

.members {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.member-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
}

.editor-title {
  font-weight: 900;
  font-size: 12px;
  color: #334155;
}

.chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0f172a;
  border: 1px solid #bae6fd;
  font-weight: 800;
  font-size: 12px;
}

.actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}
</style>

