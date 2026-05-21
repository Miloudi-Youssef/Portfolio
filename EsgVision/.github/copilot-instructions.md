## Project Overview
ESG Vision is a Knowledge Graph Assistant for ESG and CSRD report analysis. It uses a LangGraph RAG pipeline, FastAPI backend, Neo4j graph database, and a Next.js frontend.

## Architecture
- **LangGraph**: Orchestrates the RAG workflow (query analysis → hybrid retrieval → graph reasoning → generation)
- **FastAPI/Uvicorn**: REST + SSE API for chat, document management, and history
- **Neo4j**: Graph database storing Document, Chunk, Entity nodes and their relationships
- **OpenAI / Ollama**: Configurable LLM and embedding provider
- **Next.js 14**: React frontend with Zustand state and Tailwind CSS

## Domain
Focused on ESG, CSRD, GRI, TCFD, and sustainability reporting documents.

## Development Guidelines
- Follow modular architecture: ingestion / core / rag / api / frontend are separate concerns
- Use environment variables for all configuration (see `config/settings.py`)
- Implement proper error handling and logging
- When running Python commands, always activate the virtual environment first:
  ```bash
  source .venv/bin/activate
  ```
- Do not write documentation files unless specified
- Do not write tests unless specified
