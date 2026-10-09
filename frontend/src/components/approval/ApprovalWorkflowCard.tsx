import React, { useState } from 'react'
import {
  AlertCircle,
  AlertOctagon,
  Check,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  XCircle,
  Info,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { StrategyOption, DecisionRecord, DecisionApprovalRequest } from '@/types/api'
import { submitDecisionApproval, resetSimulatedDecision } from '@/services/scenarioService'
import { ApiError } from '@/services/api'
import { cn } from '@/lib/utils'

export interface ApprovalWorkflowCardProps {
  strategies: StrategyOption[]
  selectedStrategyId: string
  onSelectStrategy: (strategyId: string) => void
  currentDecision: DecisionRecord | null
  onDecisionUpdated: (decision: DecisionRecord | null) => void
  isMockMode?: boolean
}

export const ApprovalWorkflowCard: React.FC<ApprovalWorkflowCardProps> = ({
  strategies,
  selectedStrategyId,
  onSelectStrategy,
  currentDecision,
  onDecisionUpdated,
  isMockMode = false,
}) => {
  const [reviewerNote, setReviewerNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const selectedStrategy = strategies.find((s) => s.id === selectedStrategyId) || strategies[0]
  const isDecisionRecorded = currentDecision !== null

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    setErrorMessage(null)
    setSuccessMessage(null)

    if (action === 'APPROVE' && !selectedStrategy.isFeasible) {
      setErrorMessage(
        `Validation Error: Strategy '${selectedStrategy.name}' is marked as infeasible by backend rules (${selectedStrategy.infeasibleReason || 'SLA violation'}) and cannot be approved.`
      )
      return
    }

    setIsSubmitting(true)

    try {
      const request: DecisionApprovalRequest = {
        strategyId: selectedStrategy.id,
        action,
        reviewerNote: reviewerNote.trim() || undefined,
      }

      const record = await submitDecisionApproval(request, isMockMode)
      onDecisionUpdated(record)
      setSuccessMessage(
        action === 'APPROVE'
          ? `Successfully recorded approval for '${selectedStrategy.name}'!`
          : `Recorded rejection for '${selectedStrategy.name}'.`
      )
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to record decision')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    resetSimulatedDecision()
    onDecisionUpdated(null)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  return (
    <Card className="bg-[#1B1E26] border-[#2A303C]">
      <CardHeader
        action={
          isDecisionRecorded ? (
            <Badge
              variant={currentDecision.status === 'APPROVED' ? 'success' : 'critical'}
              size="md"
              pulseDot
            >
              {currentDecision.status}: {currentDecision.strategyId}
            </Badge>
          ) : (
            <Badge variant="warning" size="sm">
              Pending Planner Review
            </Badge>
          )
        }
      >
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>SECTION G — DECISION APPROVAL & EXECUTION WORKFLOW</span>
        </div>
        <CardTitle>Planner Strategy Review & Operational Commitment</CardTitle>
        <CardDescription>
          Formal authorization of mitigation sequence shift for Assembly Line 1.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selected Strategy Review Summary */}
        <div className="p-4 rounded-xl bg-[#222732] border border-[#2E343D] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                Target Action Strategy:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-white font-mono">
                  {selectedStrategy.id}: {selectedStrategy.name}
                </span>
                {selectedStrategy.isRecommended && (
                  <Badge variant="success" size="sm">
                    Recommended
                  </Badge>
                )}
                {!selectedStrategy.isFeasible && (
                  <Badge variant="critical" size="sm">
                    Infeasible
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span>Cost: <strong className="text-emerald-400">${selectedStrategy.incrementalCost}</strong></span>
              <span>&bull;</span>
              <span>Delay: <strong className="text-white">{selectedStrategy.totalDelayDays ?? 'N/A'} Days</strong></span>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {selectedStrategy.description}
          </p>

          {!selectedStrategy.isFeasible && selectedStrategy.infeasibleReason && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 font-sans">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong className="font-mono">Infeasibility Warning:</strong> {selectedStrategy.infeasibleReason}
              </span>
            </div>
          )}
        </div>

        {/* Strategy Selector Pills (when permitted) */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
            Select Countermeasure:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {strategies.map((strat) => (
              <button
                key={strat.id}
                type="button"
                onClick={() => {
                  onSelectStrategy(strat.id)
                  setErrorMessage(null)
                }}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all font-mono text-xs cursor-pointer',
                  selectedStrategyId === strat.id
                    ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-sm shadow-blue-500/20'
                    : 'bg-[#14171E] border-[#2A303C] text-slate-400 hover:text-slate-200 hover:bg-[#1A1E26]'
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{strat.id}</span>
                  {strat.isRecommended && <span className="text-[10px] text-emerald-400">#1 Top</span>}
                </div>
                <div className="font-sans font-medium text-[11px] truncate mt-1 text-slate-300">
                  {strat.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Reviewer Note Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span>Reviewer Authorization Note (Optional):</span>
            <span className="text-[10px] text-slate-500 font-normal">Recorded in audit log</span>
          </label>
          <textarea
            rows={2}
            value={reviewerNote}
            onChange={(e) => setReviewerNote(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., Sequence swap approved after plant supervisor sign-off on Tooling Changeover for Batch #WO-8810."
            className="w-full p-3 rounded-lg bg-[#14171E] border border-[#2A303C] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Feedback Alerts: Error / Success Message */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-500/50 text-xs text-red-300 flex items-start gap-2.5 font-sans">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-950/50 border border-emerald-500/50 text-xs text-emerald-300 flex items-start gap-2.5 font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Recorded Approval Card (if already decided) */}
        {isDecisionRecorded && (
          <div className="p-4 rounded-xl bg-[#15241C] border border-emerald-500/40 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-emerald-400 font-bold uppercase text-[11px]">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Decision Record Logged: {currentDecision.decisionId}</span>
              </span>
              <span>{new Date(currentDecision.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="text-slate-200">
              Action: <strong className="text-white">{currentDecision.action}</strong> on strategy{' '}
              <strong className="text-emerald-300">{currentDecision.strategyName}</strong>
            </div>
            {currentDecision.reviewerNote && (
              <div className="text-slate-400 text-[11px] font-sans">
                Note: "{currentDecision.reviewerNote}"
              </div>
            )}
            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
              <span>Authorized by: {currentDecision.approvedBy}</span>
              {currentDecision.isSimulated && (
                <span className="text-amber-400/80">Simulated Hackathon Run</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="success"
              size="md"
              onClick={() => handleAction('APPROVE')}
              isLoading={isSubmitting}
              disabled={isSubmitting || !selectedStrategy.isFeasible}
              leftIcon={<Check className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Approve Strategy
            </Button>

            <Button
              variant="danger"
              size="md"
              onClick={() => handleAction('REJECT')}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              leftIcon={<XCircle className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Reject Option
            </Button>
          </div>

          {isDecisionRecorded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-slate-400 hover:text-white"
            >
              Reset Decision
            </Button>
          )}
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-sans">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            Simulated Workflow Disclaimer: This is an operations planning decision-support simulation. Real supplier and physical command dispatches are simulated.
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
