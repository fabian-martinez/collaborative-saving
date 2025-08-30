import type {
  AccountType,
  LedgerOperationGroup,
  LedgerSummary,
  MeetingOption,
  MemberOption,
  GroupingMode,
  EntryRow,
  LedgerUITableGroup,
  OperationView,
  LedgerEntryEnrichedDTO,
  OperationEnrichedDTO,
  LedgerBackendFilters,
  PaginatedResponse,
  AccountTypeOption,
} from '@/features/ledger/types'
import { ledgerApi } from '@/services/api'
import { membersService } from '@/features/members/services/membersService'

// Helpers to normalize filters for backend
function normalizeDateStart(date?: string | null): string | undefined {
  if (!date) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date(`${date}T00:00:00`)
    return d.toISOString()
  }
  return date
}

function normalizeDateEnd(date?: string | null): string | undefined {
  if (!date) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date(`${date}T23:59:59`)
    return d.toISOString()
  }
  return date
}

function emptyToUndefined(value?: string | null): string | undefined {
  if (value === undefined || value === null) return undefined
  return String(value).trim() === '' ? undefined : String(value)
}

// Función helper para convertir LedgerEntryEnrichedDTO a EntryRow
function convertToEntryRow(entry: LedgerEntryEnrichedDTO): EntryRow {
  return {
    id: entry.id,
    operationId: entry.operationId,
    operationType: entry.operationType,
    operationDescription: entry.operationDescription,
    createdAt: entry.createdAt,
    accountType: entry.accountType as AccountType,
    amount: entry.amount,
    description: entry.description,
    memberId: entry.memberId,
    memberName: entry.memberName,
    meetingId: entry.meetingId,
    meetingDate: entry.meetingDate,
    loanId: entry.loanId,
    stockId: entry.stockId,
    mandatoryContributionId: entry.mandatoryContributionId,
    stockSubscriptionId: entry.stockSubscriptionId,
  }
}

// Función helper para convertir OperationEnrichedDTO a OperationView
function convertToOperationView(operation: OperationEnrichedDTO): OperationView {
  return {
    id: operation.id,
    memberId: operation.memberId,
    meetingId: operation.meetingId,
    date: operation.date,
    type: operation.type,
    description: operation.description,
    memberName: operation.member?.name || null,
    meetingDate: operation.date, // Usar la fecha de la operación como fecha de reunión
  }
}


// API Functions con fallback a mocks
export async function listOperations(filters?: Partial<LedgerBackendFilters>): Promise<PaginatedResponse<OperationView>> {
  console.log('[ledgerService] listOperations called with filters:', filters)

  try {
    console.log('[ledgerService] Using real API with filters:', filters)
    // Usar API real
    const response: PaginatedResponse<OperationEnrichedDTO> = await ledgerApi.getOperations({
      meetingId: emptyToUndefined(filters?.meetingId),
      memberId: emptyToUndefined(filters?.memberId),
      operationType: emptyToUndefined(filters?.operationType),
      dateFrom: normalizeDateStart(filters?.dateFrom),
      dateTo: normalizeDateEnd(filters?.dateTo),
      page: filters?.page || 1,
      limit: filters?.limit || 20,
    })
    
    console.log('[ledgerService] API response:', response)
    return {
      data: response.data.map(convertToOperationView),
      page: response.page,
      limit: response.limit,
      total: response.total,
    }
  } catch (error) {
    console.warn('Error fetching operations from API, falling back to mocks:', error)
    // No recursar en caso de error
    return { data: [], page: filters?.page || 1, limit: filters?.limit || 20, total: 0 }
  }
}

export async function listEntries(
  filters?: Partial<LedgerBackendFilters> & { search?: string }
): Promise<PaginatedResponse<EntryRow>> {
  console.log('[ledgerService] listEntries called with filters:', filters)

  try {
    console.log('[ledgerService] Using real API for entries with filters:', filters)
    // Usar API real
    const response: PaginatedResponse<LedgerEntryEnrichedDTO> = await ledgerApi.getLedgerEntries({
      memberId: emptyToUndefined(filters?.memberId),
      accountType: emptyToUndefined(filters?.accountType as string | undefined),
      meetingId: emptyToUndefined(filters?.meetingId),
      operationType: emptyToUndefined(filters?.operationType),
      page: filters?.page || 1,
      limit: filters?.limit || 20,
    })
    
    console.log('[ledgerService] API response for entries:', response)
    return {
      data: response.data.map(convertToEntryRow),
      page: response.page,
      limit: response.limit,
      total: response.total,
    }
  } catch (error) {
    console.warn('Error fetching ledger entries from API, falling back to mocks:', error)
    // No recursar en caso de error
    return { data: [], page: filters?.page || 1, limit: filters?.limit || 20, total: 0 }
  }
}

export async function getEntriesByOperation(operationId: string): Promise<EntryRow[]> {

  try {
    // Usar API real
    const response: LedgerEntryEnrichedDTO[] = await ledgerApi.getLedgerEntriesByOperation(operationId)
    return response.map(convertToEntryRow)
  } catch (error) {
    console.warn('Error fetching entries by operation from API, falling back to mocks:', error)
    // Fallback seguro en caso de error
    return []
  }
}

export async function getAccountTypeOptions(): Promise<AccountTypeOption[]> {

  try {
    // Usar API real
    const response: AccountTypeOption[] = await ledgerApi.getAccountTypes()
    return response
  } catch (error) {
    console.warn('Error fetching account types from API, falling back to mocks:', error)
    // Fallback seguro en caso de error
    return []
  }
}

// Funciones mock existentes (mantener compatibilidad)
export async function getMembers(): Promise<MemberOption[]> {
  
  try {
    const response = await membersService.getMembers()
    return response.map(member => ({
      id: member.id,
      name: member.name,
    }))
  } catch (error) {
    console.warn('Error fetching members from API, falling back to mocks:', error)
    return []
  }
}

export async function getMeetings(): Promise<MeetingOption[]> {
  
  try {
    const response = await ledgerApi.getMeetings({ limit: 100 }) // Obtener todas las reuniones
    const items = Array.isArray(response) ? response : (response?.data ?? [])
    return items.map((meeting: { id: string; date: string; status?: string }) => ({
      id: meeting.id,
      date: meeting.date,
    }))
  } catch (error) {
    console.warn('Error fetching meetings from API, falling back to mocks:', error)
    return []
  }
}

export function getOperationTypes(): string[] {
  // Sin mocks ni precarga local, devolvemos vacío por ahora
  return []
}

// Funciones de agrupación y resumen (mantener compatibilidad)
export function groupEntriesByOperation(entries: EntryRow[]): LedgerOperationGroup[] {
  const groups = new Map<string, LedgerOperationGroup>()
  
  for (const entry of entries) {
    if (!groups.has(entry.operationId)) {
      groups.set(entry.operationId, {
        operation: {
          id: entry.operationId,
          memberId: entry.memberId,
          meetingId: entry.meetingId,
          date: entry.createdAt,
          type: entry.operationType,
          description: entry.operationDescription,
          memberName: entry.memberName,
          meetingDate: entry.meetingDate,
        },
        entries: [],
      })
    }
    
    const group = groups.get(entry.operationId)!
    group.entries.push({
      id: entry.id,
      operationId: entry.operationId,
      accountType: entry.accountType,
      amount: entry.amount,
      description: entry.description,
      createdAt: entry.createdAt,
      loanId: entry.loanId,
      stockId: entry.stockId,
      mandatoryContributionId: entry.mandatoryContributionId,
      stockSubscriptionId: entry.stockSubscriptionId,
    })
  }
  
  return Array.from(groups.values())
}

export function calculateSummary(entries: EntryRow[]): LedgerSummary {
  const accountTypeTotals: Record<AccountType, number> = {} as Record<AccountType, number>
  let incomeTotal = 0
  let expenseTotal = 0
  
  for (const entry of entries) {
    const currentTotal = accountTypeTotals[entry.accountType] || 0
    accountTypeTotals[entry.accountType] = currentTotal + entry.amount
    
    if (entry.amount > 0) {
      incomeTotal += entry.amount
    } else {
      expenseTotal += Math.abs(entry.amount)
    }
  }
  
  return {
    accountTypeTotals,
    incomeTotal,
    expenseTotal,
  }
}

export function groupEntriesByAccount(entries: EntryRow[]): LedgerUITableGroup[] {
  const groups = new Map<AccountType, LedgerUITableGroup>()
  
  for (const entry of entries) {
    if (!groups.has(entry.accountType)) {
      groups.set(entry.accountType, {
        id: entry.accountType,
        title: entry.accountType, // Assuming ACCOUNT_TYPE_LABELS is not defined here, so use raw value
        entries: [],
        total: 0,
      })
    }
    
    const group = groups.get(entry.accountType)!
    group.entries.push(entry)
    group.total += entry.amount
  }
  
  return Array.from(groups.values())
}

export function groupEntriesByMember(entries: EntryRow[]): LedgerUITableGroup[] {
  const groups = new Map<string, LedgerUITableGroup>()
  
  for (const entry of entries) {
    if (!groups.has(entry.memberId)) {
      groups.set(entry.memberId, {
        id: entry.memberId,
        title: entry.memberName || `Member ${entry.memberId}`,
        entries: [],
        total: 0,
      })
    }
    
    const group = groups.get(entry.memberId)!
    group.entries.push(entry)
    group.total += entry.amount
  }
  
  return Array.from(groups.values())
}

export function groupEntriesByDate(entries: EntryRow[]): LedgerUITableGroup[] {
  const groups = new Map<string, LedgerUITableGroup>()
  
  for (const entry of entries) {
    const date = new Date(entry.createdAt).toLocaleDateString('es-CO')
    
    if (!groups.has(date)) {
      groups.set(date, {
        id: date,
        title: date,
        entries: [],
        total: 0,
      })
    }
    
    const group = groups.get(date)!
    group.entries.push(entry)
    group.total += entry.amount
  }
  
  return Array.from(groups.values())
}

export function groupEntriesByMeeting(entries: EntryRow[]): LedgerUITableGroup[] {
  const groups = new Map<string, LedgerUITableGroup>()
  
  for (const entry of entries) {
    if (!groups.has(entry.meetingId)) {
      groups.set(entry.meetingId, {
        id: entry.meetingId,
        title: `Meeting ${entry.meetingDate}`,
        entries: [],
        total: 0,
      })
    }
    
    const group = groups.get(entry.meetingId)!
    group.entries.push(entry)
    group.total += entry.amount
  }
  
  return Array.from(groups.values())
}

export function groupEntries(mode: GroupingMode, entries: EntryRow[]): LedgerUITableGroup[] {
  switch (mode) {
    case 'byOperation':
      return groupEntriesByOperation(entries).map(group => ({
        id: group.operation.id,
        title: `${group.operation.type} - ${group.operation.description}`,
        entries: group.entries.map(entry => ({
          ...entry,
          operationType: group.operation.type,
          operationDescription: group.operation.description,
        })) as EntryRow[],
        total: group.entries.reduce((sum, entry) => sum + entry.amount, 0),
      }))
    case 'byAccount':
      return groupEntriesByAccount(entries)
    case 'byMember':
      return groupEntriesByMember(entries)
    case 'byDate':
      return groupEntriesByDate(entries)
    case 'byMeeting':
      return groupEntriesByMeeting(entries)
    default:
      return []
  }
}


