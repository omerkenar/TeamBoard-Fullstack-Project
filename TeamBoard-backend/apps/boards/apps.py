import sys

from django.apps import AppConfig


class BoardsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.boards'

    def ready(self):

        if "runserver" in sys.argv:

            host = "localhost"
            port = "8000"

            # Swagger ve Redoc URL'lerini kendi projenle eşleştir
            print("")
            print("🚀 Django server started")
            print(f"📘 Swagger UI : http://{host}:{port}/api/docs/")
            print(f"📙 ReDoc      : http://{host}:{port}/api/schema/")
            print("")
