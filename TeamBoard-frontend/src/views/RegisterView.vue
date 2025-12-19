<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import type { RegisterPayload } from "@/types/api";

const auth = useAuthStore();
const router = useRouter();

const form = reactive({
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
});

const authErrorOpen = ref(false);

watch(
  () => auth.error,
  (value) => {
    if (value) authErrorOpen.value = true;
  }
);

watch(authErrorOpen, (open) => {
  if (!open) auth.error = null;
});

const onSubmit = async () => {
  const payload: RegisterPayload = {
    username: form.username.trim(),
    email: form.email.trim(),
    password: form.password,
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
  };

  const ok = await auth.register(payload);
  if (ok) router.push("/");
};
</script>

<template>
  <div class="auth">
    <div class="panel">
      <h1>Kayıt Ol</h1>
      <p class="hint">Yeni hesap oluştur ve projelerini yönetmeye başla</p>

      <form class="form" @submit.prevent="onSubmit">
        <label>
          <span>Kullanıcı adı</span>
          <input
            v-model="form.username"
            type="text"
            required
            placeholder="username"
          />
        </label>

        <label>
          <span>Ad</span>
          <input
            v-model="form.first_name"
            type="text"
            required
            placeholder="Ad"
          />
        </label>
        <label>
          <span>Soyad</span>
          <input
            v-model="form.last_name"
            type="text"
            required
            placeholder="Soyad"
          />
        </label>

        <label>
          <span>E-posta</span>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="mail@example.com"
          />
        </label>

        <label>
          <span>Şifre</span>
          <input
            v-model="form.password"
            type="password"
            required
            placeholder="••••••••"
          />
        </label>

        <button class="primary" type="submit" :disabled="auth.loading">
          {{ auth.loading ? "Kaydediliyor..." : "Kayıt ol" }}
        </button>
      </form>

      <p class="hint">
        Hesabın var mı?
        <RouterLink to="/login">Giriş yap</RouterLink>
      </p>
    </div>
    <v-snackbar v-model="authErrorOpen" color="error" multi-line :timeout="6000">
      {{ auth.error }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.auth {
  display: flex;
  justify-content: center;
  padding: 40px 16px;
}

.panel {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
}

h1 {
  margin: 0 0 6px;
  color: #0f172a;
}

.hint {
  margin: 0 0 16px;
  color: #475569;
  font-size: 14px;
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
  font-weight: 600;
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
  margin-top: 6px;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-weight: 700;
  cursor: pointer;
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #b91c1c;
  font-size: 14px;
  margin: 4px 0 0;
}
</style>
