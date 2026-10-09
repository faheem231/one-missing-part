import React from 'react'
import {
  AlertTriangle,
  DollarSign,
  Truck,
  Layers,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { CriticalShortageData } from '@/types/api'

export interface CriticalShortageCardProps {
  shortage: CriticalShortageData
}

export const CriticalShortageCard: React.FC<CriticalShortageCardProps> = ({ shortage }) => {
  return (
    <Card className="border-red-500/40 bg-[#1B1E26] shadow-card">
      <CardHeader
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="critical" pulseDot>
              {shortage.criticality} Shortage
            </Badge>
            <Badge variant="neutral" size="sm">
              Part ID: {shortage.componentId}
            </Badge>
          </div>
        }
      >
        <div className="flex items-center gap-2 text-red-400 text-xs font-mono font-bold">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>SECTION B — CRITICAL SHORTAGE DETAILS</span>
        </div>
        <CardTitle>{shortage.componentName}</CardTitle>
        <CardDescription>
          Category: {shortage.category} &bull; Primary Supplier: {shortage.supplierName} (Lead Time: {shortage.leadTimeDays} Days)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Inventory Quantities Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          {/* On Hand */}
          <div className="p-3.5 rounded-lg bg-[#222732] border border-[#2E343D] space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase">Qty On Hand</span>
            <span className="text-lg font-bold text-white">
              {shortage.quantityOnHand} <span className="text-xs text-slate-400 font-normal">{shortage.unit}</span>
            </span>
            <span className="text-slate-500 text-[10px] block">Gross Warehouse Physical</span>
          </div>

          {/* Reserved */}
          <div className="p-3.5 rounded-lg bg-[#222732] border border-[#2E343D] space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase">Reserved Stock</span>
            <span className="text-lg font-bold text-amber-400">
              {shortage.reservedQuantity} <span className="text-xs text-slate-400 font-normal">{shortage.unit}</span>
            </span>
            <span className="text-slate-500 text-[10px] block">Allocated to Active Line</span>
          </div>

          {/* Usable Stock */}
          <div className="p-3.5 rounded-lg bg-[#222732] border border-blue-500/30 space-y-1">
            <span className="text-blue-400 text-[10px] block uppercase font-semibold">Usable Stock</span>
            <span className="text-lg font-bold text-blue-400">
              {shortage.usableStock} <span className="text-xs text-slate-400 font-normal">{shortage.unit}</span>
            </span>
            <span className="text-slate-500 text-[10px] block">Free for Dispatch</span>
          </div>

          {/* Required Qty */}
          <div className="p-3.5 rounded-lg bg-[#222732] border border-[#2E343D] space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase">Required Qty</span>
            <span className="text-lg font-bold text-white">
              {shortage.requiredQuantity} <span className="text-xs text-slate-400 font-normal">{shortage.unit}</span>
            </span>
            <span className="text-slate-500 text-[10px] block">14-Day Bill of Materials</span>
          </div>

          {/* Shortage Deficit */}
          <div className="p-3.5 rounded-lg bg-[#201518] border border-red-500/40 space-y-1">
            <span className="text-red-400 text-[10px] block uppercase font-bold">Shortage Qty</span>
            <span className="text-lg font-bold text-red-400">
              -{shortage.shortageQuantity} <span className="text-xs text-slate-400 font-normal">{shortage.unit}</span>
            </span>
            <span className="text-red-400/70 text-[10px] block font-semibold">Immediate Deficit</span>
          </div>

          {/* Coverage Percent */}
          <div className="p-3.5 rounded-lg bg-[#222732] border border-[#2E343D] space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase">Coverage Ratio</span>
            <span className="text-lg font-bold text-amber-400">
              {shortage.inventoryCoveragePercentage}%
            </span>
            <span className="text-slate-500 text-[10px] block">Stock-to-Demand Ratio</span>
          </div>
        </div>

        {/* Shortage Cost & Value Exposure Callout */}
        <div className="p-4 rounded-lg bg-[#222732]/80 border border-[#2E343D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-white block uppercase">
                {shortage.costLabel}
              </span>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Contractual OEM late-delivery penalty risk calculated across all {shortage.affectedOrdersCount} delayed work orders if line halts.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl font-bold font-mono text-red-400">
              ${shortage.shortageCostUsd.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">USD Estimated Penalty</span>
          </div>
        </div>

        {/* Demand Breakdown by Production Order & Scheduled Date */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Component Demand Breakdown by Work Order & Scheduled Date
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {shortage.demandBreakdown.length} Orders Requiring CMP-8821
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#2A303C]">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#15181F] text-slate-400 uppercase text-[10px] border-b border-[#2A303C]">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Scheduled Date</th>
                  <th className="p-3 text-right">Required</th>
                  <th className="p-3 text-right">Allocated</th>
                  <th className="p-3 text-right">Shortage Deficit</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A303C] bg-[#1B1E26]">
                {shortage.demandBreakdown.map((row) => (
                  <tr key={row.orderId} className="hover:bg-[#222732]/60 transition-colors">
                    <td className="p-3 font-bold text-white">{row.orderNumber}</td>
                    <td className="p-3 text-slate-300 font-sans">{row.customerName}</td>
                    <td className="p-3 text-slate-400">{row.scheduledDate}</td>
                    <td className="p-3 text-right text-slate-200">{row.quantityRequired} units</td>
                    <td className="p-3 text-right text-emerald-400 font-semibold">{row.allocatedQuantity} units</td>
                    <td className="p-3 text-right text-red-400 font-bold">-{row.shortageQuantity} units</td>
                    <td className="p-3 text-center">
                      <Badge variant="critical" size="sm">
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <Truck className="w-4 h-4 text-cyan-400" />
          <span>Restock Logistics: In transit via Silicon Dynamics Air Express (ETA: Day 6)</span>
        </div>
        <span className="text-amber-400 font-mono font-semibold">Immediate Schedule Reordering Recommended</span>
      </CardFooter>
    </Card>
  )
}
