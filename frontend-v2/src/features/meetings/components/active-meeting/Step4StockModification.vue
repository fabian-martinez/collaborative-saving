<template>
  <div class="h-full flex flex-col min-h-0 overflow-hidden">
    <div v-if="isLoadingMembers" class="flex justify-center items-center py-12 flex-1">
      <span class="loading loading-spinner loading-lg text-teal-700"></span>
    </div>

    <div v-if="memberError && !isLoadingMembers" class="alert alert-error mb-4 shadow-sm flex-shrink-0">
      <WarningTriangle class="shrink-0 h-6 w-6" />
      <span>{{ memberError }}</span>
    </div>

    <div v-if="!isLoadingMembers && !memberError" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0 overflow-hidden">
      <!-- Panel Izquierdo (Workspace Principal) - 8 Columnas -->
      <div class="lg:col-span-8 card bg-base-100 border border-base-200 shadow-sm rounded-xl p-4 md:p-5 flex flex-col h-full min-h-0 overflow-hidden">
        
        <!-- Caso 1: Detalle de operación seleccionada -->
        <div v-if="stockModification.selectedOperation.value" class="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="flex justify-between items-center mb-4 flex-shrink-0">
            <div>
              <h2 class="text-xl font-bold">Detalle de Operaciones</h2>
              <p v-if="selectedMember" class="text-xs text-base-content/60">Socio: {{ selectedMember.name }}</p>
            </div>
            <button class="btn btn-outline btn-sm rounded-lg" @click="closeOperationDetail">Regresar</button>
          </div>
          <div class="flex-1 overflow-auto space-y-4">
            <div 
              v-for="op in getSelectedMemberOperations()" 
              :key="op.id"
              class="card bg-base-200/40 border border-base-200 p-4 rounded-xl space-y-3"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-bold text-sm text-base-content">{{ op.description || op.type }}</h4>
                  <p class="text-xs text-base-content/60">{{ formatDate(op.date) }}</p>
                </div>
                <span class="font-mono font-bold text-sm text-teal-700">{{ formatCurrency(op.total_amount) }}</span>
              </div>
              <OperationDetails :operation="op" />
            </div>
          </div>
        </div>

        <!-- Caso 2: Recibo de Modificación (Intercambio) en curso -->
        <div v-else-if="stockModification.showModificationReceipt.value" class="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 class="text-xl font-bold">Modificación de Acciones</h2>
            <button class="btn btn-outline btn-sm rounded-lg" @click="cancelModification">Cancelar</button>
          </div>
          
          <div class="space-y-4 flex-1 overflow-auto" v-if="stockModification.modificationReceipt.value">
            <div class="bg-base-200 p-4 rounded-xl">
              <h3 class="font-semibold mb-2">Detalle del intercambio</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <h4 class="font-medium text-error">Entregar:</h4>
                  <p class="text-lg">{{ stockModification.modificationReceipt.value.fromStockType }}</p>
                  <p class="text-sm text-base-content/70">
                    {{ stockModification.modificationReceipt.value.fromQuantity }} uds. x $
                    <CopyOnDblClickNumber :value="stockModification.modificationReceipt.value.fromUnitValue" />
                  </p>
                  <p class="font-mono text-lg text-error">-{{ formatCurrency(stockModification.modificationReceipt.value.fromValue) }}</p>
                </div>
                <div>
                  <h4 class="font-medium text-success">Recibir:</h4>
                  <p class="text-lg">{{ stockModification.modificationReceipt.value.toStockType }}</p>
                  <p class="text-sm text-base-content/70">
                    {{ stockModification.modificationReceipt.value.toQuantity }} uds. x $
                    <CopyOnDblClickNumber :value="stockModification.modificationReceipt.value.toUnitValue" />
                  </p>
                  <p class="font-mono text-lg text-success">+{{ formatCurrency(stockModification.modificationReceipt.value.toValue) }}</p>
                </div>
              </div>
            </div>
            
            <div class="bg-base-200 p-4 rounded-xl">
              <h3 class="font-semibold mb-2">Diferencia</h3>
              <div class="flex items-center justify-between">
                <span class="text-lg">{{ stockModification.modificationReceipt.value.difference >= 0 ? 'A favor del socio:' : 'Debe pagar:' }}</span>
                <span class="font-mono text-2xl font-bold" :class="stockModification.modificationReceipt.value.difference >= 0 ? 'text-success' : 'text-error'">
                  {{ stockModification.modificationReceipt.value.difference >= 0 ? '+' : '-' }}{{ formatCurrency(Math.abs(stockModification.modificationReceipt.value.difference)) }}
                </span>
              </div>
              
              <div class="mt-4">
                <h4 class="font-medium mb-2">Manejo de la diferencia:</h4>
                <p class="text-sm">{{ stockModification.modificationReceipt.value.differenceHandling }}</p>
              </div>
            </div>
            
            <div class="flex items-baseline text-2xl font-bold">
              <span class="flex-shrink-0">Operación neta:</span>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <span class="flex-shrink-0 text-primary font-mono">{{ formatCurrency(Math.abs(stockModification.modificationReceipt.value.difference)) }}</span>
            </div>
          </div>
          
          <div class="text-right mt-6 flex-shrink-0">
            <button class="btn btn-success btn-block md:w-auto md:px-12 rounded-lg" @click="confirmModification" :disabled="stockModification.isProcessing.value">
              <span v-if="stockModification.isProcessing.value" class="loading loading-spinner loading-xs mr-2"></span>
              <span v-if="!stockModification.isProcessing.value">Confirmar Modificación</span>
              <span v-else>Procesando...</span>
            </button>
          </div>
        </div>

        <!-- Caso 3: Recibo de Transferencia en curso -->
        <div v-else-if="stockModification.showTransferReceipt.value" class="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 class="text-xl font-bold">Transferencia de Acciones</h2>
            <button class="btn btn-outline btn-sm rounded-lg" @click="cancelTransfer">Cancelar</button>
          </div>
          
          <div class="space-y-4 flex-1 overflow-auto" v-if="stockModification.transferReceipt.value">
            <div class="bg-base-200 p-4 rounded-xl">
              <h3 class="font-semibold mb-2">Detalle de la transferencia</h3>
              <div class="flex items-baseline">
                <div class="flex-shrink-0">
                  <p class="font-semibold text-xl">{{ stockModification.transferReceipt.value.stockType }}</p>
                  <p class="text-sm text-base-content/70">
                    {{ stockModification.transferReceipt.value.quantity }} uds. x $
                    <CopyOnDblClickNumber :value="stockModification.transferReceipt.value.unitValue" />
                  </p>
                  <p class="text-sm text-base-content/70 mt-2">De: {{ selectedMemberName }}</p>
                  <p class="text-sm text-base-content/70">Para: {{ stockModification.transferReceipt.value.toMemberName }}</p>
                </div>
                <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                <div class="flex-shrink-0">
                  <p class="w-36 text-right font-mono text-2xl font-bold text-teal-700">{{ formatCurrency(stockModification.transferReceipt.value.totalValue) }}</p>
                </div>
              </div>
            </div>
            
            <div class="flex items-baseline text-2xl font-bold">
              <span class="flex-shrink-0">Total a transferir:</span>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <span class="flex-shrink-0 text-primary font-mono">{{ formatCurrency(stockModification.transferReceipt.value.totalValue) }}</span>
            </div>
          </div>
          
          <div class="text-right mt-6 flex-shrink-0">
            <button class="btn btn-success btn-block md:w-auto md:px-12 rounded-lg" @click="confirmTransfer" :disabled="stockModification.isProcessing.value">
              <span v-if="stockModification.isProcessing.value" class="loading loading-spinner loading-xs mr-2"></span>
              <span v-if="!stockModification.isProcessing.value">Confirmar Transferencia</span>
              <span v-else>Procesando...</span>
            </button>
          </div>
        </div>

        <!-- Caso 4: Recibo de Pago de Crédito con Acciones -->
        <div v-else-if="stockModification.showLoanPaymentReceipt.value" class="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 class="text-xl font-bold">Pago de Crédito con Acciones</h2>
            <button class="btn btn-outline btn-sm rounded-lg" @click="cancelLoanPayment">Cancelar</button>
          </div>
          
          <div class="space-y-4 flex-1 overflow-auto" v-if="stockModification.loanPaymentReceipt.value">
            <div class="bg-base-200 p-4 rounded-xl">
              <h3 class="font-semibold mb-2">Detalle del pago</h3>
              <div class="flex items-baseline">
                <div class="flex-shrink-0">
                  <p class="font-semibold text-xl">{{ stockModification.loanPaymentReceipt.value.stockType }}</p>
                  <p class="text-sm text-base-content/70">
                    {{ stockModification.loanPaymentReceipt.value.quantity }} uds. x $
                    <CopyOnDblClickNumber :value="stockModification.loanPaymentReceipt.value.unitValue" />
                  </p>
                  <p class="text-sm text-base-content/70 mt-2">Crédito: {{ stockModification.loanPaymentReceipt.value.loanType }}</p>
                </div>
                <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                <div class="flex-shrink-0">
                  <p class="w-36 text-right font-mono text-2xl font-bold text-teal-700">{{ formatCurrency(stockModification.loanPaymentReceipt.value.totalValue) }}</p>
                </div>
              </div>
            </div>
            
            <div class="bg-base-200 p-4 rounded-xl">
              <h3 class="font-semibold mb-2">Impacto en el crédito</h3>
              <div class="space-y-2">
                <div class="flex justify-between text-xs">
                  <span>Saldo actual:</span>
                  <span class="font-mono">{{ formatCurrency(stockModification.loanPaymentReceipt.value.currentBalance) }}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span>Abono:</span>
                  <span class="font-mono text-success">-{{ formatCurrency(stockModification.loanPaymentReceipt.value.totalValue) }}</span>
                </div>
                <div class="border-t border-base-300/50 pt-2 flex justify-between font-bold text-sm">
                  <span>Nuevo saldo:</span>
                  <span class="font-mono" :class="stockModification.loanPaymentReceipt.value.newBalance > 0 ? 'text-warning' : 'text-success'">
                    {{ formatCurrency(stockModification.loanPaymentReceipt.value.newBalance) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex items-baseline text-2xl font-bold">
              <span class="flex-shrink-0">Total aplicado:</span>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <span class="flex-shrink-0 text-primary font-mono">{{ formatCurrency(stockModification.loanPaymentReceipt.value.totalValue) }}</span>
            </div>
          </div>
          
          <div class="text-right mt-6 flex-shrink-0">
            <button class="btn btn-success btn-block md:w-auto md:px-12 rounded-lg" @click="confirmLoanPayment" :disabled="stockModification.isProcessing.value">
              <span v-if="stockModification.isProcessing.value" class="loading loading-spinner loading-xs mr-2"></span>
              <span v-if="!stockModification.isProcessing.value">Confirmar Pago</span>
              <span v-else>Procesando...</span>
            </button>
          </div>
        </div>

        <!-- Caso 5: Recibo de Pago de Crédito con Efectivo -->
        <div v-else-if="stockModification.showCashLoanPaymentReceipt.value" class="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 class="text-xl font-bold">Abono a Crédito con Efectivo</h2>
            <button class="btn btn-outline btn-sm rounded-lg" @click="cancelCashLoanPayment">Cancelar</button>
          </div>
          
          <div class="space-y-4 flex-1 overflow-auto" v-if="stockModification.cashLoanPaymentReceipt.value">
            <div class="bg-base-200 p-4 rounded-xl">
              <h3 class="font-semibold mb-2">Detalle del pago</h3>
              <div class="flex items-baseline">
                <div class="flex-shrink-0">
                  <p class="font-semibold text-xl">Efectivo</p>
                  <p class="text-sm text-base-content/70">Crédito: {{ stockModification.cashLoanPaymentReceipt.value.loanType }}</p>
                </div>
                <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                <div class="flex-shrink-0">
                  <p class="w-36 text-right font-mono text-2xl font-bold text-teal-700">{{ formatCurrency(stockModification.cashLoanPaymentReceipt.value.paymentAmount) }}</p>
                </div>
              </div>
            </div>
            
            <div class="bg-base-200 p-4 rounded-xl">
              <h3 class="font-semibold mb-2">Impacto en el crédito</h3>
              <div class="space-y-2">
                <div class="flex justify-between text-xs">
                  <span>Saldo actual:</span>
                  <span class="font-mono">{{ formatCurrency(stockModification.cashLoanPaymentReceipt.value.currentBalance) }}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span>Abono:</span>
                  <span class="font-mono text-success">-{{ formatCurrency(stockModification.cashLoanPaymentReceipt.value.paymentAmount) }}</span>
                </div>
                <div class="border-t border-base-300/50 pt-2 flex justify-between font-bold text-sm">
                  <span>Nuevo saldo:</span>
                  <span class="font-mono" :class="stockModification.cashLoanPaymentReceipt.value.newBalance > 0 ? 'text-warning' : 'text-success'">
                    {{ formatCurrency(stockModification.cashLoanPaymentReceipt.value.newBalance) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex items-baseline text-2xl font-bold">
              <span class="flex-shrink-0">Total aplicado:</span>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <span class="flex-shrink-0 text-primary font-mono">{{ formatCurrency(stockModification.cashLoanPaymentReceipt.value.paymentAmount) }}</span>
            </div>
          </div>
          
          <div class="text-right mt-6 flex-shrink-0">
            <button class="btn btn-success btn-block md:w-auto md:px-12 rounded-lg" @click="confirmCashLoanPayment" :disabled="stockModification.isProcessing.value">
              <span v-if="stockModification.isProcessing.value" class="loading loading-spinner loading-xs mr-2"></span>
              <span v-if="!stockModification.isProcessing.value">Confirmar Abono</span>
              <span v-else>Procesando...</span>
            </button>
          </div>
        </div>

        <!-- Caso 6: Tabla General de Operaciones de Modificación -->
        <div v-else class="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h2 class="text-lg font-bold text-base-content">Modificación de Acciones (Paso 4)</h2>
              <p class="text-xs text-base-content/60 mt-1">
                Registra los intercambios, transferencias, retiros o pagos de crédito con acciones realizados por los socios en esta reunión.
              </p>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="relative w-full max-w-sm flex-shrink-0">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search class="w-4 h-4 text-base-content/40" />
            </span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar socio..." 
              class="input input-bordered input-sm w-full pl-9 rounded-lg text-sm bg-base-100 focus:outline-none focus:border-teal-700" 
            />
          </div>

          <!-- Table of Modifications -->
          <div class="overflow-auto w-full border border-base-200 rounded-lg flex-1 min-h-0">
            <table class="table table-zebra w-full text-xs md:text-sm">
              <thead class="sticky top-0 z-10">
                <tr class="bg-base-200/50 text-base-content/70">
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider">Socio</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-center">Operaciones</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider">Detalles</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-right">Valor Neto</th>
                  <th class="py-2 px-3 font-bold text-[11px] uppercase tracking-wider text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="member in paginatedMembers" 
                  :key="member.id"
                  class="hover:bg-base-200/30 transition-all border-l-4 border-transparent"
                >
                  <td class="py-2.5 px-3">
                    <div class="flex items-center gap-3">
                      <div 
                        class="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                        :style="{ backgroundColor: getMemberColor(member.id) }"
                      >
                        {{ getInitials(member.name) }}
                      </div>
                      <span class="font-semibold text-base-content text-xs">{{ member.name }}</span>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span class="badge badge-sm font-semibold">
                      {{ getMemberOperationsCount(member.id) }} ops
                    </span>
                  </td>
                  <td class="py-2.5 px-3 max-w-xs truncate">
                    <span class="text-xs text-base-content/85">{{ getMemberOperationsDetails(member.id) }}</span>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <span class="font-bold text-xs text-teal-700">{{ formatCurrency(getMemberOperationsNetValue(member.id)) }}</span>
                  </td>
                  <td class="py-2.5 px-3 text-center overflow-visible">
                    <div class="dropdown dropdown-end">
                      <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-circle" aria-label="Opciones">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </div>
                      <ul tabindex="0" class="dropdown-content menu menu-xs bg-base-100 rounded-box z-50 w-48 p-1.5 shadow border border-base-200">
                        <li>
                          <a @click="openTransferModalWrapper(member)" class="text-xs gap-2">
                            <ArrowRight class="h-3.5 w-3.5 text-teal-700 shrink-0" />
                            <span>Transferir</span>
                          </a>
                        </li>
                        <li>
                          <a @click="openLoanPaymentModalWrapper(member)" class="text-xs gap-2">
                            <Coins class="h-3.5 w-3.5 text-teal-700 shrink-0" />
                            <span>Pago Crédito (Acciones)</span>
                          </a>
                        </li>
                        <li>
                          <a @click="openCashLoanPaymentModalWrapper(member)" class="text-xs gap-2">
                            <HandCash class="h-3.5 w-3.5 text-teal-700 shrink-0" />
                            <span>Abono Efectivo</span>
                          </a>
                        </li>
                        <li>
                          <a @click="openModificationModalWrapper(member)" class="text-xs gap-2">
                            <EditPencil class="h-3.5 w-3.5 text-teal-700 shrink-0" />
                            <span>Modificar Acciones</span>
                          </a>
                        </li>
                        <li v-if="getMemberOperationsCount(member.id) > 0">
                          <a @click="showMemberOperationsDetail(member)" class="text-xs gap-2">
                            <Eye class="h-3.5 w-3.5 text-teal-700 shrink-0" />
                            <span>Ver Detalles</span>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredMembers.length === 0">
                  <td colspan="5" class="text-center py-8 text-base-content/50">
                    No se encontraron socios.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div class="flex items-center justify-between flex-shrink-0 pt-2 border-t border-base-100">
            <span class="text-xs text-base-content/60">
              Mostrando {{ filteredMembers.length }} socios
            </span>
            <div class="flex items-center gap-2">
              <button 
                class="btn btn-outline btn-xs font-semibold rounded-lg"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                Anterior
              </button>
              <button 
                class="btn btn-outline btn-xs font-semibold rounded-lg"
                :disabled="currentPage >= totalPages"
                @click="currentPage++"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel Derecho (Sidebar de Resumen / Gráfico) - 4 Columnas -->
      <div class="lg:col-span-4 card bg-base-100 border border-base-200 shadow-sm rounded-xl p-4 md:p-5 flex flex-col h-full min-h-0 justify-between overflow-auto">
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-base-content border-b border-base-200 pb-3 mb-2">Resumen de Modificaciones</h3>
          
          <!-- Metrics List -->
          <div class="space-y-3.5">
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Total de Operaciones:</span>
              <span class="font-bold text-base-content text-sm">{{ totalOperations }} Operaciones</span>
            </div>
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Total Transferido:</span>
              <span class="font-bold text-teal-700 text-sm">{{ formatCurrency(totalTransfersValue) }}</span>
            </div>
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-base-content/60 font-medium">Valor Neto Movilizado:</span>
              <span class="font-bold text-teal-755 text-sm font-mono">{{ formatCurrency(totalNetMobilized) }}</span>
            </div>
          </div>

          <!-- Circular Chart -->
          <div class="flex justify-center py-4">
            <div class="relative w-28 h-28 flex items-center justify-center">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <!-- Outer circle track -->
                <circle class="text-base-200" stroke-width="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                <!-- Progress circle -->
                <circle class="text-teal-700 transition-all duration-500" stroke-width="8" :stroke-dasharray="251.2" :stroke-dashoffset="251.2 - (251.2 * Math.min(totalOperations / 10, 1))" stroke-linecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
              </svg>
              <div class="absolute flex flex-col items-center justify-center text-center">
                <span class="text-xl font-extrabold text-base-content leading-none">{{ totalOperations }}</span>
                <span class="text-[9px] text-base-content/50 uppercase font-bold tracking-wider mt-1">Operaciones</span>
              </div>
            </div>
          </div>

          <!-- Info Box -->
          <div class="bg-teal-50/40 border border-teal-100 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-teal-800">
            <InfoCircle class="h-5 w-5 text-teal-600 shrink-0" />
            <p>
              Revisa todas las modificaciones registradas. Una vez que estés conforme con los cambios, haz clic en 'Siguiente Paso' para proceder con el Paso 5 de Desembolsos.
            </p>
          </div>
        </div>

        <div class="space-y-2 mt-6">
          <button 
            class="btn btn-block bg-black hover:bg-neutral-800 text-white font-semibold rounded-lg text-sm border-0 py-2.5"
            @click="$emit('completed')"
          >
            Siguiente Paso: Desembolsos
          </button>
          <button 
            class="btn btn-block btn-outline border-base-300 hover:bg-base-200 text-base-content font-semibold rounded-lg text-sm"
            @click="saveDraft"
          >
            Guardar Borrador
          </button>
        </div>
      </div>
    </div>

    <!-- Modales con DaisyUI -->
    <!-- Modal de Transferencia -->
    <dialog v-if="stockModification.showTransferModal.value" class="modal modal-open">
      <div class="modal-box max-w-2xl rounded-xl relative overflow-visible">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="stockModification.closeTransferModal()" aria-label="Cerrar modal">✕</button>
        <h3 class="font-bold text-xl mb-4 text-center">Transferir Acciones</h3>
        
        <div class="space-y-4">
          <!-- Socio origen (Solo lectura) -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Socio de origen</span>
            </label>
            <input :value="selectedMemberName" type="text" class="input input-bordered w-full" disabled />
          </div>

          <!-- Selección de acción -->
          <div v-if="stockModification.transferForm.value.memberId" class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Seleccionar acción a transferir</span>
            </label>
            <select 
              v-model="stockModification.transferForm.value.transferSubscriptionId" 
              class="select select-bordered w-full"
            >
              <option value="">Seleccione una acción</option>
              <option 
                v-for="sub in stockModification.memberSubscriptions.value" 
                :key="sub.id" 
                :value="sub.id"
              >
                {{ sub.stock?.type || 'Acción' }} - {{ sub.quantity }} unidades disponibles (Valor: {{ formatCurrency(sub.stock?.value || 0) }})
              </option>
            </select>
            <div v-if="stockModification.memberSubscriptions.value.length === 0" class="text-xs text-error mt-1 italic">
              Este socio no posee acciones disponibles.
            </div>
          </div>
          
          <!-- Cantidad a transferir -->
          <div v-if="stockModification.transferForm.value.transferSubscriptionId" class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Cantidad a transferir</span>
            </label>
            <input 
              type="number" 
              v-model.number="stockModification.transferForm.value.transferQuantity" 
              class="input input-bordered w-full font-mono text-right"
              :max="selectedSubscription?.quantity || 0"
              min="1"
            >
            <label class="label">
              <span class="label-text-alt text-base-content/60">Máximo disponible: {{ selectedSubscription?.quantity || 0 }} unidades</span>
            </label>
          </div>
          
          <!-- Selección del socio destino -->
          <div v-if="stockModification.transferForm.value.transferQuantity && stockModification.transferForm.value.transferQuantity > 0" class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Transferir a (Socio destino)</span>
            </label>
            <select 
              v-model="stockModification.transferForm.value.toMemberId" 
              class="select select-bordered w-full"
            >
              <option value="">Seleccione un socio destino</option>
              <option v-for="member in otherMembers" :key="member.id" :value="member.id">
                {{ member.name }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="modal-action flex justify-end gap-2 mt-6">
          <button class="btn btn-ghost rounded-lg" @click="stockModification.closeTransferModal()">Cancelar</button>
          <button 
            class="btn btn-primary bg-teal-700 hover:bg-teal-800 border-0 rounded-lg text-white font-semibold" 
            @click="prepareTransferReceipt"
            :disabled="!isTransferFormValid"
          >
            Preparar Transferencia
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button aria-label="Cerrar modal" @click.prevent="stockModification.closeTransferModal()">Cerrar</button>
      </form>
    </dialog>

    <!-- Modal de Pago de Crédito con Acciones -->
    <dialog v-if="stockModification.showLoanPaymentModal.value" class="modal modal-open">
      <div class="modal-box max-w-2xl rounded-xl relative overflow-visible">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="stockModification.closeLoanPaymentModal()" aria-label="Cerrar modal">✕</button>
        <h3 class="font-bold text-xl mb-4 text-center">Usar Acciones para Pago de Créditos</h3>
        
        <div class="space-y-4">
          <!-- Socio (Solo lectura) -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Socio</span>
            </label>
            <input :value="selectedMemberName" type="text" class="input input-bordered w-full" disabled />
          </div>

          <!-- Selección de acción -->
          <div v-if="stockModification.loanPaymentForm.value.memberId" class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Seleccionar acción a usar</span>
            </label>
            <select 
              v-model="stockModification.loanPaymentForm.value.loanPaymentSubscriptionId" 
              class="select select-bordered w-full"
            >
              <option value="">Seleccione una acción</option>
              <option 
                v-for="sub in stockModification.memberSubscriptions.value" 
                :key="sub.id" 
                :value="sub.id"
              >
                {{ sub.stock?.type || 'Acción' }} - {{ sub.quantity }} unidades disponibles (Valor: {{ formatCurrency(sub.stock?.value || 0) }})
              </option>
            </select>
            <div v-if="stockModification.memberSubscriptions.value.length === 0" class="text-xs text-error mt-1 italic">
              Este socio no posee acciones disponibles.
            </div>
          </div>
          
          <!-- Cantidad a usar -->
          <div v-if="stockModification.loanPaymentForm.value.loanPaymentSubscriptionId" class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Cantidad a usar</span>
            </label>
            <input 
              type="number" 
              v-model.number="stockModification.loanPaymentForm.value.loanPaymentQuantity" 
              class="input input-bordered w-full font-mono text-right"
              :max="selectedSubscriptionForLoan?.quantity || 0"
              min="1"
            >
            <label class="label">
              <span class="label-text-alt text-base-content/60">Máximo disponible: {{ selectedSubscriptionForLoan?.quantity || 0 }} unidades</span>
            </label>
          </div>
          
          <!-- Selección del crédito -->
          <div v-if="stockModification.loanPaymentForm.value.loanPaymentQuantity && stockModification.loanPaymentForm.value.loanPaymentQuantity > 0" class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Aplicar al crédito del socio</span>
            </label>
            <select 
              v-model="stockModification.loanPaymentForm.value.loanId" 
              class="select select-bordered w-full"
            >
              <option value="">Seleccione un crédito pendiente</option>
              <option v-for="loan in stockModification.memberLoans.value" :key="loan.id" :value="loan.id">
                {{ loan.loan_type }} - Saldo: {{ formatCurrency(loan.outstanding_balance) }}
              </option>
            </select>
            <div v-if="stockModification.memberLoans.value.length === 0" class="text-xs text-error mt-1 italic">
              Este socio no posee créditos pendientes con saldo activo.
            </div>
          </div>
        </div>
        
        <div class="modal-action flex justify-end gap-2 mt-6">
          <button class="btn btn-ghost rounded-lg" @click="stockModification.closeLoanPaymentModal()">Cancelar</button>
          <button 
            class="btn btn-primary bg-teal-700 hover:bg-teal-800 border-0 rounded-lg text-white font-semibold" 
            @click="prepareLoanPaymentReceipt"
            :disabled="!isLoanPaymentFormValid"
          >
            Preparar Pago
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button aria-label="Cerrar modal" @click.prevent="stockModification.closeLoanPaymentModal()">Cerrar</button>
      </form>
    </dialog>

    <!-- Modal de Pago de Crédito con Efectivo -->
    <dialog v-if="stockModification.showCashLoanPaymentModal.value" class="modal modal-open">
      <div class="modal-box max-w-2xl rounded-xl relative overflow-visible">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="stockModification.closeCashLoanPaymentModal()" aria-label="Cerrar modal">✕</button>
        <h3 class="font-bold text-xl mb-4 text-center">Abonar a Crédito con Efectivo</h3>
        
        <div class="space-y-4">
          <!-- Socio (Solo lectura) -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Socio</span>
            </label>
            <input :value="selectedMemberName" type="text" class="input input-bordered w-full" disabled />
          </div>

          <!-- Selección del crédito -->
          <div v-if="stockModification.cashLoanPaymentForm.value.memberId" class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Seleccionar crédito a abonar</span>
            </label>
            <select 
              v-model="stockModification.cashLoanPaymentForm.value.loanId" 
              class="select select-bordered w-full"
            >
              <option value="">Seleccione un crédito pendiente</option>
              <option v-for="loan in stockModification.memberLoans.value" :key="loan.id" :value="loan.id">
                {{ loan.loan_type }} - Saldo: {{ formatCurrency(loan.outstanding_balance) }}
              </option>
            </select>
            <div v-if="stockModification.memberLoans.value.length === 0" class="text-xs text-error mt-1 italic">
              Este socio no posee créditos pendientes con saldo activo.
            </div>
          </div>
          
          <!-- Cantidad a usar -->
          <div v-if="stockModification.cashLoanPaymentForm.value.loanId" class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Monto a abonar ($)</span>
            </label>
            <input 
              type="number" 
              v-model.number="stockModification.cashLoanPaymentForm.value.amount" 
              class="input input-bordered w-full font-mono text-right"
              :max="selectedLoanForCashPayment?.outstanding_balance || 0"
              min="1"
            >
            <label class="label">
              <span class="label-text-alt text-base-content/60">Máximo abono permitido: {{ formatCurrency(selectedLoanForCashPayment?.outstanding_balance || 0) }}</span>
            </label>
          </div>
        </div>
        
        <div class="modal-action flex justify-end gap-2 mt-6">
          <button class="btn btn-ghost rounded-lg" @click="stockModification.closeCashLoanPaymentModal()">Cancelar</button>
          <button 
            class="btn btn-primary bg-teal-700 hover:bg-teal-800 border-0 rounded-lg text-white font-semibold" 
            @click="prepareCashLoanPaymentReceipt"
            :disabled="!isCashLoanPaymentFormValid"
          >
            Preparar Pago
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button aria-label="Cerrar modal" @click.prevent="stockModification.closeCashLoanPaymentModal()">Cerrar</button>
      </form>
    </dialog>

    <!-- Modal de Modificación de Acciones -->
    <dialog v-if="stockModification.showModificationModal.value" class="modal modal-open">
      <div class="modal-box max-w-4xl rounded-xl relative overflow-visible">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="stockModification.closeModificationModal()" aria-label="Cerrar modal">✕</button>
        <h3 class="font-bold text-xl mb-4 text-center">Modificar Acciones</h3>
        
        <div class="space-y-6">
          <!-- Socio (Solo lectura) -->
          <div class="form-control max-w-md mx-auto">
            <label class="label">
              <span class="label-text font-semibold">Socio</span>
            </label>
            <input :value="selectedMemberName" type="text" class="input input-bordered w-full" disabled />
          </div>

          <div v-if="stockModification.modificationForm.value.memberId" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Acciones origen -->
            <div class="bg-base-200 p-4 rounded-xl">
              <h4 class="font-semibold mb-2 text-error flex items-center gap-1">
                <span>Entregar</span>
              </h4>
              <div class="space-y-3">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Tipo de acción</span>
                  </label>
                  <select 
                    v-model="stockModification.modificationForm.value.fromSubscriptionId" 
                    class="select select-bordered w-full"
                  >
                    <option value="">Seleccione una acción</option>
                    <option 
                      v-for="sub in stockModification.memberSubscriptions.value" 
                      :key="sub.id" 
                      :value="sub.id"
                    >
                      {{ sub.stock?.type || 'Acción' }} - {{ sub.quantity }} disponibles (Valor: {{ formatCurrency(sub.stock?.value || 0) }})
                    </option>
                  </select>
                  <div v-if="stockModification.memberSubscriptions.value.length === 0" class="text-xs text-error mt-1 italic">
                    Este socio no posee acciones para entregar.
                  </div>
                </div>
                
                <div v-if="stockModification.modificationForm.value.fromSubscriptionId" class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Cantidad</span>
                  </label>
                  <input 
                    type="number" 
                    v-model.number="stockModification.modificationForm.value.fromQuantity" 
                    class="input input-bordered w-full font-mono text-right"
                    :max="selectedFromSubscription?.quantity || 0"
                    min="1"
                  >
                  <label class="label">
                    <span class="label-text-alt text-base-content/60">Máximo disponible: {{ selectedFromSubscription?.quantity || 0 }}</span>
                  </label>
                </div>
                
                <div v-if="stockModification.modificationForm.value.fromQuantity && stockModification.modificationForm.value.fromQuantity > 0" class="bg-base-300/50 p-3 rounded-lg flex justify-between items-center">
                  <span class="font-semibold text-xs text-base-content/75">Valor total a entregar:</span>
                  <span class="font-mono text-sm font-bold text-error">{{ formatCurrency(fromTotalValue) }}</span>
                </div>
              </div>
            </div>
            
            <!-- Acciones destino -->
            <div class="bg-base-200 p-4 rounded-xl">
              <h4 class="font-semibold mb-2 text-success flex items-center gap-1">
                <span>Recibir</span>
              </h4>
              <div class="space-y-3">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Tipo de acción</span>
                  </label>
                  <select 
                    v-model="stockModification.modificationForm.value.toStockId" 
                    class="select select-bordered w-full"
                  >
                    <option value="">Seleccione una acción</option>
                    <option v-for="stock in stockModification.availableStocks.value" :key="stock.id" :value="stock.id">
                      {{ stock.type }} - {{ formatCurrency(stock.value) }} c/u
                    </option>
                  </select>
                </div>
                
                <div v-if="stockModification.modificationForm.value.toStockId" class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Cantidad</span>
                  </label>
                  <input 
                    type="number" 
                    v-model.number="stockModification.modificationForm.value.toQuantity" 
                    class="input input-bordered w-full font-mono text-right"
                    min="1"
                  >
                </div>
                
                <div v-if="stockModification.modificationForm.value.toQuantity && stockModification.modificationForm.value.toQuantity > 0" class="bg-base-300/50 p-3 rounded-lg flex justify-between items-center">
                  <span class="font-semibold text-xs text-base-content/75">Valor total a recibir:</span>
                  <span class="font-mono text-sm font-bold text-success">{{ formatCurrency(toTotalValue) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Cálculo de diferencia -->
          <div v-if="stockModification.modificationForm.value.fromQuantity && stockModification.modificationForm.value.fromQuantity > 0 && stockModification.modificationForm.value.toQuantity && stockModification.modificationForm.value.toQuantity > 0" class="bg-base-200 p-4 rounded-xl">
            <h4 class="font-semibold mb-2">Diferencia</h4>
            <div class="flex items-center justify-between mb-4">
              <span class="text-lg">{{ modificationDifference >= 0 ? 'A favor del socio:' : 'Debe pagar:' }}</span>
              <span class="font-mono text-2xl font-bold" :class="modificationDifference >= 0 ? 'text-success' : 'text-error'">
                {{ modificationDifference >= 0 ? '+' : '-' }}{{ formatCurrency(Math.abs(modificationDifference)) }}
              </span>
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Manejo de la diferencia</span>
              </label>
              <select 
                v-model="stockModification.modificationForm.value.differenceHandling" 
                class="select select-bordered w-full"
              >
                <option value="">Seleccione cómo manejar la diferencia</option>
                <option v-if="modificationDifference > 0" value="cash">Entregar en efectivo</option>
                <option v-if="modificationDifference > 0" value="credit">Abonar a crédito existente</option>
                <option v-if="modificationDifference < 0" value="cash">Pagar en efectivo</option>
                <option v-if="modificationDifference < 0" value="credit">Financiar con crédito</option>
              </select>
            </div>
            
            <div v-if="stockModification.modificationForm.value.differenceHandling === 'credit'" class="form-control mt-2">
              <label class="label">
                <span class="label-text font-semibold">{{ modificationDifference > 0 ? 'Crédito a abonar' : 'Crear nuevo crédito' }}</span>
              </label>
              <select 
                v-model="stockModification.modificationForm.value.targetLoanId" 
                class="select select-bordered w-full"
              >
                <option value="">{{ modificationDifference > 0 ? 'Seleccione un crédito' : 'Seleccione tipo de crédito' }}</option>
                <template v-if="modificationDifference > 0">
                  <option v-for="loan in stockModification.memberLoans.value" :key="loan.id" :value="loan.id">
                    {{ loan.loan_type }} - Saldo: {{ formatCurrency(loan.outstanding_balance) }}
                  </option>
                </template>
                <option v-if="modificationDifference < 0" value="new_action_loan">Crédito de Acción (1.5% interés)</option>
                <option v-if="modificationDifference < 0" value="new_current_loan">Crédito Corriente (1.5% interés)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="modal-action flex justify-end gap-2 mt-6">
          <button class="btn btn-ghost rounded-lg" @click="stockModification.closeModificationModal()">Cancelar</button>
          <button 
            class="btn btn-primary bg-teal-700 hover:bg-teal-800 border-0 rounded-lg text-white font-semibold" 
            @click="prepareModificationReceipt"
            :disabled="!isModificationFormValid"
          >
            Preparar Modificación
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button aria-label="Cerrar modal" @click.prevent="stockModification.closeModificationModal()">Cerrar</button>
      </form>
    </dialog>

    <!-- Modal de Vista Previa e Impresión -->
    <PrintReceiptModal
      :is-open="printReceipt.isPrintModalOpen.value"
      :member-name="selectedMember?.name || null"
      :print-date="memberSelection.printDate.value"
      :viewed-operations="viewedOperations"
      :viewed-total="purchaseTotal"
      title="Detalle de Operaciones"
      total-label="Total:"
      modal-id="operations-receipt-print-modal"
      @close="printReceipt.closePrintModal"
      @print="printReceipt.printReceipt"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search, InfoCircle, WarningTriangle, ArrowRight, Coins, HandCash, EditPencil, Eye } from 'iconoir-vue/regular'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { useStockModification } from '../../composables/useStockModification'
import { usePaymentCollection } from '../../composables/usePaymentCollection'
import { useMemberSelection } from '../../composables/useMemberSelection'
import { usePrintReceipt } from '@/shared/composables/usePrintReceipt'
import type { Member } from '@/api/members.api'
import type { Operation } from '@/api/meetings.api'
import OperationDetails from '@/shared/components/OperationDetails.vue'
import PrintReceiptModal from '@/shared/components/PrintReceiptModal.vue'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'

// 2. Props y emits
defineEmits<{
  completed: []
}>()

// 3. Composables y stores
const toast = useToast()
const store = useActiveMeetingStore()
const stockModification = useStockModification()
const paymentCollection = usePaymentCollection()
const memberSelection = useMemberSelection(paymentCollection)

const isLoadingMembers = computed(() => memberSelection.loadingMembers.value)
const memberError = computed(() => memberSelection.error.value || stockModification.error.value)
const membersList = computed(() => memberSelection.members.value)

const selectedMember = ref<Member | null>(null)
const selectedMemberName = computed(() => selectedMember.value?.name || '')
const purchaseTotal = ref(0)
const viewedOperations = ref<any[] | null>(null)

const printReceipt = usePrintReceipt(
  selectedMember,
  'operations-receipt-print-modal',
  'operations-receipt-print-container',
  'operations-receipt-print'
)

// Search & Pagination
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

// Filtered and Paginated Members
const filteredMembers = computed(() => {
  if (!searchQuery.value) return membersList.value
  const query = searchQuery.value.toLowerCase()
  return membersList.value.filter(m => m.name.toLowerCase().includes(query))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredMembers.value.length / itemsPerPage)))

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredMembers.value.slice(start, start + itemsPerPage)
})

// Reset current page when query changes
watch(searchQuery, () => {
  currentPage.value = 1
})

function getMemberOperationsCount(memberId: string): number {
  return stockModification.registeredOperations.value.filter(op => op.member_id === memberId).length
}

function getMemberOperationsDetails(memberId: string): string {
  const ops = stockModification.registeredOperations.value.filter(op => op.member_id === memberId)
  if (ops.length === 0) return 'Sin operaciones'
  return Array.from(new Set(ops.map(op => getOperationTypeLabel(op.type)))).join(', ')
}

function getMemberOperationsNetValue(memberId: string): number {
  return stockModification.registeredOperations.value
    .filter(op => op.member_id === memberId)
    .reduce((sum, op) => sum + op.total_amount, 0)
}

function showMemberOperationsDetail(member: Member) {
  selectedMember.value = member
  const ops = stockModification.registeredOperations.value.filter(op => op.member_id === member.id)
  if (ops.length > 0) {
    stockModification.selectedOperation.value = ops[0]
  }
}

function getSelectedMemberOperations(): Operation[] {
  if (selectedMember.value) {
    const memberOps = stockModification.registeredOperations.value.filter(
      op => op.member_id === selectedMember.value?.id
    )
    if (memberOps.length > 0) return memberOps
  }
  return stockModification.selectedOperation.value ? [stockModification.selectedOperation.value] : []
}

function formatDate(date: string | Date): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

// Total computations for summary
const totalOperations = computed(() => stockModification.registeredOperations.value.length)

const totalTransfersValue = computed(() => {
  return stockModification.registeredOperations.value
    .filter(op => op.type === 'STOCK_TRANSFER' || op.type === 'TRANSFER')
    .reduce((sum, op) => sum + (op.total_amount || 0), 0)
})

const totalNetMobilized = computed(() => {
  return stockModification.registeredOperations.value.reduce((sum, op) => sum + (op.total_amount || 0), 0)
})

// Operations pagination and watcher removed to avoid duplicates and type errors (replaced by member-centric lists)

// Modal form option computations
const otherMembers = computed(() => {
  const selectedId = stockModification.transferForm.value.memberId
  return membersList.value.filter(m => m.id !== selectedId)
})

const selectedSubscription = computed(() => {
  const subId = stockModification.transferForm.value.transferSubscriptionId
  return stockModification.memberSubscriptions.value.find(sub => sub.id === subId)
})

const selectedSubscriptionForLoan = computed(() => {
  const subId = stockModification.loanPaymentForm.value.loanPaymentSubscriptionId
  return stockModification.memberSubscriptions.value.find(sub => sub.id === subId)
})

const selectedFromSubscription = computed(() => {
  const subId = stockModification.modificationForm.value.fromSubscriptionId
  return stockModification.memberSubscriptions.value.find(sub => sub.id === subId)
})

const selectedToStock = computed(() => {
  const stockId = stockModification.modificationForm.value.toStockId
  return stockModification.availableStocks.value.find(stock => stock.id === stockId)
})

const fromTotalValue = computed(() => {
  const sub = selectedFromSubscription.value
  const qty = stockModification.modificationForm.value.fromQuantity || 0
  return (sub?.stock?.value || 0) * qty
})

const toTotalValue = computed(() => {
  const stock = selectedToStock.value
  const qty = stockModification.modificationForm.value.toQuantity || 0
  return (stock?.value || 0) * qty
})

const modificationDifference = computed(() => fromTotalValue.value - toTotalValue.value)

const isTransferFormValid = computed(() => {
  return !!(
    stockModification.transferForm.value.memberId &&
    stockModification.transferForm.value.transferSubscriptionId &&
    stockModification.transferForm.value.transferQuantity &&
    stockModification.transferForm.value.transferQuantity > 0 &&
    stockModification.transferForm.value.toMemberId
  )
})

const isLoanPaymentFormValid = computed(() => {
  return !!(
    stockModification.loanPaymentForm.value.memberId &&
    stockModification.loanPaymentForm.value.loanPaymentSubscriptionId &&
    stockModification.loanPaymentForm.value.loanPaymentQuantity &&
    stockModification.loanPaymentForm.value.loanPaymentQuantity > 0 &&
    stockModification.loanPaymentForm.value.loanId
  )
})

const isModificationFormValid = computed(() => {
  const form = stockModification.modificationForm.value
  const basic = !!(
    form.memberId &&
    form.fromSubscriptionId &&
    form.fromQuantity && form.fromQuantity > 0 &&
    form.toStockId &&
    form.toQuantity && form.toQuantity > 0 &&
    form.differenceHandling
  )
  
  if (!basic) return false
  
  if (form.differenceHandling === 'credit') {
    return !!form.targetLoanId
  }
  
  return true
})

const isCashLoanPaymentFormValid = computed(() => {
  return !!(
    stockModification.cashLoanPaymentForm.value.memberId &&
    stockModification.cashLoanPaymentForm.value.loanId &&
    stockModification.cashLoanPaymentForm.value.amount &&
    stockModification.cashLoanPaymentForm.value.amount > 0
  )
})

const selectedLoanForCashPayment = computed(() => {
  return stockModification.memberLoans.value.find(l => l.id === stockModification.cashLoanPaymentForm.value.loanId)
})

// Dialog openers wrappers to set member and fetch data
async function openTransferModalWrapper(member: Member) {
  selectedMember.value = member
  stockModification.openTransferModal()
  stockModification.transferForm.value.memberId = member.id
  await onTransferMemberChange(member.id)
}

async function openLoanPaymentModalWrapper(member: Member) {
  selectedMember.value = member
  stockModification.openLoanPaymentModal()
  stockModification.loanPaymentForm.value.memberId = member.id
  await onLoanPaymentMemberChange(member.id)
}

async function openCashLoanPaymentModalWrapper(member: Member) {
  selectedMember.value = member
  stockModification.openCashLoanPaymentModal()
  stockModification.cashLoanPaymentForm.value.memberId = member.id
  await onCashLoanPaymentMemberChange(member.id)
}

async function openModificationModalWrapper(member: Member) {
  selectedMember.value = member
  stockModification.openModificationModal()
  stockModification.modificationForm.value.memberId = member.id
  await onModificationMemberChange(member.id)
}

async function onTransferMemberChange(memberId: string) {
  await stockModification.loadMemberData(memberId)
  stockModification.transferForm.value.transferSubscriptionId = ''
  stockModification.transferForm.value.transferQuantity = undefined
  stockModification.transferForm.value.toMemberId = ''
}

async function onLoanPaymentMemberChange(memberId: string) {
  await stockModification.loadMemberData(memberId)
  stockModification.loanPaymentForm.value.loanPaymentSubscriptionId = ''
  stockModification.loanPaymentForm.value.loanPaymentQuantity = undefined
  stockModification.loanPaymentForm.value.loanId = ''
}

async function onCashLoanPaymentMemberChange(memberId: string) {
  await stockModification.loadMemberData(memberId)
  stockModification.cashLoanPaymentForm.value.loanId = ''
  stockModification.cashLoanPaymentForm.value.amount = undefined
}

async function onModificationMemberChange(memberId: string) {
  await stockModification.loadMemberData(memberId)
  stockModification.modificationForm.value.fromSubscriptionId = ''
  stockModification.modificationForm.value.fromQuantity = undefined
  stockModification.modificationForm.value.toStockId = ''
  stockModification.modificationForm.value.toQuantity = undefined
  stockModification.modificationForm.value.differenceHandling = undefined
  stockModification.modificationForm.value.targetLoanId = ''
}

// Helpers

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getMemberColor(memberId: string): string {
  const colors = ['#0d9488', '#0891b2', '#0284c7', '#4f46e5', '#7c3aed', '#db2777', '#ea580c', '#e11d48']
  let hash = 0
  for (let i = 0; i < memberId.length; i++) {
    hash = memberId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getOperationTypeLabel(type: string) {
  const labels: Record<string, string> = {
    TRANSFER: 'Transferencia',
    STOCK_TRANSFER: 'Transferencia',
    LOAN_PAYMENT: 'Pago Crédito',
    STOCK_LOAN_PAYMENT: 'Pago Crédito',
    STOCK_MODIFICATION: 'Modificación',
    STOCK_EXCHANGE: 'Modificación',
    EXCHANGE: 'Modificación'
  }
  return labels[type] || type
}

// Prepare Operations
function prepareTransferReceipt() {
  const memberId = stockModification.transferForm.value.memberId
  const member = membersList.value.find(m => m.id === memberId)
  const subscription = selectedSubscription.value
  const toMember = otherMembers.value.find(m => m.id === stockModification.transferForm.value.toMemberId)
  
  if (!subscription || !toMember || !member) return
  
  const quantity = stockModification.transferForm.value.transferQuantity || 0
  const unitValue = subscription.stock?.value || 0
  const totalValue = quantity * unitValue
  
  selectedMember.value = member

  stockModification.transferReceipt.value = {
    stockType: subscription.stock?.type || 'Acción',
    quantity,
    unitValue,
    totalValue,
    toMemberName: toMember.name,
    transfer_subscription_id: stockModification.transferForm.value.transferSubscriptionId!,
    transfer_quantity: stockModification.transferForm.value.transferQuantity!,
    to_member_id: stockModification.transferForm.value.toMemberId!
  }
  
  stockModification.closeTransferModal()
  stockModification.showTransferReceipt.value = true
}

function prepareLoanPaymentReceipt() {
  const memberId = stockModification.loanPaymentForm.value.memberId
  const member = membersList.value.find(m => m.id === memberId)
  const subscription = selectedSubscriptionForLoan.value
  const loan = stockModification.memberLoans.value.find(l => l.id === stockModification.loanPaymentForm.value.loanId)
  
  if (!subscription || !loan || !member) return
  
  const quantity = stockModification.loanPaymentForm.value.loanPaymentQuantity || 0
  const unitValue = subscription.stock?.value || 0
  const totalValue = quantity * unitValue
  const newBalance = loan.outstanding_balance - totalValue
  
  selectedMember.value = member

  stockModification.loanPaymentReceipt.value = {
    stockType: subscription.stock?.type || 'Acción',
    quantity,
    unitValue,
    totalValue,
    loanType: loan.loan_type,
    currentBalance: loan.outstanding_balance,
    newBalance,
    loan_payment_subscription_id: stockModification.loanPaymentForm.value.loanPaymentSubscriptionId!,
    loan_payment_quantity: stockModification.loanPaymentForm.value.loanPaymentQuantity!,
    loan_id: stockModification.loanPaymentForm.value.loanId!
  }
  
  stockModification.closeLoanPaymentModal()
  stockModification.showLoanPaymentReceipt.value = true
}

function prepareCashLoanPaymentReceipt() {
  const memberId = stockModification.cashLoanPaymentForm.value.memberId
  const member = membersList.value.find(m => m.id === memberId)
  const loan = stockModification.memberLoans.value.find(l => l.id === stockModification.cashLoanPaymentForm.value.loanId)
  
  if (!loan || !member) return
  
  const paymentAmount = stockModification.cashLoanPaymentForm.value.amount || 0
  const newBalance = loan.outstanding_balance - paymentAmount
  
  selectedMember.value = member

  stockModification.cashLoanPaymentReceipt.value = {
    loanType: loan.loan_type,
    currentBalance: loan.outstanding_balance,
    paymentAmount,
    newBalance,
    loan_id: loan.id,
    amount: paymentAmount,
    quantity: 0
  }
  
  stockModification.closeCashLoanPaymentModal()
  stockModification.showCashLoanPaymentReceipt.value = true
}

function prepareModificationReceipt() {
  const memberId = stockModification.modificationForm.value.memberId
  const member = membersList.value.find(m => m.id === memberId)
  const fromSub = selectedFromSubscription.value
  const toStock = selectedToStock.value
  
  if (!fromSub || !toStock || !member) return
  
  const fromQuantity = stockModification.modificationForm.value.fromQuantity || 0
  const toQuantity = stockModification.modificationForm.value.toQuantity || 0
  const fromUnitValue = fromSub.stock?.value || 0
  const toUnitValue = toStock.value
  const fromValue = fromQuantity * fromUnitValue
  const toValue = toQuantity * toUnitValue
  const difference = fromValue - toValue
  
  let differenceHandlingLabel = ''
  if (stockModification.modificationForm.value.differenceHandling === 'cash') {
    differenceHandlingLabel = difference >= 0 ? 'Entregar en efectivo' : 'Pagar en efectivo'
  } else if (stockModification.modificationForm.value.differenceHandling === 'credit') {
    if (difference > 0) {
      const selectedLoan = stockModification.memberLoans.value.find(
        loan => loan.id === stockModification.modificationForm.value.targetLoanId
      )
      differenceHandlingLabel = `Abonar a crédito: ${selectedLoan?.loan_type || 'N/A'}`
    } else {
      const loanType = stockModification.modificationForm.value.targetLoanId === 'new_action_loan' 
        ? 'Crédito de Acción' 
        : 'Crédito Corriente'
      differenceHandlingLabel = `Financiar con ${loanType}`
    }
  }
  
  selectedMember.value = member

  stockModification.modificationReceipt.value = {
    fromStockType: fromSub.stock?.type || 'Acción',
    fromQuantity,
    fromUnitValue,
    fromValue,
    toStockType: toStock.type,
    toQuantity,
    toUnitValue,
    toValue,
    difference,
    differenceHandling: differenceHandlingLabel,
    from_subscription_id: stockModification.modificationForm.value.fromSubscriptionId!,
    from_quantity: stockModification.modificationForm.value.fromQuantity!,
    to_stock_id: stockModification.modificationForm.value.toStockId!,
    to_quantity: stockModification.modificationForm.value.toQuantity!,
    difference_handling: stockModification.modificationForm.value.differenceHandling,
    target_loan_id: stockModification.modificationForm.value.targetLoanId
  }
  
  stockModification.closeModificationModal()
  stockModification.showModificationReceipt.value = true
}

// Cancel prepared receipts
function cancelTransfer() {
  stockModification.showTransferReceipt.value = false
  stockModification.transferReceipt.value = null
}

function cancelLoanPayment() {
  stockModification.showLoanPaymentReceipt.value = false
  stockModification.loanPaymentReceipt.value = null
}

function cancelCashLoanPayment() {
  stockModification.showCashLoanPaymentReceipt.value = false
  stockModification.cashLoanPaymentReceipt.value = null
}

function cancelModification() {
  stockModification.showModificationReceipt.value = false
  stockModification.modificationReceipt.value = null
}

// Confirm operations in DB
async function confirmTransfer() {
  if (!selectedMember.value || !store.meetingId) return
  try {
    if (!stockModification.transferReceipt.value) return

    const data = {
      transfer_subscription_id: stockModification.transferReceipt.value.transfer_subscription_id,
      transfer_quantity: stockModification.transferReceipt.value.transfer_quantity,
      to_member_id: stockModification.transferReceipt.value.to_member_id
    }
    
    await stockModification.processTransfer(selectedMember.value.id, data)
    stockModification.showTransferReceipt.value = false
    stockModification.transferReceipt.value = null
    toast.success('Transferencia procesada exitosamente')
  } catch (e) {
    toast.error('Error al procesar la transferencia')
    console.error(e)
  }
}

async function confirmLoanPayment() {
  if (!selectedMember.value || !store.meetingId) return
  try {
    if (!stockModification.loanPaymentReceipt.value) return

    const data = {
      loan_payment_subscription_id: stockModification.loanPaymentReceipt.value.loan_payment_subscription_id,
      loan_payment_quantity: stockModification.loanPaymentReceipt.value.loan_payment_quantity,
      loan_id: stockModification.loanPaymentReceipt.value.loan_id
    }
    
    await stockModification.processLoanPayment(selectedMember.value.id, data)
    stockModification.showLoanPaymentReceipt.value = false
    stockModification.loanPaymentReceipt.value = null
    toast.success('Pago de crédito procesado exitosamente')
  } catch (e) {
    toast.error('Error al procesar el pago de crédito')
    console.error(e)
  }
}

async function confirmCashLoanPayment() {
  if (!selectedMember.value || !store.meetingId) return
  try {
    if (!stockModification.cashLoanPaymentReceipt.value) return

    const data = {
      loanId: stockModification.cashLoanPaymentReceipt.value.loan_id,
      amount: stockModification.cashLoanPaymentReceipt.value.amount
    }
    
    await stockModification.processCashLoanPayment(selectedMember.value.id, data)
    stockModification.showCashLoanPaymentReceipt.value = false
    stockModification.cashLoanPaymentReceipt.value = null
    toast.success('Abono procesado exitosamente')
  } catch (e) {
    toast.error('Error al procesar el abono a crédito')
    console.error(e)
  }
}

async function confirmModification() {
  if (!selectedMember.value || !store.meetingId) return
  try {
    if (!stockModification.modificationReceipt.value) return

    const data = {
      from_subscription_id: stockModification.modificationReceipt.value.from_subscription_id,
      from_quantity: stockModification.modificationReceipt.value.from_quantity,
      to_stock_id: stockModification.modificationReceipt.value.to_stock_id,
      to_quantity: stockModification.modificationReceipt.value.to_quantity,
      difference_handling: stockModification.modificationReceipt.value.difference_handling,
      target_loan_id: stockModification.modificationReceipt.value.target_loan_id
    }
    
    await stockModification.processExchange(selectedMember.value.id, data)
    stockModification.showModificationReceipt.value = false
    stockModification.modificationReceipt.value = null
    toast.success('Modificación procesada exitosamente')
  } catch (e) {
    toast.error('Error al procesar la modificación')
    console.error(e)
  }
}



function closeOperationDetail() {
  stockModification.selectedOperation.value = null
  viewedOperations.value = null
  selectedMember.value = null
}

function saveDraft() {
  toast.success('Borrador guardado exitosamente.')
}

// Lifecycle hooks
onMounted(async () => {
  await memberSelection.loadMembers()
  if (store.meetingId) {
    await stockModification.loadRegisteredOperations()
  }
})

// Watcher for meetingId
watch(
  () => store.meetingId,
  async (newMeetingId) => {
    if (newMeetingId) {
      await stockModification.loadRegisteredOperations()
    }
  }
)
</script>
