export interface ComponentShortage {
  id: string
  partNumber: string
  name: string
  category: string
  quantityOnHand: number
  quantityRequired: number
  deficit: number
  unit: string
  leadTimeDays: number
  supplierName: string
  estimatedRestockDay: number
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  affectedOrdersCount: number
  affectedOrderIds: string[]
  costExposureUsd: number
}

export interface ProductionOrder {
  id: string
  orderNumber: string
  customerName: string
  productModel: string
  batchSize: number
  startDay: number
  dueDay: number
  status: 'SCHEDULED' | 'BLOCKED' | 'IN_PROGRESS' | 'COMPLETED'
  missingParts: string[]
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL'
  penaltyPerDayUsd: number
}

export interface MitigationStrategy {
  id: string
  title: string
  description: string
  tag: string
  delayReductionDays: number
  costUsd: number
  feasibilityScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  badgeVariant: 'success' | 'warning' | 'info' | 'critical'
}

export interface ScenarioData {
  id: string
  scenarioName: string
  assemblyLine: string
  assemblyLineDescription: string
  planningHorizonStartDay: number
  planningHorizonEndDay: number
  planningHorizonDays: number
  openProductionOrdersCount: number
  deliveryRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  deliveryRiskPercentage: number
  criticalShortage: ComponentShortage
  productionOrders: ProductionOrder[]
  strategies: MitigationStrategy[]
  lineEfficiencyPercentage: number
  systemLatencyMs: number
}

export const mockScenarioData: ScenarioData = {
  id: 'SCENARIO-CC9-001',
  scenarioName: 'Dual-Source Microcontroller Shortage (Line 1, Day 4 Risk)',
  assemblyLine: 'Line 1',
  assemblyLineDescription: 'Automotive Powertrain & Electronic Control Unit Assembly',
  planningHorizonStartDay: 1,
  planningHorizonEndDay: 14,
  planningHorizonDays: 14,
  openProductionOrdersCount: 12,
  deliveryRiskLevel: 'CRITICAL',
  deliveryRiskPercentage: 82,
  lineEfficiencyPercentage: 94.6,
  systemLatencyMs: 14,

  criticalShortage: {
    id: 'PART-CMP-8821',
    partNumber: 'CMP-8821',
    name: 'Industrial Microcontroller Chip (32-bit Automotive MCU)',
    category: 'Electronic Control Modules',
    quantityOnHand: 150,
    quantityRequired: 450,
    deficit: 300,
    unit: 'units',
    leadTimeDays: 6,
    supplierName: 'Silicon Dynamics GmbH',
    estimatedRestockDay: 6,
    criticality: 'CRITICAL',
    affectedOrdersCount: 4,
    affectedOrderIds: ['ORD-9021', 'ORD-9022', 'ORD-9025', 'ORD-9028'],
    costExposureUsd: 28500,
  },

  productionOrders: [
    {
      id: 'ORD-9021',
      orderNumber: 'WO-8801',
      customerName: 'Apex Mobility Motors',
      productModel: 'EV Powertrain Module Pro',
      batchSize: 120,
      startDay: 4,
      dueDay: 6,
      status: 'BLOCKED',
      missingParts: ['CMP-8821'],
      priority: 'CRITICAL',
      penaltyPerDayUsd: 6500,
    },
    {
      id: 'ORD-9022',
      orderNumber: 'WO-8802',
      customerName: 'Nordic Auto Systems',
      productModel: 'Hybrid Inverter ECU Gen 3',
      batchSize: 100,
      startDay: 5,
      dueDay: 7,
      status: 'BLOCKED',
      missingParts: ['CMP-8821'],
      priority: 'CRITICAL',
      penaltyPerDayUsd: 5000,
    },
    {
      id: 'ORD-9025',
      orderNumber: 'WO-8805',
      customerName: 'Solaria EV Fleet',
      productModel: 'BMS High-Voltage Control Board',
      batchSize: 130,
      startDay: 7,
      dueDay: 9,
      status: 'BLOCKED',
      missingParts: ['CMP-8821'],
      priority: 'HIGH',
      penaltyPerDayUsd: 4200,
    },
    {
      id: 'ORD-9028',
      orderNumber: 'WO-8808',
      customerName: 'Quantum Dynamics Inc',
      productModel: 'Traction Drive Controller V2',
      batchSize: 100,
      startDay: 9,
      dueDay: 11,
      status: 'BLOCKED',
      missingParts: ['CMP-8821'],
      priority: 'HIGH',
      penaltyPerDayUsd: 3800,
    },
    {
      id: 'ORD-9010',
      orderNumber: 'WO-8790',
      customerName: 'Continental Transmissions',
      productModel: 'Hydraulic Actuator Unit',
      batchSize: 240,
      startDay: 1,
      dueDay: 3,
      status: 'IN_PROGRESS',
      missingParts: [],
      priority: 'NORMAL',
      penaltyPerDayUsd: 2000,
    },
    {
      id: 'ORD-9012',
      orderNumber: 'WO-8792',
      customerName: 'Vanguard Aerospace Tech',
      productModel: 'Auxiliary Power Inverter',
      batchSize: 180,
      startDay: 2,
      dueDay: 4,
      status: 'IN_PROGRESS',
      missingParts: [],
      priority: 'NORMAL',
      penaltyPerDayUsd: 2500,
    },
  ],

  strategies: [
    {
      id: 'STRAT-01',
      title: 'Batch Re-sequencing (Zero Penalty)',
      description: 'Promote Batch #WO-8790 & #WO-8792 forward, deferring blocked MCU assembly until Day 6 restock.',
      tag: 'Recommended',
      delayReductionDays: 3,
      costUsd: 0,
      feasibilityScore: 94,
      riskLevel: 'LOW',
      badgeVariant: 'success',
    },
    {
      id: 'STRAT-02',
      title: 'Air Expedited Split Shipment',
      description: 'Dispatch 150 units of CMP-8821 via express chartered air freight arriving Day 4 morning.',
      tag: 'Fastest Restock',
      delayReductionDays: 2,
      costUsd: 14200,
      feasibilityScore: 88,
      riskLevel: 'MEDIUM',
      badgeVariant: 'warning',
    },
    {
      id: 'STRAT-03',
      title: 'Alternate Part Substitution (CMP-8820 Spec)',
      description: 'Substitute with Tier-2 certified CMP-8820 from regional warehouse stock (350 units available).',
      tag: 'BOM Substitution',
      delayReductionDays: 3,
      costUsd: 2400,
      feasibilityScore: 82,
      riskLevel: 'LOW',
      badgeVariant: 'info',
    },
    {
      id: 'STRAT-04',
      title: 'Split Production Shift & Overtime Run',
      description: 'Run 2 extra weekend overtime shifts once parts land to compress assembly duration by 48 hours.',
      tag: 'Capacity Shift',
      delayReductionDays: 2,
      costUsd: 8900,
      feasibilityScore: 76,
      riskLevel: 'MEDIUM',
      badgeVariant: 'warning',
    },
  ],
}
