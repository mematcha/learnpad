from fastapi import FastAPI


def create_app() -> FastAPI:
    app = FastAPI(
        title="Learnpad API",
        version="0.1.0",
        description="Backend services for the Learnpad adaptive learning platform.",
    )

    @app.get("/health", tags=["system"])
    async def health_check():
        return {"status": "ok"}

    @app.get("/", tags=["system"])
    async def root():
        return {"message": "Welcome to the Learnpad API"}

    return app


app = create_app()

