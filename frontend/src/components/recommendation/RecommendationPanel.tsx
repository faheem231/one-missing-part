import React from 'react'
import {
  Award,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { RecommendationExplanation } from '@/types/api'

export interface RecommendationPanelProps {
  recommendation: RecommendationExplanation
  onSelectRecommended?: () => void
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendation,
  onSelectRecommended,
}) => {
  return (
    <Card className="border-emerald-500/40 bg-[#16201B] shadow-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />

      <CardHeader
        action={
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm" pulseDot>
              Recommended Plan
            </Badge>
          </div>
        }
      >
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>SECTION F — RECOMMENDED RESPONSE & DECISION EXPLANATION</span>
        </div>
        <CardTitle className="text-white text-lg sm:text-xl">
          {recommendation.recommendedStrategyName}
        </CardTitle>
        <CardDescription>
          Automated multi-objective Pareto optimization across inventory cost, SLA penalties, and plant run rate.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Why Ranked First Headline Banner */}
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Why This Strategy Ranked #1:</span>
          </div>
          <p className="text-sm font-sans text-slate-100 font-medium leading-relaxed">
            {recommendation.whyRankedFirst}
          </p>
        </div>

        {/* Supporting Metrics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-[#141A17] border border-emerald-500/20 space-y-0.5">
            <span className="text-[10px] uppercase text-slate-400 block">Feasible Units</span>
            <span className="text-lg font-bold text-white">
              {recommendation.feasibilityMetrics.feasibleUnits} <span className="text-xs text-emerald-400">(100%)</span>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#141A17] border border-emerald-500/20 space-y-0.5">
            <span className="text-[10px] uppercase text-slate-400 block">Extra Cost</span>
            <span className="text-lg font-bold text-emerald-400">
              ${recommendation.incrementalCost}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#141A17] border border-emerald-500/20 space-y-0.5">
            <span className="text-[10px] uppercase text-slate-400 block">Orders Protected</span>
            <span className="text-lg font-bold text-white">
              {recommendation.feasibilityMetrics.ordersProtected} Orders
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#141A17] border border-emerald-500/20 space-y-0.5">
            <span className="text-[10px] uppercase text-slate-400 block">Idle Time Avoided</span>
            <span className="text-lg font-bold text-emerald-400">
              +{recommendation.feasibilityMetrics.preventedStoppageHours} Hours
            </span>
          </div>
        </div>

        {/* Customer Delivery Impact & Key Assumptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          {/* Customer Impact */}
          <div className="p-4 rounded-lg bg-[#141A17] border border-[#2E343D] space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-mono font-bold text-xs uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Customer Delivery Impact</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {recommendation.customerDeliveryImpact}
            </p>
          </div>

          {/* Key Assumptions & Risks */}
          <div className="p-4 rounded-lg bg-[#141A17] border border-[#2E343D] space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-mono font-bold text-xs uppercase">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Key Risks & Operational Assumptions</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              {recommendation.keyRisksAndAssumptions.map((risk, index) => (
                <li key={index} className="leading-relaxed">
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Why Alternative Strategies Ranked Lower */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Alternative Strategy Comparison & Trade-Offs</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendation.alternativeTradeOffs.map((alt) => (
              <div
                key={alt.strategyId}
                className="p-3.5 rounded-lg bg-[#141A17] border border-[#2E343D] space-y-1 text-xs"
              >
                <div className="font-bold font-mono text-slate-200">{alt.strategyName}</div>
                <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                  {alt.reasonLowerRanked}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <span className="text-slate-400">
          Recommendation Algorithm: Constraint Satisfaction & Cost-SLA Heuristic (0.012s solve time)
        </span>
        {onSelectRecommended && (
          <Button
            variant="success"
            size="sm"
            onClick={onSelectRecommended}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Select & Approve Plan
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
