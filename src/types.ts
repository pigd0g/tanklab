export type SourceWater = 'tap' | 'ro' | 'rain' | 'well' | 'spring' | 'other'

export const SOURCE_WATER_LABELS: Record<SourceWater, string> = {
  tap: 'Tap',
  ro: 'RO / distilled',
  rain: 'Rainwater',
  well: 'Well water',
  spring: 'Spring water',
  other: 'Other',
}

export type MaintenanceType =
  | 'waterChange'
  | 'filterClean'
  | 'mediaReplaced'
  | 'substrate'
  | 'plantTrim'
  | 'fertiliser'
  | 'rootTabs'
  | 'conditioner'
  | 'bacteria'
  | 'medication'
  | 'equipment'
  | 'ammoniaDose'
  | 'other'

export const MAINTENANCE_LABELS: Record<MaintenanceType, string> = {
  waterChange: 'Water change',
  filterClean: 'Filter clean',
  mediaReplaced: 'Filter media replaced',
  substrate: 'Gravel / substrate clean',
  plantTrim: 'Plant trimming',
  fertiliser: 'Fertiliser added',
  rootTabs: 'Root tabs replaced',
  conditioner: 'Water conditioner',
  bacteria: 'Bacteria / starter',
  medication: 'Medication',
  equipment: 'Equipment maintenance',
  ammoniaDose: 'Ammonia dose',
  other: 'Other',
}

export type LivestockSubtype = 'added' | 'death' | 'breeding' | 'observation'

export type FishlessCycle = {
  startedAt: string
  dosePpm: number | null
  completedAt: string | null
}

export type MaintScheduleItem = {
  id: string
  type: MaintenanceType
  intervalDays: number
  note?: string
}

export type Tank = {
  id: string
  name: string
  volumeL: number | null
  photo?: string | null
  setupDate: string | null
  sourceWater: SourceWater | null
  feedingSchedule: { timesPerDay: number; note?: string } | null
  established?: boolean
  cycling?: FishlessCycle | null
  maintenanceSchedule?: MaintScheduleItem[]
  createdAt: string
}

export type EntryKind = 'test' | 'waterChange' | 'maintenance' | 'feeding' | 'livestock'

export type Entry = {
  id: string
  tankId: string
  date: string
  kind: EntryKind
  note?: string

  // test
  ammonia?: number | null
  nitrite?: number | null
  nitrate?: number | null
  phosphate?: number | null
  ph?: number | null
  waterTemp?: number | null
  roomTemp?: number | null

  // water change
  percent?: number | null
  litersRemoved?: number | null
  litersAdded?: number | null
  sourceWater?: SourceWater | null

  // maintenance
  maintenanceType?: MaintenanceType

  // feeding
  food?: string | null
  amount?: string | null

  // livestock
  subtype?: LivestockSubtype
  species?: string | null
  count?: number | null
}

export type Units = 'metric' | 'imperial'

export type AppData = {
  version: number
  tanks: Tank[]
  entries: Entry[]
  settings: { units: Units }
}
