import React from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { Header } from './Header'
import { Button } from '@/components/ui/Button'

export interface DashboardLayoutProps {
  children: React.ReactNode
  isMockMode: boolean
  isBackendConnected: boolean
  isRefreshing: boolean
  lastUpdated: string
  errorMessage?: string | null
  onRefresh: () => Promise<void> | void
  onToggleMockMode: () => void
  onRetry?: () => void
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  isMockMode,
  isBackendConnected,
  isRefreshing,
  lastUpdated,
  errorMessage,
  onRefresh,
  onToggleMockMode,
  onRetry,
}) => {
  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-400">
      {/* Top Header */}
      <Header
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        isMockMode={isMockMode}
        onToggleMockMode={onToggleMockMode}
        isBackendConnected={isBackendConnected}
      />

      {/* API Status & Scenario Metadata Sub-Header */}
      <section className="border-b border-[#2A303C] bg-[#14171E] px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-mono">
          {/* Active Scenario Indicator */}
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider shrink-0">
              Active Horizon:
            </span>
            <span className="text-white font-semibold">
              Day 1 – Day 14 (Two-Week Window)
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-cyan-400">Assembly Line 1</span>
          </div>

          {/* Explicit Mode Banner */}
          <div className="flex items-center gap-3">
            {isMockMode ? (
              <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-md text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>Development Mock Mode</strong> (Simulated MRP fixtures active)
                </span>
              </div>
            ) : isBackendConnected ? (
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-md text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Connected to FastAPI backend (http://localhost:8000)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 px-3 py-1 rounded-md text-red-300">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>Backend unreachable (localhost:8000). Falling back to mock dataset.</span>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="underline text-white font-bold ml-1 cursor-pointer"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Global Error Banner (if any) */}
      {errorMessage && (
        <div className="bg-red-950/80 border-b border-red-500/40 px-4 py-3 text-xs font-mono text-red-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {onRetry && (
              <Button variant="danger" size="sm" onClick={onRetry}>
                Retry Sync
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Responsive Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {children}
      </main>

      {/* Dark Industrial Footer */}
      <footer className="border-t border-[#2A303C] bg-[#12141A] py-5 text-xs font-mono text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-200">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-white">ONE MISSING PART</span>
              <span className="text-slate-600">|</span>
              <span>Cypher Challenge 9</span>
            </div>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">
              Manufacturing Operations Decision Support Engine
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>FastAPI: <strong className="text-slate-300">http://localhost:8000</strong></span>
            <span>&bull;</span>
            <span>Mode: <strong className={isMockMode ? 'text-amber-400' : 'text-emerald-400'}>{isMockMode ? 'MOCK FIXTURES' : 'LIVE API'}</strong></span>
            <span>&bull;</span>
            <span>Last Sync: {lastUpdated}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
