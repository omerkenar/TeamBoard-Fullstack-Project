<template>
  <section class="kanban">
    <header class="kanban__header">
      <div>
        <p class="eyebrow">Board</p>
        <h2>Seçilen Proje: {{ boardStore.selectedProject?.title }}</h2>
      </div>
      <button
        @click="openCreate"
        class="primary"
        :disabled="!boardStore.selectedProjectId"
      >
        Yeni Task
      </button>
    </header>

    <div class="lanes" :class="{ 'is-loading': loading }">
      <article v-for="column in columns" :key="column.id" class="lane">
        <header class="lane__header">
          <h3>{{ column.title }}</h3>
          <span class="pill">{{ ensureLocalList(column.id).length }}</span>
        </header>
        <Container
          class="lane__list"
          group-name="tasks"
          :non-drag-area-selector="'.card--locked'"
          :get-child-payload="getChildPayload(column.id)"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
          @drop="onDropFor(column, $event)"
        >
          <Draggable v-for="task in ensureLocalList(column.id)" :key="task.id">
            <div
              @click="handleClick(task)"
              class="card"
              style="cursor: grab"
              :class="{ 'card--locked': !canUpdateTask(task) }"
            >
              <div
                style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                "
              >
                <div class="card__title">{{ task.title }}</div>
                <button
                  v-if="canUpdateTask(task)"
                  @click.stop="handleDeleteTask(task)"
                  type="button"
                  aria-label="Delete task"
                  class="btn-delete"
                >
                  Sil
                </button>
              </div>
              <div class="card__meta">
                <span class="chip">{{ statusLabel(task.status) }}</span>
              </div>
              <p class="desc" v-if="task.description">
                {{ task.description }}
              </p>
              <div class="tags" v-if="task.due_date">
                <span class="tag">{{ task.due_date }}</span>
                <span class="assignee">
                  {{ task.assignee_detail?.username ?? "Atanmadı" }}
                </span>
              </div>
            </div>
          </Draggable>
        </Container>
      </article>
    </div>

    <div v-if="showCreate" class="modal" @click.self="closeCreate">
      <div class="modal__panel">
        <header class="modal__header">
          <h3>Yeni Task</h3>
          <button class="icon" type="button" @click="closeCreate">×</button>
        </header>

        <form class="modal__form" @submit.prevent="submitCreate">
          <label>
            <span>Başlık</span>
            <input v-model="createForm.title" required maxlength="255" />
          </label>

          <label>
            <span>Açıklama</span>
            <textarea v-model="createForm.description" rows="3"></textarea>
          </label>

          <div class="grid">
            <label>
              <span>Bitiş Tarihi</span>
              <input v-model="createForm.due_date" type="date" />
            </label>
            <label>
              <span>Sorumlu</span>
              <input
                v-model="createForm.assigneeId"
                list="team-members"
                inputmode="numeric"
                placeholder="Takım Üyeleri Arasından Seçin"
              />
              <datalist id="team-members">
                <option
                  v-for="member in teamMembers"
                  :key="member.id"
                  :value="String(member.id)"
                  :label="member.username"
                />
              </datalist>
            </label>
          </div>

          <div class="actions">
            <button class="ghost" type="button" @click="closeCreate">
              <span v-if="!createForm?.id">İptal</span>
              <span v-else>Kapat</span>
            </button>
            <button
              class="primary"
              type="submit"
              :disabled="boardStore.loading"
            >
              <span v-if="!createForm?.id">{{
                boardStore.loading ? "Ekleniyor..." : "Ekle"
              }}</span>
              <span v-else>
                {{ boardStore.loading ? "Düzenleniyor..." : "Düzenle" }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
    <v-snackbar
      v-model="boardErrorSnack"
      color="error"
      multi-line
      :timeout="6000"
    >
      {{ boardStore.error }}
    </v-snackbar>
    <v-snackbar
      v-model="createErrorSnack"
      color="error"
      multi-line
      :timeout="6000"
    >
      {{ createError }}
    </v-snackbar>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { Container, Draggable } from "vue-dndrop";
import { useBoardStore, type BoardColumn } from "@/stores/board";
import { useTeamStore } from "@/stores/team";
import { useAuthStore } from "@/stores/auth";
import { fetchTeam } from "@/services/teams";
import type { Task } from "@/types/api";
import type { User } from "@/types/api";

const props = defineProps<{
  columns: BoardColumn[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (
    e: "move",
    payload: {
      taskId: number;
      toStatus: BoardColumn["id"];
      toIndex: number;
      fromStatus?: BoardColumn["id"];
    }
  ): void;
}>();

const boardStore = useBoardStore();
const teamStore = useTeamStore();
const authStore = useAuthStore();

const currentUserId = computed(() => authStore.user?.id ?? null);
const canUpdateTask = (task: Task) => {
  const isOwner = teamStore.checkProjectOwner(
    boardStore.selectedProject,
    currentUserId.value
  );
  if (isOwner) return true;
  const me = currentUserId.value;
  return me !== null && task.assignee === me;
};

const showCreate = ref(false);
const createError = ref<string | null>(null);
const boardErrorSnack = ref(false);
const createErrorSnack = ref(false);
const createForm = reactive({
  id: null as number | null,
  title: "",
  description: "",
  due_date: "",
  assigneeId: "",
});

const teamMembers = ref<User[]>([]);
const teamMembersLoading = ref(false);

const handleClick = (task: Task) => {
  if (!canUpdateTask(task)) return;
  openCreate({
    id: task.id,
    title: task.title,
    description: task.description,
    due_date: task.due_date,
    assigneeId: task.assignee ? String(task.assignee) : "",
  });
};
const handleDeleteTask = (task: Task) => {
  if (!canUpdateTask(task)) return;
  const confirmed = window.confirm(
    `"${task.title}" görevini silmek istediğinize emin misiniz?`
  );
  if (confirmed) {
    boardStore.deleteTask(task.id);
  }
};

const loadTeamMembers = async () => {
  const teamId = boardStore.selectedProject?.team;
  if (!teamId) {
    teamMembers.value = [];
    return;
  }

  teamMembersLoading.value = true;
  try {
    const team = await fetchTeam(teamId);
    teamMembers.value = Array.isArray(team.members) ? team.members : [];
  } catch {
    teamMembers.value = [];
  } finally {
    teamMembersLoading.value = false;
  }
};

watch(() => boardStore.selectedProject?.team, loadTeamMembers, {
  immediate: true,
});

watch(
  () => boardStore.error,
  (value) => {
    if (value) boardErrorSnack.value = true;
  }
);

const openCreate = (formData: any) => {
  if (!boardStore.selectedProjectId) return;
  createForm.id = formData.id || null;
  createForm.title = formData?.title || "";
  createForm.description = formData?.description || "";
  createForm.due_date = formData?.due_date || "";
  createForm.assigneeId = formData?.assigneeId || "";
  createError.value = null;
  loadTeamMembers();
  showCreate.value = true;
};

const closeCreate = () => {
  showCreate.value = false;
};

const submitCreate = async () => {
  createError.value = null;

  const selected = createForm.assigneeId.trim();
  const parsedAssignee = selected ? Number(selected) : null;
  const assigneeAllowed =
    parsedAssignee === null ||
    teamMembers.value.some((member) => member.id === parsedAssignee);
  if (!assigneeAllowed) {
    createError.value = "Assignee sadece takım üyeleri arasından seçilebilir.";
    createErrorSnack.value = true;
    return;
  }
  if (createForm.id) {
    const ok = await boardStore.updateTask(createForm.id, {
      title: createForm.title.trim(),
      description: createForm.description.trim() || undefined,
      due_date: createForm.due_date || null,
      assignee: Number.isFinite(parsedAssignee) ? parsedAssignee : null,
    });
    if (ok) closeCreate();
    return;
  } else {
    const ok = await boardStore.addTask({
      title: createForm.title.trim(),
      description: createForm.description.trim() || undefined,
      due_date: createForm.due_date || null,
      assignee: Number.isFinite(parsedAssignee) ? parsedAssignee : null,
    });
    if (ok) closeCreate();
  }
};

const isDragging = ref(false);
const localTasksByStatus = reactive<Record<BoardColumn["id"], Task[]>>(
  {} as Record<BoardColumn["id"], Task[]>
);

const ensureLocalList = (status: BoardColumn["id"]) => {
  if (!localTasksByStatus[status]) localTasksByStatus[status] = [];
  return localTasksByStatus[status];
};

const syncLocalLists = (columns: BoardColumn[]) => {
  for (const col of columns) {
    localTasksByStatus[col.id] = [...col.tasks];
  }
};

watch(
  () => props.columns,
  (next) => {
    if (isDragging.value) return;
    syncLocalLists(next);
  },
  { immediate: true }
);

const onDragStart = () => {
  isDragging.value = true;
};

const onDragEnd = () => {
  isDragging.value = false;
};

type DropResult<T> = {
  removedIndex: number | null;
  addedIndex: number | null;
  payload?: T;
};

const getChildPayload =
  (columnId: BoardColumn["id"]) =>
  (index: number): Task | undefined =>
    ensureLocalList(columnId)[index];

const applyDrag = <T>(arr: T[], dropResult: DropResult<T>) => {
  const { removedIndex, addedIndex, payload } = dropResult;
  if (removedIndex === null && addedIndex === null) return arr;

  const result = [...arr];
  let itemToAdd = payload as T;

  if (removedIndex !== null) {
    itemToAdd = result.splice(removedIndex, 1)[0];
  }

  if (addedIndex !== null) {
    result.splice(addedIndex, 0, itemToAdd);
  }

  return result;
};

const onDrop = (column: BoardColumn, dropResult: DropResult<Task>) => {
  const payload = dropResult.payload;
  if (payload && !canUpdateTask(payload)) {
    syncLocalLists(props.columns);
    return;
  }

  const current = ensureLocalList(column.id);
  let next = applyDrag(current, dropResult);

  if (dropResult.addedIndex !== null) {
    if (!payload) return;

    next = next.map((task, idx) =>
      idx === dropResult.addedIndex ? { ...task, status: column.id } : task
    );
    localTasksByStatus[column.id] = next;

    emit("move", {
      taskId: payload.id,
      toStatus: column.id,
      toIndex: dropResult.addedIndex,
      fromStatus: payload.status,
    });
    return;
  }

  localTasksByStatus[column.id] = next;
};

const onDropFor = (column: BoardColumn, dropResult: DropResult<Task>) => {
  console.log("onDropFor called with column:", column);
  return onDrop(column, dropResult);
};

const statusLabel = (status: Task["status"]) => {
  if (status === "in_progress") return "In Progress";
  if (status === "done") return "Done";
  return "To Do";
};
</script>

<style scoped>
.kanban {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
}

.kanban__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 12px;
  color: #475569;
  margin: 0 0 4px 0;
}

.kanban h2 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.primary {
  background: linear-gradient(120deg, #3663f2, #90a8ac);
  color: rgb(233, 229, 229);
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.25);
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.lanes {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.lane {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 260px;
}

.lane__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.lane__header h3 {
  margin: 0;
  font-size: 15px;
  color: #0f172a;
  font-weight: 700;
}

.pill {
  display: inline-flex;
  min-width: 32px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 700;
  font-size: 13px;
}

.lane__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
}

.card {
  padding: 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}

.card--locked {
  opacity: 0.75;
}

.drag-handle {
  appearance: none;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  border-radius: 8px;
  width: 34px;
  height: 30px;
  display: grid;
  place-items: center;
  font-weight: 900;
  color: #334155;
  cursor: grab;
  float: right;
}

.card__title {
  font-weight: 700;
  margin-bottom: 8px;
  color: #0f172a;
  max-width: 80%;
}

.card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: #334155;
}

.chip {
  padding: 4px 8px;
  border-radius: 8px;
  background: #e0f2fe;
  color: #0f172a;
  font-weight: 700;
  font-size: 12px;
}

.assignee {
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.desc {
  margin: 0 0 6px;
  color: #475569;
  font-size: 13px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-between;
  gap: 6px;
}

.tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 12px;
  border: 1px solid #e2e8f0;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 50;
}

.modal__panel {
  width: min(520px, 100%);
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 16px 50px rgba(15, 23, 42, 0.22);
  overflow: hidden;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.modal__header h3 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}

.icon {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  width: 36px;
  height: 36px;
  font-size: 20px;
  cursor: pointer;
}

.modal__form {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal__form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #0f172a;
  font-weight: 700;
}

.modal__form input,
.modal__form textarea {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font: inherit;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.ghost {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
}

.ghost:hover {
  background: #f1f5f9;
}

.error {
  color: #b91c1c;
  font-size: 13px;
  margin: 0;
}

.btn-delete {
  cursor: pointer;
  color: red;
  font-size: 12px;
  font-weight: 700;
  text-decoration: underline;
  padding: 4px 12px;
}
:hover.btn-delete {
  background-color: #b91c1c;
  color: #ffffff;
  border-radius: 20%;
}
</style>
