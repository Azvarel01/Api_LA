from sqlmodel import SQLModel, create_engine,Session

sqlite_file_name="ferreteria.db"
sqlite_url=f"sqlite:///{sqlite_file_name}"
engine=create_engine(sqlite_url,echo=True)

def get_session():
    with Session(engine) as session:
        yield session

def crear_db():
    SQLModel.metadata.create_all(engine)