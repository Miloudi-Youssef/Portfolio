'use client'

import ChatInterface from '@/components/Chat/ChatInterface'
import DocumentView from '@/components/Document/DocumentView'
import Sidebar from '@/components/Sidebar/Sidebar'
import { ThemeToggle } from '@/components/Theme/ThemeToggle'
import { useEffect, useState, useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function Home() {
  const activeView = useChatStore((state) => state.activeView)
  const clearChat = useChatStore((state) => state.clearChat)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleNewAnalysis = useCallback(() => {
    clearChat()
  }, [clearChat])
  const DEFAULT_WIDTH = 320
  const MIN_WIDTH = 260
  const MAX_WIDTH = 480
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)

  useEffect(() => {
    const storedWidth = typeof window !== 'undefined' ? window.localStorage.getItem('sidebar-width') : null
    if (storedWidth) {
      const parsed = parseInt(storedWidth, 10)
      if (!Number.isNaN(parsed)) {
        setSidebarWidth(Math.min(Math.max(parsed, MIN_WIDTH), MAX_WIDTH))
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sidebar-width', String(sidebarWidth))
    }
  }, [sidebarWidth])

  const clampWidth = (next: number) => Math.min(Math.max(next, MIN_WIDTH), MAX_WIDTH)

  return (
    <div className="flex h-screen bg-secondary-50 dark:bg-secondary-900">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        width={sidebarWidth}
  onWidthChange={(value) => setSidebarWidth(clampWidth(value))}
        minWidth={MIN_WIDTH}
        maxWidth={MAX_WIDTH}
      />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-300 min-w-0`}>
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-5 py-3 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="text-sm font-semibold text-secondary-800 dark:text-secondary-200">
              {activeView === 'document' ? 'Document Viewer' : 'ESG Intelligence Chat'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeView === 'chat' && (
              <button
                onClick={handleNewAnalysis}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors border border-primary-200 dark:border-primary-800"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                New Analysis
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          {activeView === 'document' ? <DocumentView /> : <ChatInterface />}
        </div>
      </main>
    </div>
  )
}
