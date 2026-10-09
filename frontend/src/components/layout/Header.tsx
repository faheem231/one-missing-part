import React from 'react'
import { Cpu, RefreshCw, Radio, Server, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export interface HeaderProps {
  onRefresh?: () => Promise<void> | void
  isRefreshing?: boolean
  lastUpdated?: string
  isMockMode?: boolean
  onToggleMockMode?: () => void
  isBackendConnected?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing = false,
  lastUpdated = 'Just now',
  isMockMode = false,
  onToggleMockMode,
  isBackendConnected = false,
}) => {
  return (
    <header className="border-b border-[#2A303C] bg-[#15181F]/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase font-mono">
                  ONE MISSING PART
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222732] border border-[#2A303C] text-slate-300 font-normal">
                  Cypher Challenge 9
                </span>
                {isMockMode ? (
                  <Badge variant="warning" size="sm" showDot={false}>
                    DEV MOCK MODE
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm" pulseDot>
                    LIVE BACKEND
                  </Badge>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Manufacturing Operations Decision Support Console</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Backend Status, Mock Toggle, Refresh */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            {/* Backend URL status indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1E26] border border-[#2A303C] text-xs font-mono text-slate-300">
              <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-400">API:</span>
              <span className="text-slate-200 font-medium">localhost:8000</span>
              <span
                className={`w-2 h-2 rounded-full ml-1 ${
                  isBackendConnected ? 'bg-emerald-400' : 'bg-red-400'
                }`}
                title={isBackendConnected ? 'Connected to FastAPI' : 'Backend Disconnected'}
              />
            </div>

            {/* Mode toggle button */}
            {onToggleMockMode && (
              <button
                type="button"
                onClick={onToggleMockMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1E26] hover:bg-[#222732] border border-[#2A303C] text-xs font-mono text-slate-300 transition-colors cursor-pointer"
                title="Toggle between Live API and Isolated Mock Fixture Engine"
              >
                <Radio className={`w-3 h-3 ${isMockMode ? 'text-amber-400' : 'text-blue-400'}`} />
                <span>{isMockMode ? 'Use Live API' : 'Use Mock Data'}</span>
              </button>
            )}

            {/* Refresh Action */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className={isRefreshing ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />}
              title={`Synced ${lastUpdated}`}
            >
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
