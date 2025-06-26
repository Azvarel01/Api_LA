from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.routes import router
from sqlmodel import SQLModel
from api.database import engine

def create_app():
    app = FastAPI()

    SQLModel.metadata.create_all(bind=engine)

    origins = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "null" # <--- ¡AÑADE ESTA LÍNEA!
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    app.include_router(router)

    app.mount("/", StaticFiles(directory="frontend", html=True), name="static")

    return app