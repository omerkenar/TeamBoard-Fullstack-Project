# TeamBoard – Fullstack Task & Project Management App

TeamBoard, takımların projelerini ve görevlerini (task) **Kanban board** mantığıyla yönetebileceği,
JWT ile güvenliği sağlanmış **fullstack** bir web uygulamasıdır.

Bu repository, **backend (Django REST API)** ve **frontend (Vue 3 + Vite)** projelerini tek çatı altında barındırır.

---

## 🧩 Proje Bileşenleri

### 🔹 Backend – Django REST API

- Takım / Proje / Görev yönetimi
- JWT tabanlı kimlik doğrulama
- Rol & yetki bazlı erişim kontrolü
- PostgreSQL + Docker Compose
- Swagger / Redoc API dokümantasyonu

📄 Detaylı kurulum ve API dokümantasyonu için:  
👉 **[`/TeamBoard-backend/README.md`](./TeamBoard-backend/README.md)**

---

### 🔹 Frontend – Vue 3 + Vite

- Kanban Board (drag & drop)
- JWT token yönetimi (auto refresh)
- Vue Router + Pinia + Vuetify
- Yetkilere göre UI davranışı

📄 Detaylı kurulum ve kullanım için:  
👉 **[`TeamBoard-frontend/README.md`](./TeamBoard-frontend/README.md)**

---

## 🛠️ Kullanılan Teknolojiler (Özet)

**Backend**

- Django, Django REST Framework
- PostgreSQL
- JWT (SimpleJWT)
- Docker & Docker Compose

**Frontend**

- Vue 3 + Vite
- TypeScript
- Pinia
- Vuetify

---

## 🚀 Hızlı Başlangıç (Özet)

> Tam kurulum adımları için lütfen ilgili uygulamanın README dosyasını inceleyin.

```bash
# Backend
cd backend
docker compose up --build

# Frontend
cd frontend
npm install
npm run dev
```
