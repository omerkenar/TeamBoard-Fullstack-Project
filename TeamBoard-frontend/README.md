# TeamBoard Frontend

TeamBoard, takımların projelerini ve görevlerini (task) Kanban board üzerinden yönetebilmesi için geliştirilmiş bir Vue 3 + Vite frontend uygulamasıdır.

- UI: Vue 3, Vue Router, Pinia, Vuetify
- Board: Sürükle-bırak ile durum güncelleme (To Do / In Progress / Done)
- Auth: JWT access/refresh token ile oturum yönetimi (401 sonrasi otomatik refresh denemesi)

## Özellikler

- **Kimlik doğrulama**

  - Kayıt olma (`/register`)
  - Giriş yapma (`/login`)
  - Oturum kapatma
  - Route guard: Giriş yapılmadan korumalı sayfalara erişim engeli

- **Dashboard / Kanban Board**

  - Proje seçimi
  - Kolonlar: `todo`, `in_progress`, `done`
  - Görev oluşturma / güncelleme / silme
  - Görev sürükle-bırak ile taşınabilir
  - Yetki kuralı: Görevi taşıma/güncelleme için görev size atanmış olmalı veya proje sahibi olmalısınız

- **Takımlar**

  - Takım oluşturma, listeleme, silme
  - Takım üyelerini güncelleme

- **Projeler**
  - Proje oluşturma, listeleme, silme
  - Aktif/Pasif durumunu güncelleme
  - Aktif projeyi board ekranında açma

## Teknoloji Yigini

- **Vue 3**
- **Vite**
- **TypeScript**
- **Pinia** (state management)
- **Vue Router**
- **Vuetify**
- **Sürükle-bırak**: `vue-dndrop` (+ `sortablejs`)

## Gereksinimler

- Node.js 18+ (önerilir)
- NPM
- Çalısan bir backend API (varsayılan: `http://localhost:8000`)

## Kurulum

```bash
npm install
```

## Ortam Değişkenleri

Uygulama Vite env değişkenleri kullanır.

- `VITE_API_BASE` (opsiyonel)

  - Varsayılan: `http://localhost:8000`
  - Örnek: `https://api.example.com`

- `VITE_WORKSPACE_NAME` (opsiyonel)
  - Header'da gösterilecek çalışma alanı adı

### `.env` olusturma

```bash
# Windows (PowerShell) örnek
copy .env.example .env
```

`.env` içeriği örneği:

```env
VITE_API_BASE=http://localhost:8000
VITE_WORKSPACE_NAME=TeamBoard
```

### Vite Proxy Notu

`vite.config.ts` içinde dev ortami için `/api` istekleri `http://localhost:8000` adresine proxylenir.

- Uygulama kodu API çagrılarını `VITE_API_BASE + /api/...` şeklinde yapar.
- Proxyi kullanmak isterseniz `VITE_API_BASE` değerini **bos string** bırakabilirsiniz:

```env
VITE_API_BASE=
```

Bu durumda istekler `/api/...` olarak gider ve Vite dev proxy devreye girer.

## Geliştirme

```bash
npm run dev
```

Vite dev server çıktısında görünen adrese gidin (genelde `http://localhost:5173`).

## Build / Preview

```bash
npm run build
npm run preview
```

Build çıktısı `dist/` klasörüne alınır.

## Test

```bash
npm run test:unit
```

## Backend API Beklentisi

Frontend asağıdaki endpointleri kullanır (Özet):

### Auth

- `POST /api/auth/login/`
- `POST /api/auth/register/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`

### Teams

- `GET /api/teams/`
- `POST /api/teams/`
- `GET /api/teams/:id/`
- `PATCH /api/teams/:id/`
- `DELETE /api/teams/:id/`

### Projects

- `GET /api/projects/`
- `POST /api/projects/`
- `GET /api/projects/:id/`
- `PATCH /api/projects/:id/`
- `DELETE /api/projects/:id/`

### Tasks

- `GET /api/tasks/`
- `POST /api/tasks/`
- `GET /api/tasks/:id/`
- `PATCH /api/tasks/:id/`
- `DELETE /api/tasks/:id/`

### Users

- `GET /api/users/`
- `GET /api/users/:id/`

## Oturum (Token) Saklama

Tokenlar `localStorage` içinde tutulur:

- `teamboard_access`
- `teamboard_refresh`
- `teamboard_username`

## Proje Yapısı (kısa)

- `src/main.ts`: Uygulama bootstrap
- `src/router/index.ts`: Routelar + auth guard
- `src/stores/*`: Pinia stores (auth, board, team)
- `src/services/*`: API client ve endpoint servisleri
- `src/components/KanbanBoard.vue`: Kanban board bileşeni
- `src/views/*`: Sayfalar (Dashboard, Teams, Projects, Login, Register)

## Deploy

- `npm run build` sonrası `dist/` klasörünü statik olarak servis edin.
- SPA routing için sunucunuzda **fallback** ayarlayin (örn. tüm pathler `index.html`e dönsün).
- Prod ortamında `VITE_API_BASE` değerini canlı backend URL'nize ayarlayın.
