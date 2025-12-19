# TeamBoard API

TeamBoard; takım, proje ve görev yönetimi için JWT ile korunan bir Django REST API uygulamasıdır.

## İçerik

- [Özellikler](#özellikler)
- [Teknoloji](#teknoloji)
- [Kurulum](#kurulum)
- [Ortam Değiskenleri](#ortam-değişkenleri)
- [API Dokumantasyon](#api-dokumantasyon)
- [Kimlik Doğrulama (JWT)](#kimlik-doğrulama-jwt)
- [Endpointler](#endpointler)
- [Filtreleme](#filtreleme)
- [Yanıt Formatı](#yanit-formati)
- [Yetkiler ve İş Kuralları](#yetkiler-ve-İş-kuralları)
- [Gelişme](#gelişme)

## Özellikler

- JWT ile kimlik doğrulama: register, login, refresh, me
- Takım / proje / görev CRUD endpointleri
- Takım üyeliği ve sahiplik bazlı yetkilendirme
- Proje limiti: bir takım için en fazla 10 proje
- Proje ve görev filtreleme (query parametreleri)
- Swagger ve Redoc dokumantasyon sayfaları
- Başarılı ve hatalı yanıtlar için standart JSON zarf (envelope)

## Teknoloji

- Django 5
- Django REST Framework
- SimpleJWT
- PostgreSQL
- Docker Compose

## Kurulum

### Docker (önerilen)

1. `.env` dosyasını oluştur ve değerleri gir (örnektir):

```
POSTGRES_DB=mydatabase
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_HOST=db
POSTGRES_PORT=5432
SECRET_KEY=your_secret_key
DJANGO_DEBUG=True
```

2. Servisleri başlat:

```
docker compose up --build
```

> Not: `docker-compose.yml` içinde `migrate` ve `runserver` otomatik çalışır. Backend: `http://localhost:8000`

### Lokal (Python)

Windows:

```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

macOS/Linux:

```
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Ortam Değişkenleri

Ortam değişkenleri proje kökündeki `.env` dosyasından okunur.

| Degisken            | Aciklama          | Ornek                               |
| ------------------- | ----------------- | ----------------------------------- |
| `POSTGRES_DB`       | DB adi            | `mydatabase`                        |
| `POSTGRES_USER`     | DB kullanici      | `myuser`                            |
| `POSTGRES_PASSWORD` | DB sifre          | `mypassword`                        |
| `POSTGRES_HOST`     | DB host           | `db` (docker) / `localhost` (lokal) |
| `POSTGRES_PORT`     | DB port           | `5432`                              |
| `SECRET_KEY`        | Django secret key | `your_secret_key`                   |
| `DJANGO_DEBUG`      | Debug modu        | `True` / `False`                    |

## API Dokumantasyon

- Swagger: `http://localhost:8000/api/docs/`
- Redoc: `http://localhost:8000/api/redoc/`
- OpenAPI Schema: `http://localhost:8000/api/schema/`

## Kimlik Doğrulama (JWT)

Token kullanımı:

```
Authorization: Bearer <access_token>
```

> Not: Bu projede başarılı yanıtlar custom renderer ile zarf icinde doner. JWT token endpointleri de (login/refresh) bu zarfın içine girer.

### Register

`POST /api/auth/register/`

İstek:

```json
{
  "username": "demo",
  "email": "demo@example.com",
  "password": "secret123",
  "first_name": "Demo",
  "last_name": "User"
}
```

Örnek başarılı yanıt:

```json
{
  "success": true,
  "message": "Islem basarili.",
  "data": {
    "id": 1,
    "username": "demo",
    "email": "demo@example.com",
    "first_name": "Demo",
    "last_name": "User"
  }
}
```

### Login

`POST /api/auth/login/`

İstek:

```json
{
  "username": "demo",
  "password": "secret123"
}
```

Örnek başarılı yanıt:

```json
{
  "success": true,
  "message": "Islem basarili.",
  "data": {
    "refresh": "<refresh_token>",
    "access": "<access_token>"
  }
}
```

### Refresh

`POST /api/auth/refresh/`

İstek:

```json
{
  "refresh": "<refresh_token>"
}
```

Örnek başarılı yanıt:

```json
{
  "success": true,
  "message": "Islem basarili.",
  "data": {
    "access": "<access_token>"
  }
}
```

### Me

`GET /api/auth/me/`

## Endpointler

### Auth

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`

### Users

- `GET /api/users/` : Aktif kullanıcılar (kendi kullanıcın hariç)

### Teams

- `GET /api/teams/` : Üye olunan veya sahibi olunan takımlar
- `POST /api/teams/` : Takım oluşturur (owner otomatik atanır)
- `GET /api/teams/{id}/`
- `PATCH /api/teams/{id}/`
- `DELETE /api/teams/{id}/`

### Projects

- `GET /api/projects/`
- `POST /api/projects/`
- `GET /api/projects/{id}/`
- `PATCH /api/projects/{id}/`
- `DELETE /api/projects/{id}/`

### Tasks

- `GET /api/tasks/`
- `POST /api/tasks/`
- `GET /api/tasks/{id}/`
- `PATCH /api/tasks/{id}/`
- `DELETE /api/tasks/{id}/`

## Filtreleme

- Projeler: `/api/projects/?team=<id>&is_active=true`
- Görevler: `/api/tasks/?project=<id>&assignee=<id>&status=todo&due_before=2025-01-01&due_after=2024-01-01`

## Yanıt Formatı

Başarılı yanıt (exception olmayan tüm response'lar):

```json
{
  "success": true,
  "message": "Islem basarili.",
  "data": {}
}
```

Hata yanıtı (global exception handler):

```json
{
  "success": false,
  "message": "Hata mesaji",
  "errors": {}
}
```

## Yetkiler ve İş Kuralları

- Takım listeleme: sadece üye olunan / sahibi olunan takımlar görünür.
- Takım güncelleme/silme: sadece takım sahibi.
- Proje oluşturma/güncelleme/silme: sadece takım sahibi.
- Bir takım için maksimum 10 proje oluşturulabilir.
- Görev oluşturma: sadece takım sahibi.
- Görev güncelleme:
  - Takım sahibi: tüm alanları güncelleyebilir.
  - Assignee (atanan kişi): sadece `status` alanını güncelleyebilir (PATCH ile tek alan).

## Gelişme

- Loglar: `logs/backend.log`
- `SECRET_KEY` yoksa uygulama otomatik oluşturup `.env` dosyasına ekler.
