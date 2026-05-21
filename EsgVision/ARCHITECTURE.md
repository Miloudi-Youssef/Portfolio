# Architecture - ESG Vision Knowledge Graph Intelligence Platform

## Architectural Philosophy

ESG Vision is built on a conviction that is at odds with the current mainstream of production RAG systems: **embedding similarity alone is an architecturally insufficient foundation for institutional document intelligence**. The overwhelming majority of deployed RAG systems operate by encoding documents into a flat vector space and retrieving chunks by cosine proximity at query time. This approach performs adequately for simple factual recall but fails categorically when the query requires cross-document relational reasoning - precisely the type of reasoning that ESG and CSRD compliance workflows demand.

Sustainability disclosures are not collections of independent facts. They form a dense relational web: a Scope 2 reduction target references a measurement boundary methodology, which references a GHG Protocol accounting standard, which constrains how a verification body can certify the figure, which determines whether the disclosure satisfies ESRS E1 paragraph 34. None of this structure is recoverable from cosine similarity over chunk embeddings. It requires a graph.

ESG Vision resolves this by implementing a **dual-index architecture**: every ingested document simultaneously populates a 1,536-dimensional HNSW vector index and a typed Neo4j property graph. At query time, both indexes are queried in parallel, and their results are merged, re-ranked by a composite scoring function, and expanded through multi-hop graph traversal before being assembled into a grounded, provenance-annotated context window. The LLM operates over evidence that has been structurally validated, not merely semantically similar.

This document describes that architecture in full technical detail.

---

## System Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js 14 Frontend                          │
│                                                                     │
│   ESG Intelligence Chat  │  Knowledge Graph Explorer  │  Sessions   │
│                                                                     │
│   Zustand state   │   SSE stream consumer   │   Typed API client   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  REST + SSE  (Next.js proxy → :8000)
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                      FastAPI Application (:8000)                    │
│                                                                     │
│   /api/chat        /api/database       /api/documents  /api/history │
│                                                                     │
│   ┌─────────────────────────────────────┐                           │
│   │         LangGraph RAG Pipeline      │                           │
│   │                                     │                           │
│   │  query_analysis → retrieval →       │                           │
│   │  graph_reasoning → generation →     │                           │
│   │  quality_scoring                    │                           │
│   └──────────────┬──────────────────────┘                           │
│                  │                                                   │
│   ┌──────────────▼──────────┐   ┌──────────────────────────────┐   │
│   │    LLM + Embeddings     │   │       Neo4j Driver           │   │
│   │  (OpenAI / Ollama)      │   │   bolt://neo4j:7687          │   │
│   │  LRU cache · backoff    │   └──────────────┬───────────────┘   │
│   └─────────────────────────┘                  │                    │
└────────────────────────────────────────────────│────────────────────┘
                                                 │
┌────────────────────────────────────────────────▼────────────────────┐
│                        Neo4j 5+ Property Graph                      │
│                                                                     │
│  Nodes:  Document · Chunk · Entity · Summary · Tag                  │
│                                                                     │
│  Edges:  CONTAINS · MENTIONS · SIMILAR_TO · RELATED_TO              │
│          MEASURED_BY · COVERED_BY · ALIGNS_WITH · HAS_TARGET        │
│          TAGGED_WITH · HAS_SUMMARY                                  │
│                                                                     │
│  Indexes: HNSW vector index on Chunk.embedding  (1,536-dim, cosine) │
│           HNSW vector index on Entity.embedding (1,536-dim, cosine) │
│           B-tree lookup indexes: filename · entity_name · type      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Frontend (`/frontend`)

**Framework:** Next.js 14 App Router · React 18 · TypeScript · Tailwind CSS · Framer Motion

The frontend is architected around two primary interaction surfaces: the **ESG Intelligence Chat** for natural-language query resolution, and the **Knowledge Graph Explorer** for direct structural inspection of the entity-relationship graph. Both surfaces share a single Zustand store and communicate with the backend exclusively through a typed API client layer.

### Component Topology

```
app/page.tsx
├── Sidebar
│   ├── SessionsTab           - persistent session list with timestamp grouping,
│   │                           load and delete operations, Neo4j-backed history
│   └── KnowledgeBaseTab      - live corpus statistics, per-document status,
│                               drag-drop upload zone, entity count display
├── Header                    - "+ New Analysis" session reset, theme toggle
└── MainContent
    ├── ChatInterface
    │   ├── ConnectionStatus  - /api/health polling, real-time backend indicator
    │   ├── MessageBubble[]   - streamed markdown rendering with source expansion,
    │   │                       citation chip display, quality score badge
    │   ├── FollowUpQuestions - contextualised LLM-generated next query suggestions
    │   ├── LoadingIndicator  - per-stage streaming progress state
    │   └── ChatInput         - textarea with drag-drop upload, @document and
    │                           #framework mention picker with autocomplete
    └── KnowledgeGraphExplorer
        ├── GraphCanvas       - live Neo4j graph rendered as interactive node-edge diagram
        ├── FilterControls    - node type filter · relationship label toggle · full-text search
        ├── NodeDetailPanel   - entity type, corpus membership, connected entity count,
        │                       framework alignments, inferred targets, relationship list
        └── Minimap           - subgraph navigation for large entity spaces
```

### State Architecture

The Zustand store (`chatStore.ts`) is the single source of truth for all transient UI and conversation state. It deliberately holds no server state - all persistence is delegated to the Neo4j-backed session history API.

```typescript
interface ChatStore {
  messages: Message[]
  sessionId: string | null
  activeView: 'chat' | 'graph'
  isConnected: boolean
  isStreamingRequest: boolean
  loadSession: (id: string) => Promise<void>
  clearChat: () => void
  notifyHistoryRefresh: () => void
}
```

### Streaming Transport

SSE responses are consumed via the `fetch` API with a `ReadableStream` reader. Incoming token deltas are written to a client-side buffer and flushed to the React render tree on `requestAnimationFrame` ticks - decoupling the token arrival rate from the browser's paint cycle and eliminating layout thrashing during high-throughput generation. The connection status indicator issues `/api/health` polls on a 10-second interval, surfacing backend availability in real time without maintaining a persistent socket.

---

## 2. Backend (`/api`)

**Framework:** FastAPI 0.100+ · Python 3.10+ · Uvicorn ASGI server (full async)

The backend exposes four routers over a single async FastAPI application. All I/O - database queries, LLM API calls, embedding generation - is non-blocking. The SSE streaming endpoint holds an async generator open for the duration of each generation pass, emitting token deltas as they arrive from the upstream LLM without buffering.

### Router Responsibilities

| Router | Prefix | Core Responsibilities |
|---|---|---|
| `chat.py` | `/api/chat` | SSE streaming, LangGraph pipeline invocation, session persistence, quality scoring dispatch |
| `database.py` | `/api/database` | Document staging, ETL pipeline orchestration, corpus statistics, document deletion |
| `documents.py` | `/api/documents` | Chunk explorer, entity enumeration, document metadata, raw text preview |
| `history.py` | `/api/history` | Session CRUD - all state persisted in Neo4j, zero in-memory session state |

### Document ETL Pipeline

The ingestion pipeline is the most computationally intensive subsystem. It processes each uploaded document through seven sequential stages, with async parallelism within each stage where possible.

```
POST /api/database/stage
       │
       ▼
DocumentProcessor.process_document()
       │
       ├── Stage 1: Format Detection + Loader Dispatch
       │     MIME type detection + extension fallback
       │     Dispatches to format-specific loader:
       │       pdf_loader    (PyMuPDF primary, pytesseract OCR fallback)
       │       docx_loader   (python-docx, heading hierarchy preserved)
       │       pptx_loader   (python-pptx, all shape types extracted)
       │       xlsx_loader   (openpyxl, sheet-aware, numeric type detection)
       │       csv_loader    (smart delimiter inference)
       │       text_loader   (UTF-8, BOM handling, HTML stripping)
       │       image_loader  (pytesseract, confidence threshold filter)
       │
       ├── Stage 2: Adaptive Semantic Chunking
       │     RecursiveCharacterTextSplitter with ESG-optimised boundary hierarchy:
       │       paragraph boundary → sentence boundary → token boundary
       │     Window: 1,000 tokens · Overlap: 200 tokens
       │     Overlap preserves cross-boundary entity co-references
       │     and prevents context loss at section transitions
       │
       ├── Stage 3: Async Batch Embedding Generation
       │     Batched parallel requests to text-embedding-ada-002 (1,536 dims)
       │     Concurrency cap: 3 simultaneous requests (configurable)
       │     Exponential backoff with jitter on HTTP 429 (base 1s, max 60s)
       │     All chunk embeddings written atomically before graph ingestion
       │
       ├── Stage 4: LLM-Assisted Typed Named Entity Recognition
       │     Structured prompt with JSON schema enforcement
       │     Extracts typed entity classes:
       │       company · GHG metric · KPI target · regulatory framework
       │       scope category · ESG indicator · materiality topic
       │     Per-entity importance scoring (0.0-1.0) based on mention
       │     frequency, positional prominence, and cross-chunk co-occurrence
       │     Importance score used as graph edge weight in traversal scoring
       │
       ├── Stage 5: Relational Inference + Edge Construction
       │     Co-occurrence matrix computed over all (chunk, entity) pairs
       │     Cross-chunk entity pair scored by:
       │       co-occurrence frequency × semantic similarity of embeddings
       │     Pairs above configured threshold → RELATED_TO edges in Neo4j
       │     SIMILAR_TO edges written between chunk pairs above cosine threshold
       │
       ├── Stage 6: Document Summarisation + Taxonomy Generation
       │     Structured LLM prompt enforcing JSON output schema:
       │       { "summary": string, "hashtags": string[] }
       │     Hashtags normalised and mapped to Tag nodes
       │     TAGGED_WITH edges written for all assigned tags
       │
       └── Stage 7: Atomic Neo4j Ingestion
             Transaction-scoped writes:
               Document node → Chunk[] nodes (CONTAINS edges)
               Chunk nodes → Entity nodes (MENTIONS edges)
               Chunk ↔ Chunk (SIMILAR_TO, cosine > SIMILARITY_THRESHOLD)
               Entity ↔ Entity (RELATED_TO, co-occurrence + similarity)
             Vector embeddings stored as native Neo4j vector properties
             HNSW index updated automatically on node write
```

---

## 3. Graph Database Schema (`/core/graph_db.py`)

**Database:** Neo4j 5+ with Graph Data Science plugin · Official Python bolt driver

The property graph schema is the core structural asset of the platform. It was designed to model the natural ontology of ESG disclosures - not as a generic knowledge graph, but as a domain-specific schema that directly encodes the relationships that matter for CSRD compliance analysis.

### Node Schema

| Label | Properties | Purpose |
|---|---|---|
| `Document` | filename, file_type, char_count, chunk_count, entity_count, summary, hashtags[], embedding, created_at | Root document node; anchor for all derived structure |
| `Chunk` | text, token_count, position, document_id, embedding (1,536-dim) | Atomic retrieval unit; carries the vector index entry |
| `Entity` | name, entity_type, importance_score (0-1), embedding, mention_count, first_seen_at | Typed named entity; participates in graph traversal |
| `Summary` | text, document_id, generated_at | LLM-generated document-level abstract |
| `Tag` | name | Normalised hashtag taxonomy node |

### Relationship Schema

| Type | Cardinality | Properties | Semantics |
|---|---|---|---|
| `CONTAINS` | Document → Chunk (1:N) | position | Document membership; defines chunk ordering |
| `MENTIONS` | Chunk → Entity (N:M) | frequency, first_position | Named entity occurrence within a chunk |
| `SIMILAR_TO` | Chunk ↔ Chunk (N:M) | score (cosine) | Semantic similarity above configured threshold |
| `RELATED_TO` | Entity ↔ Entity (N:M) | weight, co_occurrence_count | Inferred relational proximity between entities |
| `MEASURED_BY` | Entity → Entity | - | Metric-to-methodology linkage |
| `COVERED_BY` | Entity → Document | - | Entity-to-source document provenance |
| `ALIGNS_WITH` | Entity → Entity | - | Framework alignment (e.g. Scope 2 → GHG Protocol) |
| `HAS_TARGET` | Entity → Entity | - | Metric-to-target linkage (e.g. emissions → SBTi target) |
| `HAS_SUMMARY` | Document → Summary | - | Summary attachment |
| `TAGGED_WITH` | Document → Tag | - | Taxonomy classification |

### Vector Index Definitions

```cypher
-- HNSW-backed ANN vector index on chunk embeddings
CREATE VECTOR INDEX chunk_embedding_index
  FOR (c:Chunk) ON c.embedding
  OPTIONS {
    indexConfig: {
      `vector.dimensions`: 1536,
      `vector.similarity_function`: 'cosine'
    }
  }

-- HNSW-backed ANN vector index on entity embeddings
CREATE VECTOR INDEX entity_embedding_index
  FOR (e:Entity) ON e.embedding
  OPTIONS {
    indexConfig: {
      `vector.dimensions`: 1536,
      `vector.similarity_function`: 'cosine'
    }
  }

-- B-tree lookup indexes for filter-first retrieval patterns
CREATE INDEX document_filename FOR (d:Document) ON (d.filename)
CREATE INDEX entity_name       FOR (e:Entity)   ON (e.name)
CREATE INDEX entity_type       FOR (e:Entity)   ON (e.entity_type)
CREATE INDEX chunk_document_id FOR (c:Chunk)    ON (c.document_id)
```

---

## 4. RAG Pipeline (`/rag`)

**Orchestrator:** LangGraph (`graph_rag.py`) - stateful directed acyclic graph of processing nodes.

LangGraph was selected over a linear LangChain chain for a specific reason: the retrieval pipeline is not a fixed sequence. Query intent determines which retrieval mode is optimal, and certain query types (simple factual lookups) can bypass the graph expansion node entirely without degrading answer quality. LangGraph's conditional edge routing enables this branching while maintaining a clean state contract between nodes. Each node receives the full typed pipeline state, returns a state delta, and LangGraph handles merging, retry orchestration, and execution tracing.

### Pipeline State Contract

```python
class PipelineState(TypedDict):
    query: str
    intent: str                    # factual | comparative | compliance | trend
    entities: list[str]            # extracted entity mentions
    frameworks: list[str]          # inferred ESG frameworks
    retrieval_mode: str            # hybrid | chunk_only | entity_only
    chunks: list[ChunkResult]      # ANN retrieval results
    seed_entities: list[Entity]    # entity index matches
    retrieval_scores: dict         # per-chunk composite scores
    expanded_chunks: list[ChunkResult]  # post-graph-expansion context
    entity_paths: list[EntityPath] # traversal paths for provenance
    graph_evidence: dict           # structured evidence from graph
    answer: str                    # streamed LLM completion
    citations: list[Citation]      # per-claim source annotations
    quality_scores: QualityReport  # five-dimension evaluation
    session_id: str
```

### Node Specifications

**`query_analysis.py` - Intent Classification and Entity Extraction**

The first node performs three operations before any retrieval occurs: intent classification, entity mention extraction, and framework inference. Intent determines the conditional routing downstream - comparative and compliance queries always invoke graph expansion; simple factual queries may bypass it.

- Intent classification via structured LLM prompt with four-class output schema
- Entity mention extraction: regex patterns for known ESG terminology, LLM fallback for ambiguous or novel references
- Framework inference from query vocabulary: presence of "ESRS", "GRI", "TCFD", "SBTi", "CDP" triggers framework-specific retrieval hints
- Output state delta: `{intent, entities[], frameworks[], retrieval_mode}`

**`retrieval.py` - Parallel Hybrid Retrieval**

Executes ANN vector search and entity graph lookup concurrently using async task parallelism. Both queries are issued simultaneously; results are awaited, merged, and de-duplicated before scoring.

- Query embedding generated and ANN search executed over `chunk_embedding_index` (top-K, default K=10)
- Entity index queried in parallel: exact name match → fuzzy match fallback for partial mentions
- Pre-retrieval filtering applied: document-level (`@document` operator) and tag-level (`#framework` operator) constraints pushed into the Cypher query as WHERE clauses, not post-hoc filters
- Chunk and entity results merged; duplicates collapsed by chunk ID; composite relevance score computed as weighted sum of vector similarity and entity co-occurrence weight
- Output state delta: `{chunks[], seed_entities[], retrieval_scores{}}`

**`graph_reasoning.py` - Multi-Hop Graph Traversal**

The graph reasoning node is what separates ESG Vision from a standard RAG system. It takes the seed entities identified by the retrieval node and expands them through the property graph, recovering evidence chains that share no semantic similarity with the original query but are structurally linked through the entity-relationship network.

- BFS/DFS traversal from each seed entity over `RELATED_TO`, `SIMILAR_TO`, `ALIGNS_WITH`, and `HAS_TARGET` edges
- Configurable hop depth (default: 2), branching factor cap to bound traversal complexity
- Each discovered node scored by composite function: `score = (1 / path_distance) × edge_weight × entity.importance_score`
- Chunk text retrieved for all newly surfaced nodes above score threshold; appended to context pool
- Full traversal paths preserved as `entity_paths[]` for provenance annotation in the generated response
- Output state delta: `{expanded_chunks[], entity_paths[], graph_evidence{}}`

**`generation.py` - Context Assembly and Streaming Generation**

Constructs the final context window from the merged, scored, and expanded evidence pool. Enforces a hard token budget to prevent context window overflow, selecting the highest-scoring chunks up to the limit.

- Chunks ranked by composite score; lowest-scoring chunks truncated if token budget exceeded
- Provenance metadata injected per chunk: source document, position, relevance score, entity path
- Structured system prompt with ESG domain instructions and citation format specification
- LLM called with streaming enabled; each token delta emitted immediately as an SSE event
- Response annotated post-generation: citation markers inserted at claim boundaries, linked to source chunk IDs
- Output: streamed `{token}` events → final state delta `{answer, citations[], session_id}`

**`quality_scoring.py` - Five-Dimension Answer Evaluation**

A dedicated evaluation pass runs after generation completes. The scorer applies both LLM-based and heuristic evaluation across five dimensions, producing a structured quality report surfaced in the UI as a per-response radar chart.

| Dimension | Evaluation Method | Signal |
|---|---|---|
| Context Relevance | LLM-judged | Do retrieved chunks address the query? |
| Factual Grounding | Heuristic + LLM | Are all claims traceable to a source chunk? |
| Completeness | LLM-judged | Does the response address all sub-questions in the query? |
| Coherence | Heuristic | Structural and logical consistency of the response |
| Citation Density | Heuristic | Ratio of cited claims to total claims |

### Retrieval Mode Routing

| Mode | Activation | Graph Expansion | Use Case |
|---|---|---|---|
| `hybrid` | Default; all queries | Yes | General ESG analysis, comparative queries |
| `chunk_only` | Intent: factual + no entity mentions | No | Simple definition lookups, single-document recall |
| `entity_only` | Intent: comparative or compliance | Yes, entity-anchored | Cross-document relationship and gap detection queries |

---

## 5. AI Model Layer (`/core`)

| Module | Responsibility | Default Configuration |
|---|---|---|
| `llm.py` | Chat completion, entity extraction, summarisation, quality evaluation | GPT-4o (production) / GPT-4o-mini (cost-optimised) |
| `embeddings.py` | Async batch text vectorisation | text-embedding-ada-002 (1,536 dims) |
| `entity_extraction.py` | Typed NER with structured JSON output and importance scoring | LLM with schema enforcement |
| `quality_scorer.py` | Five-dimension post-generation answer evaluation | LLM-judged + heuristic hybrid |

### Caching and Resilience

**LRU Cache:** In-memory cache (max 1,000 entries, TTL 1 hour) applied to both LLM completions and embedding outputs. Cache keys are SHA-256 hashes of the concatenated input string and model identifier - identical inputs across different sessions hit the cache without a network call.

**Rate-limit Handling:** HTTP 429 responses from upstream APIs trigger an exponential backoff scheduler with full jitter (base delay 1s, multiplier 2x, cap 60s, max 5 retries). Jitter prevents thundering-herd retry storms under sustained rate pressure.

**Provider Abstraction:** All LLM and embedding calls are dispatched through a provider interface that abstracts over OpenAI and Ollama backends. Switching `LLM_PROVIDER=ollama` reroutes all inference calls to a local Ollama HTTP server - enabling fully air-gapped deployment with no external API dependency and zero pipeline code changes.

---

## 6. Document Loader Layer (`/ingestion/loaders`)

Each loader is format-specific and returns a normalised `ParsedDocument` structure consumed by the downstream chunking stage. Format detection uses MIME type sniffing with extension fallback.

| Loader | Formats | Implementation Notes |
|---|---|---|
| `pdf_loader.py` | PDF | PyMuPDF text layer extraction; page-level quality scoring; pytesseract OCR invoked on pages below text confidence threshold; blank/corrupted page filter |
| `docx_loader.py` | DOC, DOCX | python-docx; heading hierarchy extracted as chunk boundary hints to prevent heading-body splits |
| `pptx_loader.py` | PPT, PPTX | python-pptx; iterates all slide shapes including tables, text boxes, and grouped elements |
| `xlsx_loader.py` | XLS, XLSX | openpyxl; sheet-aware parsing; numeric cell type detection used to tag KPI table rows for structured extraction |
| `csv_loader.py` | CSV | Sniffer-based delimiter detection (comma, semicolon, tab, pipe); header row inference with type annotation |
| `text_loader.py` | TXT, MD, HTML | UTF-8 with BOM handling; BeautifulSoup HTML tag stripping preserving text structure |
| `image_loader.py` | JPG, PNG, TIFF, BMP | pytesseract OCR; DPI normalisation; word confidence threshold filter to reject low-quality scans |

---

## 7. Infrastructure

### Docker Compose Service Topology

```yaml
services:
  neo4j:
    image: neo4j:latest
    ports: [7474, 7687]
    plugins: [graph-data-science]
    volumes: [data, logs, plugins]

  backend:
    build: Dockerfile.backend
    port: 8000
    depends_on: neo4j
    env: [OPENAI_API_KEY, NEO4J_*, LLM_PROVIDER, EMBEDDING_*, CHUNK_*, FEATURE_FLAGS]

  frontend:
    build: Dockerfile.frontend
    port: 3000
    depends_on: backend
    env: [NEXT_PUBLIC_USE_PROXY=true, BACKEND_URL=http://backend:8000]

networks:
  graphrag_network: bridge
```

All inter-service communication is routed through internal Docker DNS (`neo4j:7687`, `backend:8000`). The frontend proxy mode (`NEXT_PUBLIC_USE_PROXY=true`) routes all API calls through the Next.js server, ensuring the Neo4j port is never exposed to the browser and the backend URL never leaks to the client.

### Configuration Management

All runtime parameters are managed through `config/settings.py` using Pydantic `BaseSettings`. Every value - model selection, chunk size, similarity threshold, concurrency limits, feature flags - is injectable via environment variable or `.env` file. No configuration is hardcoded in application logic. This design enables zero-code environment promotion between local, staging, and production configurations.

---

## 8. Key Design Decisions

**Single graph database over separate vector store + relational database**

The conventional architecture for RAG systems uses a dedicated vector database (Pinecone, Weaviate, Qdrant) alongside a relational store for metadata. ESG Vision consolidates both into Neo4j, which natively supports HNSW vector indexes alongside its property graph. This eliminates an entire service from the infrastructure, removes the synchronisation problem between two data stores, and enables a single Cypher query to perform both vector similarity search and graph traversal in one round trip.

**LangGraph DAG over a sequential LangChain chain**

A linear chain cannot adapt its execution path to query intent. The LangGraph DAG enables conditional routing: simple factual queries bypass the graph expansion node, reducing latency; complex relational queries invoke the full pipeline. The stateful node contract also makes the pipeline fully introspectable - every node's input and output state is logged, which is essential for systematic retrieval quality debugging.

**SSE over WebSocket for streaming**

SSE is unidirectional, HTTP/1.1 compatible, trivially proxied by Next.js, and stateless at the transport layer. WebSockets introduce bidirectional session state with no architectural benefit for a request-response interaction model. SSE also provides natural reconnect semantics: if the connection drops mid-stream, the client reconnects to the session history endpoint and recovers the completed response without data loss.

**LLM-assisted NER over rule-based extraction**

ESG terminology is domain-specific, evolving, and highly context-dependent. Rule-based NER (spaCy, regex) achieves adequate recall on standardised terms but fails on novel framework references, company-specific metric names, and implicit entity mentions. LLM-based extraction with a structured JSON output schema achieves significantly higher precision on the long tail of ESG terminology at the cost of per-document inference latency - a trade-off appropriate for an ingestion pipeline where throughput is not latency-critical.

---

## 9. Current Constraints and Architectural Debt

| Constraint | Impact | Planned Resolution |
|---|---|---|
| No authentication layer | All API endpoints publicly accessible | JWT-based multi-tenant auth with per-org document isolation |
| In-memory document staging state | Backend restart during ingestion requires re-upload | Redis-backed staging queue with persistent job state |
| Single-node Neo4j | No horizontal read scaling; all graph state on one instance | Neo4j cluster with read replicas for query load distribution |
| Client-side full-graph rendering | Degrades above ~10,000 entity nodes | Server-side subgraph pagination with viewport-scoped queries |
| Synchronous quality scoring | Adds latency after generation completes | Async background scoring with progressive UI update |
