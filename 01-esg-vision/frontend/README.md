# ESG Vision — Frontend

Next.js 14 frontend for the ESG Vision Knowledge Graph Assistant. Built with TypeScript and Tailwind CSS.

## Features

- ✨ **Modern Chat Interface** - Beautiful, responsive chat UI with real-time streaming
- 🔄 **Message Streaming** - Real-time token-by-token response streaming
- 💡 **Follow-up Questions** - AI-generated follow-up question suggestions
- 📚 **Chat History** - Persistent conversation history with Neo4j
- 📁 **File Upload** - Drag-and-drop document upload with progress tracking
- 🔍 **Source Citations** - Inline source display with relevance scores
- ⚡ **Quality Scoring** - Real-time answer quality assessment
- 📊 **Database Management** - View stats and manage documents
- 🎨 **State-of-the-art UI** - Clean, modern design with smooth animations

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Markdown**: React Markdown with GFM support
- **Backend**: FastAPI with SSE streaming
- **Database**: Neo4j for chat history and documents

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Neo4j database
- Backend API running (see backend setup)

### Installation

1. **Install dependencies:**

```bash
cd frontend
npm install
```

2. **Configure environment:**

```bash
cp .env.local.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL
```

3. **Run development server:**

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm start
```

## Backend Setup

The frontend requires the FastAPI backend to be running:

```bash
cd ..  # Return to project root
source .venv/bin/activate
python api/main.py
```

The API will be available at `http://localhost:8000`.

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── Chat/         # Chat interface components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── SourcesList.tsx
│   │   │   ├── QualityBadge.tsx
│   │   │   ├── FollowUpQuestions.tsx
│   │   │   └── LoadingIndicator.tsx
│   │   └── Sidebar/      # Sidebar components
│   │       ├── Sidebar.tsx
│   │       ├── HistoryTab.tsx
│   │       ├── UploadTab.tsx
│   │       └── DatabaseTab.tsx
│   ├── lib/              # Utilities
│   │   └── api.ts        # API client
│   └── types/            # TypeScript types
│       └── index.ts
├── public/               # Static assets
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Features Overview

### Chat Interface

- Real-time message streaming with SSE
- Markdown support with syntax highlighting
- Inline source citations with expandable content
- Quality score badges for responses
- Follow-up question suggestions

### Chat History

- View all conversation sessions
- Session preview and metadata
- Delete individual conversations
- Clear all history

### File Upload

- Drag-and-drop or click to upload
- Support for PDF, DOCX, TXT, MD, PPT, XLS
- Upload progress and status
- Success/error feedback

### Database Management

- View database statistics
- Document list with chunk counts
- Delete individual documents
- Clear entire database

## API Integration

The frontend communicates with the FastAPI backend through REST endpoints and SSE:

- `POST /api/chat/query` - Send chat messages (SSE streaming)
- `GET /api/history/sessions` - List conversation sessions
- `GET /api/history/{session_id}` - Get conversation details
- `DELETE /api/history/{session_id}` - Delete conversation
- `POST /api/database/upload` - Upload document
- `GET /api/database/stats` - Get database statistics
- `DELETE /api/database/documents/{id}` - Delete document

## Customization

### Styling

Edit `tailwind.config.js` to customize colors, fonts, and theme:

```javascript
theme: {
  extend: {
    colors: {
      primary: { /* your colors */ },
      secondary: { /* your colors */ },
    },
  },
}
```

### API URL

Set the backend API URL in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://your-api-url:8000
```

## Development

### Hot Reload

Next.js provides fast refresh during development. Changes to components will hot-reload instantly.

### Type Safety

The project uses TypeScript for full type safety. Types are defined in `src/types/index.ts`.

### Linting

```bash
npm run lint
```

## Deployment

### Docker

Build and run with Docker:

```bash
docker build -t graphrag-frontend .
docker run -p 3000:3000 graphrag-frontend
```

### Vercel

The easiest way to deploy is using Vercel:

```bash
npm install -g vercel
vercel
```

## Troubleshooting

### API Connection Issues

- Ensure the backend API is running
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS settings in the backend

### Build Errors

- Clear `.next` directory: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`

## License

MIT License - see LICENSE file for details
