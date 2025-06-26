from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # <-- Nueva importación
from api.routes import router
from sqlmodel import SQLModel
from api.database import engine

def create_app():
    app = FastAPI()

    # Aquí creamos las tablas con SQLModel
    SQLModel.metadata.create_all(bind=engine)

    # Configuración de CORS (puedes dejarla, pero no será tan crítica si sirves desde el mismo origen)
    origins = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)

    # Montar la carpeta 'frontend_ferreteria' como archivos estáticos
    # Asegúrate de que 'frontend_ferreteria' sea la carpeta que contiene index.html, style.css, script.js
    app.mount("/", StaticFiles(directory="frontend", html=True), name="static")

    return app