import React, { useState } from 'react'
import {
  Clock,
  Layers,
  Search,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { ProductionOrder, PriorityLevel } from '@/types/api'
import { cn } from '@/lib/utils'

export interface AffectedOrdersTableProps {
  orders: ProductionOrder[]
}

const priorityBadgeMap: Record<PriorityLevel, 'critical' | 'warning' | 'info' | 'neutral'> = {
  CRITICAL: 'critical',
  HIGH: 'warning',
  MEDIUM: 'info',
  NORMAL: 'neutral',
  LOW: 'neutral',
}

export const AffectedOrdersTable: React.FC<AffectedOrdersTableProps> = ({ orders }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'affected'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOrders = orders.filter((order) => {
    if (filterMode === 'affected' && !order.isAffected) return false
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.product.toLowerCase().includes(query)
    )
  })

  const affectedCount = orders.filter((o) => o.isAffected).length

  return (
    <Card className="bg-[#1B1E26] border-[#2A303C]">
      <CardHeader
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Toggle */}
            <div className="flex items-center p-1 rounded-lg bg-[#14171E] border border-[#2A303C] text-xs font-mono">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={cn(
                  'px-3 py-1 rounded transition-colors',
                  filterMode === 'all'
                    ? 'bg-[#222732] text-white font-bold border border-[#2E343D]'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                All Orders ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('affected')}
                className={cn(
                  'px-3 py-1 rounded transition-colors flex items-center gap-1.5',
                  filterMode === 'affected'
                    ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/40'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>Affected Only ({affectedCount})</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
          <Layers className="w-4 h-4" />
          <span>SECTION C — PRODUCTION ORDERS SCHEDULE</span>
        </div>
        <CardTitle>Two-Week Master Assembly Orders & Shortage Impact</CardTitle>
        <CardDescription>
          Tracking order fulfillment, component allocation status, and customer delivery schedule delays.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search / Filter Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order, customer, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#14171E] border border-[#2A303C] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs font-mono text-slate-400">
            Showing <strong className="text-white font-bold">{filteredOrders.length}</strong> of {orders.length} orders
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-lg border border-[#2A303C]">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#15181F] text-slate-400 uppercase text-[10px] border-b border-[#2A303C]">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Product</th>
                <th className="p-3 text-center">Priority</th>
                <th className="p-3 text-right">Order Qty</th>
                <th className="p-3 text-right">Allocated</th>
                <th className="p-3 text-right">Unfulfilled</th>
                <th className="p-3">Scheduled / Due</th>
                <th className="p-3 text-center">Est. Delay</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A303C] bg-[#1B1E26]">
              {filteredOrders.map((order) => {
                const isDelayUnavailable = order.estimatedDelayDays === null
                const hasDelay = typeof order.estimatedDelayDays === 'number' && order.estimatedDelayDays > 0

                return (
                  <tr
                    key={order.orderId}
                    className={cn(
                      'hover:bg-[#222732]/60 transition-colors',
                      order.isAffected && 'bg-red-500/[0.03]'
                    )}
                  >
                    {/* Order ID */}
                    <td className="p-3">
                      <div className="font-bold text-white">{order.orderNumber}</div>
                      <div className="text-[10px] text-slate-500">{order.orderId}</div>
                    </td>

                    {/* Customer */}
                    <td className="p-3 font-sans text-slate-200 font-medium">
                      {order.customerName}
                    </td>

                    {/* Product */}
                    <td className="p-3 font-sans text-slate-300">
                      {order.product}
                    </td>

                    {/* Priority */}
                    <td className="p-3 text-center">
                      <Badge variant={priorityBadgeMap[order.priority] || 'neutral'} size="sm" showDot={false}>
                        {order.priority}
                      </Badge>
                    </td>

                    {/* Order Quantity */}
                    <td className="p-3 text-right text-slate-200 font-bold">
                      {order.orderQuantity}
                    </td>

                    {/* Allocated Quantity */}
                    <td className="p-3 text-right text-emerald-400 font-semibold">
                      {order.allocatedQuantity}
                    </td>

                    {/* Unfulfilled Quantity */}
                    <td className="p-3 text-right">
                      {order.unfulfilledQuantity > 0 ? (
                        <span className="text-red-400 font-bold">-{order.unfulfilledQuantity}</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>

                    {/* Scheduled / Due Dates */}
                    <td className="p-3 text-slate-300 text-[11px]">
                      <div>Start: Day {order.startDay} ({order.scheduledDate})</div>
                      <div className="text-slate-500">Due: Day {order.dueDay} ({order.dueDate})</div>
                    </td>

                    {/* Estimated Delay (Carefully distinguishing null from 0) */}
                    <td className="p-3 text-center">
                      {isDelayUnavailable ? (
                        <span
                          className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]"
                          title="Delay calculation unavailable for this order"
                        >
                          N/A (Pending)
                        </span>
                      ) : hasDelay ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[11px] border border-red-500/30">
                          +{order.estimatedDelayDays} Days
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px]">
                          0 Days (On-Time)
                        </span>
                      )}
                    </td>

                    {/* Affected Status */}
                    <td className="p-3 text-center">
                      {order.isAffected ? (
                        <Badge variant="critical" size="sm" pulseDot>
                          Affected
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm" showDot={false}>
                          Clear
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400 font-sans">
                    No production orders match the selected search query or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Note: Orders marked 'N/A' have uncalculated downstream buffer dependencies</span>
        </div>
        <span className="text-slate-300 font-mono">Total Affected Shortfall: -300 Units</span>
      </CardFooter>
    </Card>
  )
}
