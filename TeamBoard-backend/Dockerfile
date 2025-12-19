# Python base image
FROM python:3.12-slim

# Ortam değişkenleri
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Çalışma dizini
WORKDIR /app

# Sistem bağımlılıkları (psycopg2 için)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python bağımlılıkları
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Proje dosyaları
COPY . /app/

# Default port (runserver için)
EXPOSE 8000

# Command'i docker-compose'da override ediyoruz.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
