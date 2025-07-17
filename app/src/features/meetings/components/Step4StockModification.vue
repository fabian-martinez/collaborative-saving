<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Paso 4: Modificación de Acciones</h2>
    
    <div class="prose mb-6">
      <p>
        En este paso puedes transferir acciones entre socios, utilizar acciones para pagos de créditos, o intercambiar tipos de acciones.
      </p>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center my-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="error" class="alert alert-error my-4">
      <span>{{ error }}</span>
    </div>

    <div v-if="!isLoading && !error" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Lista de Socios -->
      <div class="md:col-span-1">
        <h3 class="text-lg font-semibold mb-2">Socios</h3>
        <ul class="menu bg-base-200 w-full rounded-box">
          <li v-for="member in members" :key="member.id" @click="selectMember(member)">
            <a :class="[ 'transition', selectedMember && selectedMember.id === member.id ? 'bg-primary/20 font-bold text-primary' : 'hover:bg-base-300/40' ]">
              {{ member.name }}
              <span v-if="hasOperations(member.id)" class="badge badge-info badge-sm ml-2">Con operaciones</span>
            </a>
          </li>
        </ul>
        
        <div class="mt-4 p-4 bg-base-200 rounded-box space-y-4">
          <div class="text-center">
            <div class="text-sm font-light text-base-content/70 uppercase">Total Transferencias</div>
            <div class="text-2xl font-bold text-primary"><CopyOnDblClickNumber :value="totalTransfers" /></div>
          </div>
          
          <div class="text-center">
            <div class="text-sm font-light text-base-content/70 uppercase">Total Pagos de Créditos</div>
            <div class="text-2xl font-bold text-success"><CopyOnDblClickNumber :value="totalLoanPayments" /></div>
          </div>
          
          <div class="text-center">
            <div class="text-sm font-light text-base-content/70 uppercase">Total Modificaciones</div>
            <div class="text-2xl font-bold text-info"><CopyOnDblClickNumber :value="totalModifications" /></div>
          </div>
          
          <div class="border-t border-base-300/50"></div>
          
          <div>
            <h4 class="font-semibold text-center text-base-content/80 mb-2">Operaciones Registradas</h4>
            <div class="flex justify-center mb-2 gap-2">
              <button class="btn btn-xs btn-outline" :class="{ 'btn-active': !showAllOperations }" @click="showAllOperations = false">Solo este socio</button>
              <button class="btn btn-xs btn-outline" :class="{ 'btn-active': showAllOperations }" @click="showAllOperations = true">Todas</button>
            </div>
            
            <div v-if="showAllOperations">
              <div v-if="registeredOperations.length > 0" class="space-y-2">
                <div v-for="op in registeredOperations" :key="op.id" class="bg-base-100/50 p-2 rounded-md text-sm cursor-pointer hover:bg-primary/10 transition"
                  @click="showOperationDetail(op)">
                  <div class="flex justify-between items-center">
                    <span class="font-semibold">{{ op.description }}</span>
                    <span class="text-xs" :class="getOperationTypeColor(op.type)">
                      {{ getOperationTypeLabel(op.type) }}
                    </span>
                  </div>
                  <div class="text-xs text-base-content/60">{{ op.memberName }}</div>
                </div>
              </div>
              <p v-else class="text-base-content/60 italic text-sm text-center">Sin operaciones registradas aún.</p>
            </div>
            
            <div v-else>
              <div v-if="memberOperations.length > 0" class="space-y-2">
                <div v-for="op in memberOperations" :key="op.id" class="bg-base-100/50 p-2 rounded-md text-sm cursor-pointer hover:bg-primary/10 transition"
                  @click="showOperationDetail(op)">
                  <div class="flex justify-between items-center">
                    <span class="font-semibold">{{ op.description }}</span>
                    <span class="text-xs" :class="getOperationTypeColor(op.type)">
                      {{ getOperationTypeLabel(op.type) }}
                    </span>
                  </div>
                </div>
              </div>
              <p v-else class="text-base-content/60 italic text-sm text-center">Este socio no ha realizado operaciones en la reunión.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel de acciones -->
      <div class="md:col-span-2">
        <div v-if="!selectedMember" class="flex items-center justify-center h-full text-gray-500">
          <p class="text-center">Seleccione un socio para realizar modificaciones de acciones.</p>
        </div>
        
        <!-- Vista de detalle de operación -->
        <div v-else-if="selectedOperation" class="bg-base-100 p-8 rounded-2xl shadow-lg">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold">Detalle de Operación</h2>
            <button class="btn btn-outline btn-sm" @click="closeOperationDetail">Regresar</button>
          </div>
          
          <div class="space-y-4">
            <div class="bg-base-200 p-4 rounded-lg">
              <h3 class="font-semibold mb-2">{{ selectedOperation.description }}</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium">Tipo:</span>
                  <span class="ml-2">{{ getOperationTypeLabel(selectedOperation.type) }}</span>
                </div>
                <div>
                  <span class="font-medium">Socio:</span>
                  <span class="ml-2">{{ selectedOperation.memberName }}</span>
                </div>
                <div v-if="selectedOperation.type !== 'STOCK_MODIFICATION'">
                  <span class="font-medium">Acción:</span>
                  <span class="ml-2">{{ selectedOperation.stockType }}</span>
                </div>
                <div v-if="selectedOperation.type !== 'STOCK_MODIFICATION'">
                  <span class="font-medium">Cantidad:</span>
                  <span class="ml-2">{{ selectedOperation.quantity }} unidades</span>
                </div>
                <div v-if="selectedOperation.type !== 'STOCK_MODIFICATION'">
                  <span class="font-medium">Valor unitario:</span>
                  <span class="ml-2"><CopyOnDblClickNumber :value="selectedOperation.unitValue" /></span>
                </div>
                <div>
                  <span class="font-medium">Valor total:</span>
                  <span class="ml-2 font-bold text-primary"><CopyOnDblClickNumber :value="selectedOperation.totalValue" /></span>
                </div>
                <div v-if="selectedOperation.type === 'TRANSFER'">
                  <span class="font-medium">Transferido a:</span>
                  <span class="ml-2">{{ selectedOperation.toMemberName }}</span>
                </div>
                <div v-else-if="selectedOperation.type === 'LOAN_PAYMENT'">
                  <span class="font-medium">Aplicado a:</span>
                  <span class="ml-2">{{ selectedOperation.loanType }}</span>
                </div>
              </div>
            </div>
            
            <!-- Detalles específicos para modificación de acciones -->
            <div v-if="selectedOperation.type === 'STOCK_MODIFICATION'" class="bg-base-200 p-4 rounded-lg">
              <h3 class="font-semibold mb-2">Detalle del intercambio</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium">Acción origen:</span>
                  <span class="ml-2">{{ selectedOperation.fromStockType }}</span>
                </div>
                <div>
                  <span class="font-medium">Cantidad origen:</span>
                  <span class="ml-2">{{ selectedOperation.fromQuantity }} unidades</span>
                </div>
                <div>
                  <span class="font-medium">Acción destino:</span>
                  <span class="ml-2">{{ selectedOperation.toStockType }}</span>
                </div>
                <div>
                  <span class="font-medium">Cantidad destino:</span>
                  <span class="ml-2">{{ selectedOperation.toQuantity }} unidades</span>
                </div>
                                 <div>
                   <span class="font-medium">Valor origen:</span>
                   <span class="ml-2"><CopyOnDblClickNumber :value="selectedOperation.fromValue || 0" /></span>
                 </div>
                 <div>
                   <span class="font-medium">Valor destino:</span>
                   <span class="ml-2"><CopyOnDblClickNumber :value="selectedOperation.toValue || 0" /></span>
                 </div>
                 <div>
                   <span class="font-medium">Diferencia:</span>
                   <span class="ml-2 font-bold" :class="(selectedOperation.difference || 0) >= 0 ? 'text-success' : 'text-error'">
                     {{ (selectedOperation.difference || 0) >= 0 ? '+' : '' }}$<CopyOnDblClickNumber :value="selectedOperation.difference || 0" />
                   </span>
                 </div>
                <div>
                  <span class="font-medium">Manejo diferencia:</span>
                  <span class="ml-2">{{ selectedOperation.differenceHandling }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="selectedOperation.type === 'LOAN_PAYMENT'" class="bg-base-200 p-4 rounded-lg">
              <h3 class="font-semibold mb-2">Impacto en el crédito</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium">Saldo anterior:</span>
                  <span class="ml-2"><CopyOnDblClickNumber :value="selectedOperation.previousBalance || 0" /></span>
                </div>
                <div>
                  <span class="font-medium">Nuevo saldo:</span>
                  <span class="ml-2 font-bold" :class="(selectedOperation.newBalance || 0) > 0 ? 'text-warning' : 'text-success'">
                    <CopyOnDblClickNumber :value="selectedOperation.newBalance || 0" />
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex items-baseline text-2xl font-bold">
              <span class="flex-shrink-0">Total operación:</span>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <span class="flex-shrink-0 text-primary font-mono"><CopyOnDblClickNumber :value="selectedOperation.totalValue" /></span>
            </div>
          </div>
        </div>
        
        <!-- Vista de recibo para modificación de acciones -->
        <div v-else-if="showModificationReceipt" class="bg-base-100 p-8 rounded-2xl shadow-lg">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold">Modificación de Acciones</h2>
            <button class="btn btn-outline btn-sm" @click="cancelModification">Cancelar</button>
          </div>
          
          <div class="space-y-4">
            <div class="bg-base-200 p-4 rounded-lg">
              <h3 class="font-semibold mb-2">Detalle del intercambio</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <h4 class="font-medium text-error">Entregar:</h4>
                  <p class="text-lg">{{ modificationReceipt.fromStockType }}</p>
                  <p class="text-sm text-base-content/70">
                    {{ modificationReceipt.fromQuantity }} uds. x $
                    <CopyOnDblClickNumber :value="modificationReceipt.fromUnitValue" />
                  </p>
                  <p class="font-mono text-lg">-<CopyOnDblClickNumber :value="modificationReceipt.fromValue" /></p>
                </div>
                <div>
                  <h4 class="font-medium text-success">Recibir:</h4>
                  <p class="text-lg">{{ modificationReceipt.toStockType }}</p>
                  <p class="text-sm text-base-content/70">
                    {{ modificationReceipt.toQuantity }} uds. x $
                    <CopyOnDblClickNumber :value="modificationReceipt.toUnitValue" />
                  </p>
                  <p class="font-mono text-lg">+<CopyOnDblClickNumber :value="modificationReceipt.toValue" /></p>
                </div>
              </div>
            </div>
            
            <div class="bg-base-200 p-4 rounded-lg">
              <h3 class="font-semibold mb-2">Diferencia</h3>
              <div class="flex items-center justify-between">
                <span class="text-lg">{{ modificationReceipt.difference >= 0 ? 'A favor del socio:' : 'Debe pagar:' }}</span>
                <span class="font-mono text-2xl font-bold" :class="modificationReceipt.difference >= 0 ? 'text-success' : 'text-error'">
                  {{ modificationReceipt.difference >= 0 ? '+' : '' }}$<CopyOnDblClickNumber :value="modificationReceipt.difference" />
                </span>
              </div>
              
              <div class="mt-4">
                <h4 class="font-medium mb-2">Manejo de la diferencia:</h4>
                <p class="text-sm">{{ modificationReceipt.differenceHandling }}</p>
              </div>
            </div>
            
            <div class="flex items-baseline text-2xl font-bold">
              <span class="flex-shrink-0">Operación neta:</span>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <span class="flex-shrink-0 text-primary font-mono"><CopyOnDblClickNumber :value="Math.abs(modificationReceipt.difference)" /></span>
            </div>
          </div>
          
          <div class="text-right mt-6">
            <button class="btn btn-success btn-lg" @click="confirmModification" :disabled="isProcessing">
              <span v-if="isProcessing" class="loading loading-spinner loading-xs mr-2"></span>
              <span v-if="!isProcessing">Confirmar Modificación</span>
              <span v-else>Procesando...</span>
            </button>
          </div>
        </div>
        
        <!-- Vista de recibo para transferencia -->
        <div v-else-if="showTransferReceipt" class="bg-base-100 p-8 rounded-2xl shadow-lg">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold">Transferencia de Acciones</h2>
            <button class="btn btn-outline btn-sm" @click="cancelTransfer">Cancelar</button>
          </div>
          
          <div class="space-y-4">
            <div class="bg-base-200 p-4 rounded-lg">
              <h3 class="font-semibold mb-2">Detalle de la transferencia</h3>
              <div class="flex items-baseline">
                <div class="flex-shrink-0">
                  <p class="font-semibold text-xl">{{ transferReceipt.stockType }}</p>
                  <p class="text-sm text-base-content/70">
                    {{ transferReceipt.quantity }} uds. x $
                    <CopyOnDblClickNumber :value="transferReceipt.unitValue" />
                  </p>
                  <p class="text-sm text-base-content/70">De: {{ selectedMember.name }}</p>
                  <p class="text-sm text-base-content/70">Para: {{ transferReceipt.toMemberName }}</p>
                </div>
                <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                <div class="flex-shrink-0">
                  <p class="w-36 text-right font-mono text-2xl"><CopyOnDblClickNumber :value="transferReceipt.totalValue" /></p>
                </div>
              </div>
            </div>
            
            <div class="flex items-baseline text-2xl font-bold">
              <span class="flex-shrink-0">Total a transferir:</span>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <span class="flex-shrink-0 text-primary font-mono"><CopyOnDblClickNumber :value="transferReceipt.totalValue" /></span>
            </div>
          </div>
          
          <div class="text-right mt-6">
            <button class="btn btn-success btn-lg" @click="confirmTransfer" :disabled="isProcessing">
              <span v-if="isProcessing" class="loading loading-spinner loading-xs mr-2"></span>
              <span v-if="!isProcessing">Confirmar Transferencia</span>
              <span v-else>Procesando...</span>
            </button>
          </div>
        </div>
        
        <!-- Vista de recibo para pago de crédito -->
        <div v-else-if="showLoanPaymentReceipt" class="bg-base-100 p-8 rounded-2xl shadow-lg">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold">Pago de Crédito con Acciones</h2>
            <button class="btn btn-outline btn-sm" @click="cancelLoanPayment">Cancelar</button>
          </div>
          
          <div class="space-y-4">
            <div class="bg-base-200 p-4 rounded-lg">
              <h3 class="font-semibold mb-2">Detalle del pago</h3>
              <div class="flex items-baseline">
                <div class="flex-shrink-0">
                  <p class="font-semibold text-xl">{{ loanPaymentReceipt.stockType }}</p>
                  <p class="text-sm text-base-content/70">
                    {{ loanPaymentReceipt.quantity }} uds. x $
                    <CopyOnDblClickNumber :value="loanPaymentReceipt.unitValue" />
                  </p>
                  <p class="text-sm text-base-content/70">Crédito: {{ loanPaymentReceipt.loanType }}</p>
                </div>
                <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                <div class="flex-shrink-0">
                  <p class="w-36 text-right font-mono text-2xl whitespace-nowrap"><CopyOnDblClickNumber :value="loanPaymentReceipt.totalValue" /></p>
                </div>
              </div>
            </div>
            
            <div class="bg-base-200 p-4 rounded-lg">
              <h3 class="font-semibold mb-2">Impacto en el crédito</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>Saldo actual:</span>
                  <span class="font-mono"><CopyOnDblClickNumber :value="loanPaymentReceipt.currentBalance" /></span>
                </div>
                <div class="flex justify-between">
                  <span>Abono:</span>
                  <span class="font-mono text-success">-<CopyOnDblClickNumber :value="loanPaymentReceipt.totalValue" /></span>
                </div>
                <div class="border-t border-base-300/50 pt-2">
                  <div class="flex justify-between font-bold">
                    <span>Nuevo saldo:</span>
                    <span class="font-mono" :class="loanPaymentReceipt.newBalance > 0 ? 'text-warning' : 'text-success'">
                      <CopyOnDblClickNumber :value="loanPaymentReceipt.newBalance" />
                    </span>
                  </div>
                </div>
                <div v-if="loanPaymentReceipt.newBalance > 0" class="text-sm text-base-content/70">
                  El crédito queda con saldo pendiente
                </div>
                <div v-else-if="loanPaymentReceipt.newBalance < 0" class="text-sm text-base-content/70">
                  Queda un saldo a favor de $<CopyOnDblClickNumber :value="Math.abs(loanPaymentReceipt.newBalance)" />
                </div>
                <div v-else class="text-sm text-success">
                  El crédito queda completamente pagado
                </div>
              </div>
            </div>
            
            <div class="flex items-baseline text-2xl font-bold">
              <span class="flex-shrink-0">Total aplicado:</span>
              <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
              <span class="flex-shrink-0 text-primary font-mono"><CopyOnDblClickNumber :value="loanPaymentReceipt.totalValue" /></span>
            </div>
          </div>
          
          <div class="text-right mt-6">
            <button class="btn btn-success btn-lg" @click="confirmLoanPayment" :disabled="isProcessing">
              <span v-if="isProcessing" class="loading loading-spinner loading-xs mr-2"></span>
              <span v-if="!isProcessing">Confirmar Pago</span>
              <span v-else>Procesando...</span>
            </button>
          </div>
        </div>
        
        <!-- Panel de botones de acciones -->
        <div v-else class="bg-base-100 p-8 rounded-2xl shadow-lg">
          <h3 class="text-xl font-bold mb-4">Acciones para {{ selectedMember.name }}</h3>
          
          <div v-if="memberSubscriptions.length > 0" class="space-y-4">
            <div class="alert alert-info">
              <span>Este socio tiene {{ memberSubscriptions.length }} tipo(s) de acciones disponibles para modificar.</span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button class="btn btn-primary btn-lg" @click="openTransferModal">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
                Transferir Acciones
              </button>
              
              <button class="btn btn-secondary btn-lg" @click="openLoanPaymentModal">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
                Usar para Pago de Créditos
              </button>
              
              <button class="btn btn-info btn-lg" @click="openModificationModal">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/>
                </svg>
                Modificar Acciones
              </button>
            </div>
          </div>
          
          <div v-else class="text-base-content/60 italic text-center py-8">
            Este socio no tiene acciones disponibles para modificar.
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de modificación de acciones -->
    <dialog v-if="showModificationModal" class="modal modal-open">
      <div class="modal-box max-w-4xl">
        <h3 class="font-bold text-lg mb-4">Modificar Acciones</h3>
        
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Acciones origen -->
            <div class="bg-base-200 p-4 rounded-lg">
              <h4 class="font-semibold mb-2 text-error">Entregar</h4>
              <div class="space-y-3">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Tipo de acción</span>
                  </label>
                  <select v-model="modificationForm.fromSubscriptionId" class="select select-bordered w-full">
                    <option value="">Seleccione una acción</option>
                    <option v-for="sub in memberSubscriptions" :key="sub.id" :value="sub.id">
                      {{ sub.stock?.type }} - {{ sub.quantity }} disponibles
                    </option>
                  </select>
                </div>
                
                <div v-if="modificationForm.fromSubscriptionId" class="form-control">
                  <label class="label">
                    <span class="label-text">Cantidad</span>
                  </label>
                  <input 
                    type="number" 
                    v-model="modificationForm.fromQuantity" 
                    class="input input-bordered w-full"
                    :max="selectedFromSubscription?.quantity || 0"
                    min="1"
                  >
                  <label class="label">
                    <span class="label-text-alt">Máximo: {{ selectedFromSubscription?.quantity || 0 }}</span>
                  </label>
                </div>
                
                <div v-if="modificationForm.fromQuantity > 0" class="bg-base-300/50 p-3 rounded">
                  <p class="text-sm">
                    <span class="font-medium">Valor total:</span>
                    <span class="ml-2 font-mono"><CopyOnDblClickNumber :value="fromTotalValue" /></span>
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Acciones destino -->
            <div class="bg-base-200 p-4 rounded-lg">
              <h4 class="font-semibold mb-2 text-success">Recibir</h4>
              <div class="space-y-3">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Tipo de acción</span>
                  </label>
                  <select v-model="modificationForm.toStockId" class="select select-bordered w-full">
                    <option value="">Seleccione una acción</option>
                    <option v-for="stock in availableStocks" :key="stock.id" :value="stock.id">
                      {{ stock.type }} - $<CopyOnDblClickNumber :value="stock.value" /> c/u
                    </option>
                  </select>
                </div>
                
                <div v-if="modificationForm.toStockId" class="form-control">
                  <label class="label">
                    <span class="label-text">Cantidad</span>
                  </label>
                  <input 
                    type="number" 
                    v-model="modificationForm.toQuantity" 
                    class="input input-bordered w-full"
                    min="1"
                  >
                </div>
                
                <div v-if="modificationForm.toQuantity > 0" class="bg-base-300/50 p-3 rounded">
                  <p class="text-sm">
                    <span class="font-medium">Valor total:</span>
                    <span class="ml-2 font-mono"><CopyOnDblClickNumber :value="toTotalValue" /></span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Cálculo de diferencia -->
          <div v-if="modificationForm.fromQuantity > 0 && modificationForm.toQuantity > 0" class="bg-base-200 p-4 rounded-lg">
            <h4 class="font-semibold mb-2">Diferencia</h4>
            <div class="flex items-center justify-between mb-4">
              <span class="text-lg">{{ difference >= 0 ? 'A favor del socio:' : 'Debe pagar:' }}</span>
              <span class="font-mono text-2xl font-bold" :class="difference >= 0 ? 'text-success' : 'text-error'">
                {{ difference >= 0 ? '+' : '' }}$<CopyOnDblClickNumber :value="difference" />
              </span>
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text">Manejo de la diferencia</span>
              </label>
              <select v-model="modificationForm.differenceHandling" class="select select-bordered w-full">
                <option value="">Seleccione cómo manejar la diferencia</option>
                <option v-if="difference > 0" value="cash">Entregar en efectivo</option>
                <option v-if="difference > 0" value="credit">Abonar a crédito existente</option>
                <option v-if="difference < 0" value="cash">Pagar en efectivo</option>
                <option v-if="difference < 0" value="credit">Financiar con crédito</option>
              </select>
            </div>
            
            <div v-if="modificationForm.differenceHandling === 'credit' && difference > 0" class="form-control mt-2">
              <label class="label">
                <span class="label-text">Crédito a abonar</span>
              </label>
              <select v-model="modificationForm.targetLoanId" class="select select-bordered w-full">
                <option value="">Seleccione un crédito</option>
                <option v-for="loan in memberLoans" :key="loan.id" :value="loan.id">
                  {{ loan.loan_type }} - Saldo: $<CopyOnDblClickNumber :value="loan.outstanding_balance" />
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="modal-action">
          <button class="btn btn-outline" @click="closeModificationModal">Cancelar</button>
          <button 
            class="btn btn-primary" 
            @click="prepareModificationReceipt"
            :disabled="!isModificationFormValid"
          >
            Preparar Modificación
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click.prevent="closeModificationModal">Cerrar</button>
      </form>
    </dialog>

    <!-- Modal de transferencia -->
    <dialog v-if="showTransferModal" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Transferir Acciones</h3>
        
        <div class="space-y-4">
          <!-- Selección de acción -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Seleccionar acción a transferir</span>
            </label>
            <select v-model="transferForm.subscriptionId" class="select select-bordered w-full">
              <option value="">Seleccione una acción</option>
              <option v-for="sub in memberSubscriptions" :key="sub.id" :value="sub.id">
                {{ sub.stock?.type }} - {{ sub.quantity }} unidades disponibles
              </option>
            </select>
          </div>
          
          <!-- Cantidad a transferir -->
          <div v-if="transferForm.subscriptionId" class="form-control">
            <label class="label">
              <span class="label-text">Cantidad a transferir</span>
            </label>
            <input 
              type="number" 
              v-model="transferForm.quantity" 
              class="input input-bordered w-full"
              :max="selectedSubscription?.quantity || 0"
              min="1"
            >
            <label class="label">
              <span class="label-text-alt">Máximo: {{ selectedSubscription?.quantity || 0 }} unidades</span>
            </label>
          </div>
          
          <!-- Selección del socio destino -->
          <div v-if="transferForm.quantity > 0" class="form-control">
            <label class="label">
              <span class="label-text">Transferir a</span>
            </label>
            <select v-model="transferForm.toMemberId" class="select select-bordered w-full">
              <option value="">Seleccione un socio</option>
              <option v-for="member in otherMembers" :key="member.id" :value="member.id">
                {{ member.name }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="modal-action">
          <button class="btn btn-outline" @click="closeTransferModal">Cancelar</button>
          <button 
            class="btn btn-primary" 
            @click="prepareTransferReceipt"
            :disabled="!transferForm.subscriptionId || !transferForm.quantity || !transferForm.toMemberId"
          >
            Preparar Transferencia
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click.prevent="closeTransferModal">Cerrar</button>
      </form>
    </dialog>

    <!-- Modal de pago de crédito -->
    <dialog v-if="showLoanPaymentModal" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Usar Acciones para Pago de Créditos</h3>
        
        <div class="space-y-4">
          <!-- Selección de acción -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Seleccionar acción a usar</span>
            </label>
            <select v-model="loanPaymentForm.subscriptionId" class="select select-bordered w-full">
              <option value="">Seleccione una acción</option>
              <option v-for="sub in memberSubscriptions" :key="sub.id" :value="sub.id">
                {{ sub.stock?.type }} - {{ sub.quantity }} unidades disponibles
              </option>
            </select>
          </div>
          
          <!-- Cantidad a usar -->
          <div v-if="loanPaymentForm.subscriptionId" class="form-control">
            <label class="label">
              <span class="label-text">Cantidad a usar</span>
            </label>
            <input 
              type="number" 
              v-model="loanPaymentForm.quantity" 
              class="input input-bordered w-full"
              :max="selectedSubscriptionForLoan?.quantity || 0"
              min="1"
            >
            <label class="label">
              <span class="label-text-alt">Máximo: {{ selectedSubscriptionForLoan?.quantity || 0 }} unidades</span>
            </label>
          </div>
          
          <!-- Selección del crédito -->
          <div v-if="loanPaymentForm.quantity > 0" class="form-control">
            <label class="label">
              <span class="label-text">Aplicar a crédito</span>
            </label>
            <select v-model="loanPaymentForm.loanId" class="select select-bordered w-full">
              <option value="">Seleccione un crédito</option>
              <option v-for="loan in memberLoans" :key="loan.id" :value="loan.id">
                {{ loan.loan_type }} - Saldo: $<CopyOnDblClickNumber :value="loan.outstanding_balance" />
              </option>
            </select>
          </div>
        </div>
        
        <div class="modal-action">
          <button class="btn btn-outline" @click="closeLoanPaymentModal">Cancelar</button>
          <button 
            class="btn btn-primary" 
            @click="prepareLoanPaymentReceipt"
            :disabled="!loanPaymentForm.subscriptionId || !loanPaymentForm.quantity || !loanPaymentForm.loanId"
          >
            Preparar Pago
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click.prevent="closeLoanPaymentModal">Cerrar</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useActiveMeetingStore } from '../stores/activeMeeting'
import { stocksService, type StockSubscription } from '@/features/stocks/services/stocksService'
import { loansService, type Loan } from '@/features/loans/services/loansService'
import type { Stock } from '@/features/stocks/types'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'

const activeMeetingStore = useActiveMeetingStore()

// Interfaz para las operaciones registradas
interface RegisteredOperation {
  id: string
  type: 'TRANSFER' | 'LOAN_PAYMENT' | 'STOCK_MODIFICATION'
  description: string
  memberId: string
  memberName: string
  stockType: string
  quantity: number
  unitValue: number
  totalValue: number
  timestamp: Date
  // Para transferencias
  toMemberId?: string
  toMemberName?: string
  // Para pagos de créditos
  loanId?: string
  loanType?: string
  previousBalance?: number
  newBalance?: number
  // Para modificaciones de acciones
  fromStockType?: string
  fromQuantity?: number
  fromValue?: number
  toStockType?: string
  toQuantity?: number
  toValue?: number
  difference?: number
  differenceHandling?: string
}

// Estados principales
const isLoading = ref(false)
const error = ref('')
const selectedMember = ref<{ id: string; name: string } | null>(null)
const isProcessing = ref(false)
const showAllOperations = ref(false)

// Datos del socio seleccionado
const memberSubscriptions = ref<StockSubscription[]>([])
const memberLoans = ref<Loan[]>([])
const availableStocks = ref<Stock[]>([])

// Operaciones registradas
const registeredOperations = ref<RegisteredOperation[]>([])
const selectedOperation = ref<RegisteredOperation | null>(null)

// Estados de modales
const showTransferModal = ref(false)
const showLoanPaymentModal = ref(false)
const showModificationModal = ref(false)
const showTransferReceipt = ref(false)
const showLoanPaymentReceipt = ref(false)
const showModificationReceipt = ref(false)

// Formularios
const transferForm = ref({
  subscriptionId: '',
  quantity: 0,
  toMemberId: ''
})

const loanPaymentForm = ref({
  subscriptionId: '',
  quantity: 0,
  loanId: ''
})

const modificationForm = ref({
  fromSubscriptionId: '',
  fromQuantity: 0,
  toStockId: '',
  toQuantity: 0,
  differenceHandling: '',
  targetLoanId: ''
})

// Recibos
const transferReceipt = ref<{
  stockType: string
  quantity: number
  unitValue: number
  totalValue: number
  toMemberName: string
}>({
  stockType: '',
  quantity: 0,
  unitValue: 0,
  totalValue: 0,
  toMemberName: ''
})

const loanPaymentReceipt = ref<{
  stockType: string
  quantity: number
  unitValue: number
  totalValue: number
  loanType: string
  currentBalance: number
  newBalance: number
}>({
  stockType: '',
  quantity: 0,
  unitValue: 0,
  totalValue: 0,
  loanType: '',
  currentBalance: 0,
  newBalance: 0
})

const modificationReceipt = ref<{
  fromStockType: string
  fromQuantity: number
  fromUnitValue: number
  fromValue: number
  toStockType: string
  toQuantity: number
  toUnitValue: number
  toValue: number
  difference: number
  differenceHandling: string
}>({
  fromStockType: '',
  fromQuantity: 0,
  fromUnitValue: 0,
  fromValue: 0,
  toStockType: '',
  toQuantity: 0,
  toUnitValue: 0,
  toValue: 0,
  difference: 0,
  differenceHandling: ''
})

// Computadas
const members = computed(() => activeMeetingStore.members)

const otherMembers = computed(() => 
  members.value.filter(m => m.id !== selectedMember.value?.id)
)

const selectedSubscription = computed(() => 
  memberSubscriptions.value.find(sub => sub.id === transferForm.value.subscriptionId)
)

const selectedSubscriptionForLoan = computed(() => 
  memberSubscriptions.value.find(sub => sub.id === loanPaymentForm.value.subscriptionId)
)

const selectedFromSubscription = computed(() => 
  memberSubscriptions.value.find(sub => sub.id === modificationForm.value.fromSubscriptionId)
)

const selectedToStock = computed(() => 
  availableStocks.value.find(stock => stock.id === modificationForm.value.toStockId)
)

const fromTotalValue = computed(() => 
  (selectedFromSubscription.value?.stock?.value || 0) * modificationForm.value.fromQuantity
)

const toTotalValue = computed(() => 
  (selectedToStock.value?.value || 0) * modificationForm.value.toQuantity
)

const difference = computed(() => 
  fromTotalValue.value - toTotalValue.value
)

const isModificationFormValid = computed(() => 
  modificationForm.value.fromSubscriptionId && 
  modificationForm.value.fromQuantity > 0 && 
  modificationForm.value.toStockId && 
  modificationForm.value.toQuantity > 0 && 
  modificationForm.value.differenceHandling &&
  (modificationForm.value.differenceHandling !== 'credit' || modificationForm.value.targetLoanId)
)

const totalTransfers = computed(() => 
  registeredOperations.value.filter(op => op.type === 'TRANSFER').length
)

const totalLoanPayments = computed(() => 
  registeredOperations.value.filter(op => op.type === 'LOAN_PAYMENT').length
)

const totalModifications = computed(() => 
  registeredOperations.value.filter(op => op.type === 'STOCK_MODIFICATION').length
)

const memberOperations = computed(() => 
  selectedMember.value ? registeredOperations.value.filter(op => op.memberId === selectedMember.value!.id) : []
)

// Métodos
onMounted(async () => {
  await activeMeetingStore.fetchMembers()
  availableStocks.value = await stocksService.getStocks()
})

function getOperationTypeColor(type: string) {
  switch (type) {
    case 'TRANSFER': return 'text-primary'
    case 'LOAN_PAYMENT': return 'text-success'
    case 'STOCK_MODIFICATION': return 'text-info'
    default: return 'text-base-content'
  }
}

function getOperationTypeLabel(type: string) {
  switch (type) {
    case 'TRANSFER': return 'Transferencia'
    case 'LOAN_PAYMENT': return 'Pago Crédito'
    case 'STOCK_MODIFICATION': return 'Modificación'
    default: return 'Operación'
  }
}

async function selectMember(member: { id: string; name: string }) {
  selectedMember.value = member
  selectedOperation.value = null
  showTransferReceipt.value = false
  showLoanPaymentReceipt.value = false
  showModificationReceipt.value = false
  
  try {
    isLoading.value = true
    const [subscriptions, loans] = await Promise.all([
      stocksService.getStockSubscriptionsByMember(member.id),
      loansService.getActiveLoansByMember(member.id)
    ])
    memberSubscriptions.value = subscriptions.filter(sub => sub.status === 'active')
    memberLoans.value = loans.filter(loan => loan.outstanding_balance > 0)
  } catch (err) {
    error.value = 'Error al cargar datos del socio'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

function hasOperations(memberId: string): boolean {
  return registeredOperations.value.some(op => op.memberId === memberId)
}

function showOperationDetail(operation: RegisteredOperation) {
  selectedOperation.value = operation
}

function closeOperationDetail() {
  selectedOperation.value = null
}

// Funciones de modificación de acciones
function openModificationModal() {
  showModificationModal.value = true
  modificationForm.value = {
    fromSubscriptionId: '',
    fromQuantity: 0,
    toStockId: '',
    toQuantity: 0,
    differenceHandling: '',
    targetLoanId: ''
  }
}

function closeModificationModal() {
  showModificationModal.value = false
}

function prepareModificationReceipt() {
  const fromSub = selectedFromSubscription.value
  const toStock = selectedToStock.value
  
  if (!fromSub || !toStock) return
  
  const differenceHandlingLabels = {
    'cash': difference.value >= 0 ? 'Entregar en efectivo' : 'Pagar en efectivo',
    'credit': difference.value >= 0 ? 'Abonar a crédito existente' : 'Financiar con crédito'
  }
  
  modificationReceipt.value = {
    fromStockType: fromSub.stock?.type || '',
    fromQuantity: modificationForm.value.fromQuantity,
    fromUnitValue: fromSub.stock?.value || 0,
    fromValue: fromTotalValue.value,
    toStockType: toStock.type,
    toQuantity: modificationForm.value.toQuantity,
    toUnitValue: toStock.value,
    toValue: toTotalValue.value,
    difference: difference.value,
    differenceHandling: differenceHandlingLabels[modificationForm.value.differenceHandling as keyof typeof differenceHandlingLabels] || ''
  }
  
  showModificationModal.value = false
  showModificationReceipt.value = true
}

function cancelModification() {
  showModificationReceipt.value = false
}

async function confirmModification() {
  if (!selectedMember.value) return
  
  const fromSub = selectedFromSubscription.value
  const toStock = selectedToStock.value
  
  if (!fromSub || !toStock) return
  
  isProcessing.value = true
  try {
    // Aquí iría la llamada al backend para registrar la modificación
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simular llamada API
    
    // Crear el registro de la operación
    const operation: RegisteredOperation = {
      id: `modification-${Date.now()}-${Math.random()}`,
      type: 'STOCK_MODIFICATION',
      description: `Modificación ${modificationForm.value.fromQuantity} ${fromSub.stock?.type} → ${modificationForm.value.toQuantity} ${toStock.type}`,
      memberId: selectedMember.value.id,
      memberName: selectedMember.value.name,
      stockType: 'Intercambio',
      quantity: 0,
      unitValue: 0,
      totalValue: Math.abs(difference.value),
      timestamp: new Date(),
      fromStockType: fromSub.stock?.type || '',
      fromQuantity: modificationForm.value.fromQuantity,
      fromValue: fromTotalValue.value,
      toStockType: toStock.type,
      toQuantity: modificationForm.value.toQuantity,
      toValue: toTotalValue.value,
      difference: difference.value,
      differenceHandling: modificationReceipt.value.differenceHandling
    }
    
    registeredOperations.value.push(operation)
    
    // Actualizar las suscripciones del socio
    await selectMember(selectedMember.value)
    
    showModificationReceipt.value = false
    alert('Modificación registrada exitosamente')
  } catch (err) {
    error.value = 'Error al procesar la modificación'
  } finally {
    isProcessing.value = false
  }
}

// Funciones de transferencia
function openTransferModal() {
  showTransferModal.value = true
  transferForm.value = {
    subscriptionId: '',
    quantity: 0,
    toMemberId: ''
  }
}

function closeTransferModal() {
  showTransferModal.value = false
}

function prepareTransferReceipt() {
  const subscription = selectedSubscription.value
  const toMember = members.value.find(m => m.id === transferForm.value.toMemberId)
  
  if (!subscription || !toMember) return
  
  transferReceipt.value = {
    stockType: subscription.stock?.type || '',
    quantity: transferForm.value.quantity,
    unitValue: subscription.stock?.value || 0,
    totalValue: transferForm.value.quantity * (subscription.stock?.value || 0),
    toMemberName: toMember.name
  }
  
  showTransferModal.value = false
  showTransferReceipt.value = true
}

function cancelTransfer() {
  showTransferReceipt.value = false
}

async function confirmTransfer() {
  if (!selectedMember.value) return
  
  const subscription = selectedSubscription.value
  const toMember = members.value.find(m => m.id === transferForm.value.toMemberId)
  
  if (!subscription || !toMember) return
  
  isProcessing.value = true
  try {
    // Aquí iría la llamada al backend para registrar la transferencia
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simular llamada API
    
    // Crear el registro de la operación
    const operation: RegisteredOperation = {
      id: `transfer-${Date.now()}-${Math.random()}`,
      type: 'TRANSFER',
      description: `Transferencia ${transferForm.value.quantity} ${subscription.stock?.type}`,
      memberId: selectedMember.value.id,
      memberName: selectedMember.value.name,
      stockType: subscription.stock?.type || '',
      quantity: transferForm.value.quantity,
      unitValue: subscription.stock?.value || 0,
      totalValue: transferForm.value.quantity * (subscription.stock?.value || 0),
      timestamp: new Date(),
      toMemberId: transferForm.value.toMemberId,
      toMemberName: toMember.name
    }
    
    registeredOperations.value.push(operation)
    
    // Actualizar las suscripciones del socio
    await selectMember(selectedMember.value)
    
    showTransferReceipt.value = false
    alert('Transferencia registrada exitosamente')
  } catch (err) {
    error.value = 'Error al procesar la transferencia'
  } finally {
    isProcessing.value = false
  }
}

// Funciones de pago de crédito
function openLoanPaymentModal() {
  showLoanPaymentModal.value = true
  loanPaymentForm.value = {
    subscriptionId: '',
    quantity: 0,
    loanId: ''
  }
}

function closeLoanPaymentModal() {
  showLoanPaymentModal.value = false
}

function prepareLoanPaymentReceipt() {
  const subscription = selectedSubscriptionForLoan.value
  const loan = memberLoans.value.find(l => l.id === loanPaymentForm.value.loanId)
  
  if (!subscription || !loan) return
  
  const totalValue = loanPaymentForm.value.quantity * (subscription.stock?.value || 0)
  const newBalance = loan.outstanding_balance - totalValue
  
  loanPaymentReceipt.value = {
    stockType: subscription.stock?.type || '',
    quantity: loanPaymentForm.value.quantity,
    unitValue: subscription.stock?.value || 0,
    totalValue,
    loanType: loan.loan_type,
    currentBalance: loan.outstanding_balance,
    newBalance
  }
  
  showLoanPaymentModal.value = false
  showLoanPaymentReceipt.value = true
}

function cancelLoanPayment() {
  showLoanPaymentReceipt.value = false
}

async function confirmLoanPayment() {
  if (!selectedMember.value) return
  
  const subscription = selectedSubscriptionForLoan.value
  const loan = memberLoans.value.find(l => l.id === loanPaymentForm.value.loanId)
  
  if (!subscription || !loan) return
  
  isProcessing.value = true
  try {
    // Aquí iría la llamada al backend para registrar el pago
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simular llamada API
    
    const totalValue = loanPaymentForm.value.quantity * (subscription.stock?.value || 0)
    const newBalance = loan.outstanding_balance - totalValue
    
    // Crear el registro de la operación
    const operation: RegisteredOperation = {
      id: `loan-payment-${Date.now()}-${Math.random()}`,
      type: 'LOAN_PAYMENT',
      description: `Pago ${loanPaymentForm.value.quantity} ${subscription.stock?.type} a ${loan.loan_type}`,
      memberId: selectedMember.value.id,
      memberName: selectedMember.value.name,
      stockType: subscription.stock?.type || '',
      quantity: loanPaymentForm.value.quantity,
      unitValue: subscription.stock?.value || 0,
      totalValue,
      timestamp: new Date(),
      loanId: loanPaymentForm.value.loanId,
      loanType: loan.loan_type,
      previousBalance: loan.outstanding_balance,
      newBalance
    }
    
    registeredOperations.value.push(operation)
    
    // Actualizar las suscripciones y préstamos del socio
    await selectMember(selectedMember.value)
    
    showLoanPaymentReceipt.value = false
    alert('Pago registrado exitosamente')
  } catch (err) {
    error.value = 'Error al procesar el pago'
  } finally {
    isProcessing.value = false
  }
}
</script> 