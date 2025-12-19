<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useBoardStore } from "@/stores/board";

const auth = useAuthStore();
const boardStore = useBoardStore();
const route = useRoute();
const router = useRouter();

const menuOpen = ref(false);
const menuRoot = ref<HTMLElement | null>(null);

const workspaceName = import.meta.env.VITE_WORKSPACE_NAME ?? "TeamBoard";

const avatarLetter = computed(() => {
  const name = auth.displayName?.trim();
  return name ? name[0].toUpperCase() : "U";
});

const notificationCount = computed(() => boardStore.tasks.length);
const notificationLabel = computed(() =>
  notificationCount.value > 9 ? "9+" : String(notificationCount.value)
);

const handleLogout = () => {
  auth.logout();
  router.push({ name: "login" });
};

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const closeMenu = () => {
  menuOpen.value = false;
};

const logoutFromMenu = () => {
  closeMenu();
  handleLogout();
};

const onDocumentClick = (e: MouseEvent) => {
  const el = menuRoot.value;
  if (!el) return;
  const target = e.target as Node | null;
  if (target && el.contains(target)) return;
  closeMenu();
};

onMounted(async () => {
  if (auth.isAuthenticated) {
    await auth.loadMe();
  }
  document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});

watch(
  () => route.fullPath,
  () => closeMenu()
);
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div class="brand">
        <span class="dot"></span>
        <span class="wordmark">TeamBoard</span>
      </div>

      <nav class="nav" v-if="auth.isAuthenticated">
        <RouterLink to="/">Board</RouterLink>
        <RouterLink to="/teams">Teams</RouterLink>
        <RouterLink to="/projects">Projects</RouterLink>
      </nav>

      <div class="session">
        <RouterLink v-if="!auth.isAuthenticated" to="/login" class="ghost-btn">
          Giriş
        </RouterLink>
        <RouterLink
          v-if="!auth.isAuthenticated"
          to="/register"
          class="ghost-btn"
        >
          Kayıt
        </RouterLink>

        <div v-else class="session-auth">
          <div ref="menuRoot" class="user-menu" @keydown.esc="closeMenu">
            <button class="user-btn" type="button" @click.stop="toggleMenu">
              <span class="avatar" aria-hidden="true">{{ avatarLetter }}</span>
              <span class="username">{{ auth.displayName }}</span>
              <span class="chev">▾</span>
            </button>

            <div v-if="menuOpen" class="menu" role="menu">
              <button
                class="menu-item danger"
                type="button"
                role="menuitem"
                @click="logoutFromMenu"
              >
                Oturumu kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #0f172a;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  gap: 14px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #22d3ee);
  box-shadow: 0 0 12px rgba(37, 99, 235, 0.35);
}

.wordmark {
  font-size: 18px;
}

.nav {
  display: flex;
  gap: 12px;
  font-weight: 600;
  flex: 1;
  justify-content: center;
}

.nav a {
  color: #0f172a;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav a.router-link-active {
  background: #e0f2fe;
  color: #0f172a;
  border: 1px solid #bae6fd;
}

.nav a:hover {
  background: #f1f5f9;
}

.session {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ghost-btn {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  border-radius: 8px;
  padding: 8px 12px;
  text-decoration: none;
  font-weight: 600;
}

.ghost-btn:hover {
  background: #f1f5f9;
}

.session-auth {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  cursor: pointer;
}

.icon-btn:hover {
  background: #f1f5f9;
}

.grid-icon {
  font-size: 16px;
  color: #334155;
}

.bell {
  font-size: 16px;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 22px;
  height: 18px;
  padding: 0 6px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #16a34a;
  color: #ffffff;
  font-size: 11px;
  font-weight: 900;
  border: 2px solid #ffffff;
}

.user-menu {
  position: relative;
}

.user-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  padding: 6px 10px;
  font-weight: 800;
  cursor: pointer;
}

.user-btn:hover {
  background: #f1f5f9;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #93c5fd;
  color: #0f172a;
  font-weight: 900;
  font-size: 13px;
}

.username {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chev {
  font-size: 12px;
  color: #475569;
}

.menu {
  position: absolute;
  right: 0;
  margin-top: 8px;
  min-width: 280px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  padding: 8px;
  z-index: 20;
}

.menu-title {
  padding: 10px 10px;
  font-weight: 900;
  color: #0f172a;
}

.menu-sep {
  height: 1px;
  background: #e2e8f0;
  margin: 6px 0;
}

.menu-item {
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 10px;
  padding: 10px 10px;
  cursor: pointer;
  font-weight: 800;
  color: #0f172a;
}

.menu-item:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.menu-item:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.menu-item.danger {
  color: #9f1239;
}

.menu-item.danger:hover {
  background: #fff1f2;
  border-color: #fecaca;
}

.content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
