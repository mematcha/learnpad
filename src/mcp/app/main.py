from fastapi import FastAPI


def create_app() -> FastAPI:
    """
    Create a minimal FastAPI app that can be wired into an MCP server.
    """
    app = FastAPI(
        title="Learnpad MCP Server",
        version="0.1.0",
        description="Barebones MCP companion service.",
    )

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    @app.get("/")
    async def root():
        return {"message": "Hello from the MCP server"}

    return app


app = create_app()

