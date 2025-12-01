import anyio
import uvicorn
from fastapi import FastAPI


def create_app() -> FastAPI:
    app = FastAPI(title="Learnpad MCP Server")

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


async def main() -> None:
    """
    Entrypoint for running the server in an MCP-compatible async loop.
    """
    app = create_app()
    config = uvicorn.Config(app, host="0.0.0.0", port=9000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()


if __name__ == "__main__":
    anyio.run(main)

