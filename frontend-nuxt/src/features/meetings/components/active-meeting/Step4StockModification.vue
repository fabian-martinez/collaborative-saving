<template>
  <div>
    <div v-if="isLoadingMembers" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="memberError && !isLoadingMembers" class="alert alert-error mb-4">
      <span>{{ memberError }}</span>
    </div>

    <div v-if="!isLoadingMembers && !memberError" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Columna izquierda: Resumen y lista de socios -->
      <div class="md:col-span-1">
        <!-- Resumen sticky - se mantiene visible al hacer scroll -->
        <ModificationSummary
          :registered-operations="stockModification.registeredOperations.value"
          :members="membersList"
        />
        <MemberList
          :members="membersList"
          :selected-member="selectedMemberValue"
          :is-member-paid="() => false"
          :has-completed-purchase="hasOperations"
          :get-initials="memberSelection.getInitials"
          :get-member-color="memberSelection.getMemberColor"
          @select-member="handleSelectMember"
        />
      </div>

      <!-- Columna derecha: Panel de operaciones -->
      <div class="md:col-span-2">
        <div class="card bg-base-100 shadow-lg rounded-lg">
          <div class="card-body p-4 md:p-6">
            <div v-if="!hasSelectedMember" class="flex items-center justify-center h-64 text-base-content/60">
              <p class="text-center">Seleccione un socio para realizar modificaciones de acciones.</p>
            </div>

            <!-- Vista de detalle de operación -->
            <div v-else-if="stockModification.selectedOperation.value">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Detalle de operación</h2>
                <button class="btn btn-outline btn-sm" @click="closeOperationDetail">Regresar</button>
              </div>
              <OperationDetails :operation="stockModification.selectedOperation.value" />
            </div>

            <!-- Vista de recibo para modificación de acciones -->
            <div v-else-if="stockModification.showModificationReceipt.value" class="bg-base-100 p-8 rounded-2xl shadow-lg">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Modificación de Acciones</h2>
                <button class="btn btn-outline btn-sm" @click="cancelModification">Cancelar</button>
              </div>

              <div class="space-y-4" v-if="stockModification.modificationReceipt.value">
                <div class="bg-base-200 p-4 rounded-lg">
                  <h3 class="font-semibold mb-2">Detalle del intercambio</h3>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <h4 class="font-medium text-error">Entregar:</h4>
                      <p class="text-lg">{{ stockModification.modificationReceipt.value.fromStockType }}</p>
                      <p class="text-sm text-base-content/70">
                        {{ stockModification.modificationReceipt.value.fromQuantity }} uds. x $
                        <CopyOnDblClickNumber :value="stockModification.modificationReceipt.value.fromUnitValue" />
                      </p>
                      <p class="font-mono text-lg">-<CopyOnDblClickNumber :value="stockModification.modificationReceipt.value.fromValue" /></p>
                    </div>
                    <div>
                      <h4 class="font-medium text-success">Recibir:</h4>
                      <p class="text-lg">{{ stockModification.modificationReceipt.value.toStockType }}</p>
                      <p class="text-sm text-base-content/70">
                        {{ stockModification.modificationReceipt.value.toQuantity }} uds. x $
                        <CopyOnDblClickNumber :value="stockModification.modificationReceipt.value.toUnitValue" />
                      </p>
                      <p class="font-mono text-lg">+<CopyOnDblClickNumber :value="stockModification.modificationReceipt.value.toValue" /></p>
                    </div>
                  </div>
                </div>

                <div class="bg-base-200 p-4 rounded-lg">
                  <h3 class="font-semibold mb-2">Diferencia</h3>
                  <div class="flex items-center justify-between">
                    <span class="text-lg">{{ stockModification.modificationReceipt.value.difference >= 0 ? 'A favor del socio:' : 'Debe pagar:' }}</span>
                    <span class="font-mono text-2xl font-bold" :class="stockModification.modificationReceipt.value.difference >= 0 ? 'text-success' : 'text-error'">
                      {{ stockModification.modificationReceipt.value.difference >= 0 ? '+' : '' }}$<CopyOnDblClickNumber :value="stockModification.modificationReceipt.value.difference" />
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
                  <span class="flex-shrink-0 text-primary font-mono"><CopyOnDblClickNumber :value="Math.abs(stockModification.modificationReceipt.value.difference)" /></span>
                </div>
              </div>

              <div class="text-right mt-6">
                <button class="btn btn-success btn-lg" @click="confirmModification" :disabled="stockModification.isProcessing.value">
                  <span v-if="stockModification.isProcessing.value" class="loading loading-spinner loading-xs mr-2"></span>
                  <span v-if="!stockModification.isProcessing.value">Confirmar Modificación</span>
                  <span v-else>Procesando...</span>
                </button>
              </div>
            </div>

            <!-- Vista de recibo para transferencia -->
            <div v-else-if="stockModification.showTransferReceipt.value" class="bg-base-100 p-8 rounded-2xl shadow-lg">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Transferencia de Acciones</h2>
                <button class="btn btn-outline btn-sm" @click="cancelTransfer">Cancelar</button>
              </div>

              <div class="space-y-4" v-if="stockModification.transferReceipt.value">
                <div class="bg-base-200 p-4 rounded-lg">
                  <h3 class="font-semibold mb-2">Detalle de la transferencia</h3>
                  <div class="flex items-baseline">
                    <div class="flex-shrink-0">
                      <p class="font-semibold text-xl">{{ stockModification.transferReceipt.value.stockType }}</p>
                      <p class="text-sm text-base-content/70">
                        {{ stockModification.transferReceipt.value.quantity }} uds. x $
                        <CopyOnDblClickNumber :value="stockModification.transferReceipt.value.unitValue" />
                      </p>
                      <p class="text-sm text-base-content/70">De: {{ selectedMemberValue?.name }}</p>
                      <p class="text-sm text-base-content/70">Para: {{ stockModification.transferReceipt.value.toMemberName }}</p>
                    </div>
                    <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                    <div class="flex-shrink-0">
                      <p class="w-36 text-right font-mono text-2xl"><CopyOnDblClickNumber :value="stockModification.transferReceipt.value.totalValue" /></p>
                    </div>
                  </div>
                </div>

                <div class="flex items-baseline text-2xl font-bold">
                  <span class="flex-shrink-0">Total a transferir:</span>
                  <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                  <span class="flex-shrink-0 text-primary font-mono"><CopyOnDblClickNumber :value="stockModification.transferReceipt.value.totalValue" /></span>
                </div>
              </div>

              <div class="text-right mt-6">
                <button class="btn btn-success btn-lg" @click="confirmTransfer" :disabled="stockModification.isProcessing.value">
                  <span v-if="stockModification.isProcessing.value" class="loading loading-spinner loading-xs mr-2"></span>
                  <span v-if="!stockModification.isProcessing.value">Confirmar Transferencia</span>
                  <span v-else>Procesando...</span>
                </button>
              </div>
            </div>

            <!-- Vista de recibo para pago de crédito -->
            <div v-else-if="stockModification.showLoanPaymentReceipt.value" class="bg-base-100 p-8 rounded-2xl shadow-lg">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Pago de Crédito con Acciones</h2>
                <button class="btn btn-outline btn-sm" @click="cancelLoanPayment">Cancelar</button>
              </div>

              <div class="space-y-4" v-if="stockModification.loanPaymentReceipt.value">
                <div class="bg-base-200 p-4 rounded-lg">
                  <h3 class="font-semibold mb-2">Detalle del pago</h3>
                  <div class="flex items-baseline">
                    <div class="flex-shrink-0">
                      <p class="font-semibold text-xl">{{ stockModification.loanPaymentReceipt.value.stockType }}</p>
                      <p class="text-sm text-base-content/70">
                        {{ stockModification.loanPaymentReceipt.value.quantity }} uds. x $
                        <CopyOnDblClickNumber :value="stockModification.loanPaymentReceipt.value.unitValue" />
                      </p>
                      <p class="text-sm text-base-content/70">Crédito: {{ stockModification.loanPaymentReceipt.value.loanType }}</p>
                    </div>
                    <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                    <div class="flex-shrink-0">
                      <p class="w-36 text-right font-mono text-2xl whitespace-nowrap"><CopyOnDblClickNumber :value="stockModification.loanPaymentReceipt.value.totalValue" /></p>
                    </div>
                  </div>
                </div>

                <div class="bg-base-200 p-4 rounded-lg">
                  <h3 class="font-semibold mb-2">Impacto en el crédito</h3>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span>Saldo actual:</span>
                      <span class="font-mono"><CopyOnDblClickNumber :value="stockModification.loanPaymentReceipt.value.currentBalance" /></span>
                    </div>
                    <div class="flex justify-between">
                      <span>Abono:</span>
                      <span class="font-mono text-success">-<CopyOnDblClickNumber :value="stockModification.loanPaymentReceipt.value.totalValue" /></span>
                    </div>
                    <div class="border-t border-base-300/50 pt-2">
                      <div class="flex justify-between font-bold">
                        <span>Nuevo saldo:</span>
                        <span class="font-mono" :class="stockModification.loanPaymentReceipt.value.newBalance > 0 ? 'text-warning' : 'text-success'">
                          <CopyOnDblClickNumber :value="stockModification.loanPaymentReceipt.value.newBalance" />
                        </span>
                      </div>
                    </div>
                    <div v-if="stockModification.loanPaymentReceipt.value.newBalance > 0" class="text-sm text-base-content/70">
                      El crédito queda con saldo pendiente
                    </div>
                    <div v-else-if="stockModification.loanPaymentReceipt.value.newBalance < 0" class="text-sm text-base-content/70">
                      Queda un saldo a favor de $<CopyOnDblClickNumber :value="Math.abs(stockModification.loanPaymentReceipt.value.newBalance)" />
                    </div>
                    <div v-else class="text-sm text-success">
                      El crédito queda completamente pagado
                    </div>
                  </div>
                </div>

                <div class="flex items-baseline text-2xl font-bold">
                  <span class="flex-shrink-0">Total aplicado:</span>
                  <div class="flex-grow border-b-2 border-dotted border-base-300/70 mx-4"></div>
                  <span class="flex-shrink-0 text-primary font-mono"><CopyOnDblClickNumber :value="stockModification.loanPaymentReceipt.value.totalValue" /></span>
                </div>
              </div>

              <div class="text-right mt-6">
                <button class="btn btn-success btn-lg" @click="confirmLoanPayment" :disabled="stockModification.isProcessing.value">
                  <span v-if="stockModification.isProcessing.value" class="loading loading-spinner loading-xs mr-2"></span>
                  <span v-if="!stockModification.isProcessing.value">Confirmar Pago</span>
                  <span v-else>Procesando...</span>
                </button>
              </div>
            </div>

            <!-- Panel principal de operaciones -->
            <div v-else>
              <!-- Toggle para ver operaciones registradas -->
              <div v-if="hasSelectedMember && hasCompletedOperations" class="mb-4 flex justify-end items-center gap-3">
                <span class="text-sm" :class="showOperationsReceipt ? 'text-base-content/60' : 'text-base-content'">
                  Agregar más operaciones
                </span>
                <input
                  type="checkbox"
                  class="toggle toggle-primary"
                  :checked="showOperationsReceipt"
                  @change="showOperationsReceipt = !showOperationsReceipt"
                />
                <span class="text-sm" :class="showOperationsReceipt ? 'text-base-content' : 'text-base-content/60'">
                  Ver operaciones registradas
                </span>
              </div>

              <!-- Vista de operaciones registradas -->
              <div v-if="showOperationsReceipt && viewedOperations && viewedOperations.length > 0">
                <PaymentReceiptView
                  :member-name="selectedMemberValue?.name || ''"
                  :print-date="memberSelection.printDate.value"
                  :viewed-operations="viewedOperations"
                  :viewed-total="memberSelection.viewedTotal.value"
                  title="Detalle de Operaciones"
                  total-label="Total:"
                  receipt-id="operations-receipt-print"
                  @open-print-modal="printReceipt.openPrintModal"
                />
              </div>

              <!-- Panel de botones y operaciones -->
              <div v-else>
                <div class="mb-6">
                  <h3 class="text-lg md:text-xl font-bold mb-2 break-words">
                    Acciones para {{ selectedMemberValue?.name }}
                  </h3>
                </div>

                <div v-if="stockModification.memberSubscriptions.value.length > 0" class="space-y-4">
                  <div class="alert alert-info">
                    <span>Este socio tiene {{ stockModification.memberSubscriptions.value.length }} tipo(s) de acciones disponibles para modificar.</span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button class="btn btn-primary btn-lg gap-2 px-6" @click="stockModification.openTransferModal()">
                      <ArrowRight class="w-6 h-6" />
                      <span>Transferir Acciones</span>
                    </button>

                    <button class="btn btn-secondary btn-lg gap-2 px-6" @click="stockModification.openLoanPaymentModal()">
                      <Wallet class="w-6 h-6" />
                      <span>Pagar Crédito</span>
                    </button>

                    <button class="btn btn-info btn-lg gap-2 px-6" @click="stockModification.openModificationModal()">
                      <CoinsSwap class="w-6 h-6" />
                      <span>Modificar Acciones</span>
                    </button>
                  </div>
                </div>

                <div v-else class="text-base-content/60 italic text-center py-8">
                  Este socio no tiene acciones disponibles para modificar.
                </div>

                <!-- Lista de operaciones registradas del miembro -->
                <div v-if="memberOperations.length > 0" class="mt-6">
                  <h4 class="font-semibold mb-3">Operaciones Registradas</h4>
                  <div class="space-y-2">
                    <div
                      v-for="op in memberOperations"
                      :key="op.id"
                      class="bg-base-200 p-3 rounded-md cursor-pointer hover:bg-primary/10 transition"
                      @click="showOperationDetail(op)"
                    >
                      <div class="flex justify-between items-center">
                        <span class="font-semibold">{{ op.description || 'Operación sin descripción' }}</span>
                        <span class="badge badge-sm">{{ getOperationTypeLabel(op.type) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales con DaisyUI -->
    <!-- Modal de Transferencia -->
    <dialog v-if="stockModification.showTransferModal.value" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Transferir Acciones</h3>

        <div class="space-y-4">
          <!-- Selección de acción -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Seleccionar acción a transferir</span>
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
                {{ sub.stock?.type || 'Acción' }} - {{ sub.quantity }} unidades disponibles
              </option>
            </select>
          </div>

          <!-- Cantidad a transferir -->
          <div v-if="stockModification.transferForm.value.transferSubscriptionId" class="form-control">
            <label class="label">
              <span class="label-text">Cantidad a transferir</span>
            </label>
            <input
              type="number"
              v-model.number="stockModification.transferForm.value.transferQuantity"
              class="input input-bordered w-full"
              :max="selectedSubscription?.quantity || 0"
              min="1"
            >
            <label class="label">
              <span class="label-text-alt">Máximo: {{ selectedSubscription?.quantity || 0 }} unidades</span>
            </label>
          </div>

          <!-- Selección del socio destino -->
          <div v-if="stockModification.transferForm.value.transferQuantity && stockModification.transferForm.value.transferQuantity > 0" class="form-control">
            <label class="label">
              <span class="label-text">Transferir a</span>
            </label>
            <select
              v-model="stockModification.transferForm.value.toMemberId"
              class="select select-bordered w-full"
            >
              <option value="">Seleccione un socio</option>
              <option v-for="member in otherMembers" :key="member.id" :value="member.id">
                {{ member.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-outline" @click="stockModification.closeTransferModal()">Cancelar</button>
          <button
            class="btn btn-primary"
            @click="prepareTransferReceipt"
            :disabled="!isTransferFormValid"
          >
            Preparar Transferencia
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click.prevent="stockModification.closeTransferModal()">Cerrar</button>
      </form>
    </dialog>

    <!-- Modal de Pago de Crédito -->
    <dialog v-if="stockModification.showLoanPaymentModal.value" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Usar Acciones para Pago de Créditos</h3>

        <div class="space-y-4">
          <!-- Selección de acción -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Seleccionar acción a usar</span>
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
                {{ sub.stock?.type || 'Acción' }} - {{ sub.quantity }} unidades disponibles
              </option>
            </select>
          </div>

          <!-- Cantidad a usar -->
          <div v-if="stockModification.loanPaymentForm.value.loanPaymentSubscriptionId" class="form-control">
            <label class="label">
              <span class="label-text">Cantidad a usar</span>
            </label>
            <input
              type="number"
              v-model.number="stockModification.loanPaymentForm.value.loanPaymentQuantity"
              class="input input-bordered w-full"
              :max="selectedSubscriptionForLoan?.quantity || 0"
              min="1"
            >
            <label class="label">
              <span class="label-text-alt">Máximo: {{ selectedSubscriptionForLoan?.quantity || 0 }} unidades</span>
            </label>
          </div>

          <!-- Selección del crédito -->
          <div v-if="stockModification.loanPaymentForm.value.loanPaymentQuantity && stockModification.loanPaymentForm.value.loanPaymentQuantity > 0" class="form-control">
            <label class="label">
              <span class="label-text">Aplicar a crédito</span>
            </label>
            <select
              v-model="stockModification.loanPaymentForm.value.loanId"
              class="select select-bordered w-full"
            >
              <option value="">Seleccione un crédito</option>
              <option v-for="loan in stockModification.memberLoans.value" :key="loan.id" :value="loan.id">
                {{ loan.loan_type }} - Saldo: ${{ loan.outstanding_balance.toLocaleString() }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-outline" @click="stockModification.closeLoanPaymentModal()">Cancelar</button>
          <button
            class="btn btn-primary"
            @click="prepareLoanPaymentReceipt"
            :disabled="!isLoanPaymentFormValid"
          >
            Preparar Pago
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click.prevent="stockModification.closeLoanPaymentModal()">Cerrar</button>
      </form>
    </dialog>

    <!-- Modal de Modificación de Acciones -->
    <dialog v-if="stockModification.showModificationModal.value" class="modal modal-open">
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
                      {{ sub.stock?.type || 'Acción' }} - {{ sub.quantity }} disponibles
                    </option>
                  </select>
                </div>

                <div v-if="stockModification.modificationForm.value.fromSubscriptionId" class="form-control">
                  <label class="label">
                    <span class="label-text">Cantidad</span>
                  </label>
                  <input
                    type="number"
                    v-model.number="stockModification.modificationForm.value.fromQuantity"
                    class="input input-bordered w-full"
                    :max="selectedFromSubscription?.quantity || 0"
                    min="1"
                  >
                  <label class="label">
                    <span class="label-text-alt">Máximo: {{ selectedFromSubscription?.quantity || 0 }}</span>
                  </label>
                </div>

                <div v-if="stockModification.modificationForm.value.fromQuantity && stockModification.modificationForm.value.fromQuantity > 0" class="bg-base-300/50 p-3 rounded">
                  <p class="text-sm">
                    <span class="font-medium">Valor total:</span>
                    <span class="ml-2 font-mono">${{ fromTotalValue.toLocaleString() }}</span>
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
                  <select
                    v-model="stockModification.modificationForm.value.toStockId"
                    class="select select-bordered w-full"
                  >
                    <option value="">Seleccione una acción</option>
                    <option v-for="stock in stockModification.availableStocks.value" :key="stock.id" :value="stock.id">
                      {{ stock.type }} - ${{ stock.value.toLocaleString() }} c/u
                    </option>
                  </select>
                </div>

                <div v-if="stockModification.modificationForm.value.toStockId" class="form-control">
                  <label class="label">
                    <span class="label-text">Cantidad</span>
                  </label>
                  <input
                    type="number"
                    v-model.number="stockModification.modificationForm.value.toQuantity"
                    class="input input-bordered w-full"
                    min="1"
                  >
                </div>

                <div v-if="stockModification.modificationForm.value.toQuantity && stockModification.modificationForm.value.toQuantity > 0" class="bg-base-300/50 p-3 rounded">
                  <p class="text-sm">
                    <span class="font-medium">Valor total:</span>
                    <span class="ml-2 font-mono">${{ toTotalValue.toLocaleString() }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Cálculo de diferencia -->
          <div v-if="stockModification.modificationForm.value.fromQuantity && stockModification.modificationForm.value.fromQuantity > 0 && stockModification.modificationForm.value.toQuantity && stockModification.modificationForm.value.toQuantity > 0" class="bg-base-200 p-4 rounded-lg">
            <h4 class="font-semibold mb-2">Diferencia</h4>
            <div class="flex items-center justify-between mb-4">
              <span class="text-lg">{{ modificationDifference >= 0 ? 'A favor del socio:' : 'Debe pagar:' }}</span>
              <span class="font-mono text-2xl font-bold" :class="modificationDifference >= 0 ? 'text-success' : 'text-error'">
                {{ modificationDifference >= 0 ? '+' : '' }}${{ Math.abs(modificationDifference).toLocaleString() }}
              </span>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Manejo de la diferencia</span>
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
                <span class="label-text">{{ modificationDifference > 0 ? 'Crédito a abonar' : 'Crear nuevo crédito' }}</span>
              </label>
              <select
                v-model="stockModification.modificationForm.value.targetLoanId"
                class="select select-bordered w-full"
              >
                <option value="">{{ modificationDifference > 0 ? 'Seleccione un crédito' : 'Seleccione tipo de crédito' }}</option>
                <template v-if="modificationDifference > 0">
                  <option v-for="loan in stockModification.memberLoans.value" :key="loan.id" :value="loan.id">
                    {{ loan.loan_type }} - Saldo: ${{ loan.outstanding_balance.toLocaleString() }}
                  </option>
                </template>
                <option v-if="modificationDifference < 0" value="new_action_loan">Crédito de Acción (2% interés)</option>
                <option v-if="modificationDifference < 0" value="new_current_loan">Crédito Corriente (2% interés)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-outline" @click="stockModification.closeModificationModal()">Cancelar</button>
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
        <button @click.prevent="stockModification.closeModificationModal()">Cerrar</button>
      </form>
    </dialog>

    <!-- Vistas de recibo (se mostrarán después de preparar la operación) -->
    <!-- TODO: Implementar vistas de recibo similares al archivo de referencia -->

    <!-- Modal de Vista Previa e Impresión -->
    <PrintReceiptModal
      :is-open="printReceipt.isPrintModalOpen.value"
      :member-name="selectedMemberValue?.name || null"
      :print-date="memberSelection.printDate.value"
      :viewed-operations="viewedOperations"
      :viewed-total="memberSelection.viewedTotal.value"
      title="Detalle de Operaciones"
      total-label="Total:"
      modal-id="operations-receipt-print-modal"
      @close="printReceipt.closePrintModal"
      @print="printReceipt.printReceipt"
    />

    <div class="mt-8 pt-4 border-t">
      <div class="text-right mt-4">
        <button class="btn btn-success w-full md:w-auto" @click="$emit('completed')">
          Finalizar modificaciones de acciones
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowRight, Wallet, CoinsSwap } from 'iconoir-vue/regular'
import { useActiveMeetingStore } from '../../stores/activeMeeting'
import { useStockModification } from '../../composables/useStockModification'
import { usePaymentCollection } from '../../composables/usePaymentCollection'
import { useMemberSelection } from '../../composables/useMemberSelection'
import { usePrintReceipt } from '../../composables/usePrintReceipt'
import type { Member } from '@/api/members.api'
import { operationsApi } from '@/api/operations.api'
import ModificationSummary from './collection/ModificationSummary.vue'
import MemberList from './collection/MemberList.vue'
import OperationDetails from '@/shared/components/OperationDetails.vue'
import PaymentReceiptView from './collection/PaymentReceiptView.vue'
import PrintReceiptModal from './collection/PrintReceiptModal.vue'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'

// 2. Props y emits
const emit = defineEmits<{
  completed: []
}>()

// 3. Composables y stores
const store = useActiveMeetingStore()
const stockModification = useStockModification()
const paymentCollection = usePaymentCollection()
const memberSelection = useMemberSelection(paymentCollection)
const printReceipt = usePrintReceipt(
  computed(() => memberSelection.selectedMember.value),
  'operations-receipt-print-modal',
  'operations-receipt-print-container',
  'operations-receipt-print'
)

// 4. Reactive state
const showOperationsReceipt = ref(false)
const viewedOperations = ref<any[] | null>(null)

// 5. Computed properties
const isLoadingMembers = computed(() => memberSelection.loadingMembers.value)
const memberError = computed(() => memberSelection.error.value || stockModification.error.value)
const membersList = computed(() => memberSelection.members.value)
const selectedMemberValue = computed(() => memberSelection.selectedMember.value)
const hasSelectedMember = computed(() => !!memberSelection.selectedMember.value)

const memberOperations = computed(() => {
  if (!selectedMemberValue.value) return []
  return stockModification.registeredOperations.value.filter(
    op => op.member_id === selectedMemberValue.value!.id
  )
})

const hasOperations = computed(() => (memberId: string) => {
  return stockModification.registeredOperations.value.some(op => op.member_id === memberId)
})

const hasCompletedOperations = computed(() => {
  if (!selectedMemberValue.value) return false
  return memberOperations.value.length > 0
})

const otherMembers = computed(() =>
  membersList.value.filter(m => m.id !== selectedMemberValue.value?.id)
)

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
    stockModification.transferForm.value.transferSubscriptionId &&
    stockModification.transferForm.value.transferQuantity &&
    stockModification.transferForm.value.transferQuantity > 0 &&
    stockModification.transferForm.value.toMemberId
  )
})

const isLoanPaymentFormValid = computed(() => {
  return !!(
    stockModification.loanPaymentForm.value.loanPaymentSubscriptionId &&
    stockModification.loanPaymentForm.value.loanPaymentQuantity &&
    stockModification.loanPaymentForm.value.loanPaymentQuantity > 0 &&
    stockModification.loanPaymentForm.value.loanId
  )
})

const isModificationFormValid = computed(() => {
  const form = stockModification.modificationForm.value
  const basic = !!(
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

// 6. Methods
async function handleSelectMember(member: Member) {
  await memberSelection.selectMember(member)
  await stockModification.loadMemberData(member.id)
  await loadMemberOperations()
}

async function loadMemberOperations() {
  if (!selectedMemberValue.value || !store.meetingId) {
    viewedOperations.value = null
    return
  }

  try {
    const operations = await Promise.all(
      memberOperations.value.map(async (op) => {
        try {
          return await operationsApi.getOperationById(op.id)
        } catch {
          return op
        }
      })
    )
    viewedOperations.value = operations
    memberSelection.viewedOperations.value = operations
  } catch (e) {
    console.error('Error loading member operations:', e)
    viewedOperations.value = null
  }
}

function showOperationDetail(operation: any) {
  stockModification.selectedOperation.value = operation
}

function closeOperationDetail() {
  stockModification.selectedOperation.value = null
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

function prepareTransferReceipt() {
  const subscription = selectedSubscription.value
  const toMember = otherMembers.value.find(m => m.id === stockModification.transferForm.value.toMemberId)

  if (!subscription || !toMember || !selectedMemberValue.value) return

  const quantity = stockModification.transferForm.value.transferQuantity || 0
  const unitValue = subscription.stock?.value || 0
  const totalValue = quantity * unitValue

  stockModification.transferReceipt.value = {
    stockType: subscription.stock?.type || 'Acción',
    quantity,
    unitValue,
    totalValue,
    toMemberName: toMember.name,
    // Guardar los IDs necesarios para la confirmación
    transfer_subscription_id: stockModification.transferForm.value.transferSubscriptionId!,
    transfer_quantity: stockModification.transferForm.value.transferQuantity!,
    to_member_id: stockModification.transferForm.value.toMemberId!
  }

  stockModification.closeTransferModal()
  stockModification.showTransferReceipt.value = true
}

function prepareLoanPaymentReceipt() {
  const subscription = selectedSubscriptionForLoan.value
  const loan = stockModification.memberLoans.value.find(l => l.id === stockModification.loanPaymentForm.value.loanId)

  if (!subscription || !loan) return

  const quantity = stockModification.loanPaymentForm.value.loanPaymentQuantity || 0
  const unitValue = subscription.stock?.value || 0
  const totalValue = quantity * unitValue
  const newBalance = loan.outstanding_balance - totalValue

  stockModification.loanPaymentReceipt.value = {
    stockType: subscription.stock?.type || 'Acción',
    quantity,
    unitValue,
    totalValue,
    loanType: loan.loan_type,
    currentBalance: loan.outstanding_balance,
    newBalance,
    // Guardar los IDs necesarios para la confirmación
    loan_payment_subscription_id: stockModification.loanPaymentForm.value.loanPaymentSubscriptionId!,
    loan_payment_quantity: stockModification.loanPaymentForm.value.loanPaymentQuantity!,
    loan_id: stockModification.loanPaymentForm.value.loanId!
  }

  stockModification.closeLoanPaymentModal()
  stockModification.showLoanPaymentReceipt.value = true
}

function prepareModificationReceipt() {
  const fromSub = selectedFromSubscription.value
  const toStock = selectedToStock.value

  if (!fromSub || !toStock || !selectedMemberValue.value) return

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
    // Guardar los IDs necesarios para la confirmación
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

function cancelTransfer() {
  stockModification.showTransferReceipt.value = false
  stockModification.transferReceipt.value = null
}

function cancelLoanPayment() {
  stockModification.showLoanPaymentReceipt.value = false
  stockModification.loanPaymentReceipt.value = null
}

function cancelModification() {
  stockModification.showModificationReceipt.value = false
  stockModification.modificationReceipt.value = null
}

async function confirmTransfer() {
  if (!selectedMemberValue.value || !store.meetingId) return

  try {
    // Usar los datos guardados en transferReceipt en lugar del formulario
    if (!stockModification.transferReceipt.value) {
      alert('Error: No hay datos de transferencia para confirmar')
      return
    }

    const data = {
      transfer_subscription_id: stockModification.transferReceipt.value.transfer_subscription_id,
      transfer_quantity: stockModification.transferReceipt.value.transfer_quantity,
      to_member_id: stockModification.transferReceipt.value.to_member_id
    }

    await stockModification.processTransfer(selectedMemberValue.value.id, data)
    await stockModification.loadMemberData(selectedMemberValue.value.id)
    await loadMemberOperations()
    stockModification.showTransferReceipt.value = false
    stockModification.transferReceipt.value = null
    alert('Transferencia procesada exitosamente')
  } catch (e) {
    alert('Error al procesar la transferencia')
    console.error(e)
  }
}

async function confirmLoanPayment() {
  if (!selectedMemberValue.value || !store.meetingId) return

  try {
    // Usar los datos guardados en loanPaymentReceipt en lugar del formulario
    if (!stockModification.loanPaymentReceipt.value) {
      alert('Error: No hay datos de pago de crédito para confirmar')
      return
    }

    const data = {
      loan_payment_subscription_id: stockModification.loanPaymentReceipt.value.loan_payment_subscription_id,
      loan_payment_quantity: stockModification.loanPaymentReceipt.value.loan_payment_quantity,
      loan_id: stockModification.loanPaymentReceipt.value.loan_id
    }

    await stockModification.processLoanPayment(selectedMemberValue.value.id, data)
    await stockModification.loadMemberData(selectedMemberValue.value.id)
    await loadMemberOperations()
    stockModification.showLoanPaymentReceipt.value = false
    stockModification.loanPaymentReceipt.value = null
    alert('Pago de crédito procesado exitosamente')
  } catch (e) {
    alert('Error al procesar el pago de crédito')
    console.error(e)
  }
}

async function confirmModification() {
  if (!selectedMemberValue.value || !store.meetingId) return

  try {
    // Usar los datos guardados en modificationReceipt en lugar del formulario
    if (!stockModification.modificationReceipt.value) {
      alert('Error: No hay datos de modificación para confirmar')
      return
    }

    const data = {
      from_subscription_id: stockModification.modificationReceipt.value.from_subscription_id,
      from_quantity: stockModification.modificationReceipt.value.from_quantity,
      to_stock_id: stockModification.modificationReceipt.value.to_stock_id,
      to_quantity: stockModification.modificationReceipt.value.to_quantity,
      difference_handling: stockModification.modificationReceipt.value.difference_handling,
      target_loan_id: stockModification.modificationReceipt.value.target_loan_id
    }

    await stockModification.processExchange(selectedMemberValue.value.id, data)
    await stockModification.loadMemberData(selectedMemberValue.value.id)
    await loadMemberOperations()
    stockModification.showModificationReceipt.value = false
    stockModification.modificationReceipt.value = null
    alert('Modificación procesada exitosamente')
  } catch (e) {
    alert('Error al procesar la modificación')
    console.error(e)
  }
}

// 7. Lifecycle hooks
onMounted(async () => {
  await memberSelection.loadMembers()
  if (store.meetingId) {
    await stockModification.loadRegisteredOperations()
  }
})

// Watcher para cuando el meetingId cambie
watch(
  () => store.meetingId,
  async (newMeetingId) => {
    if (newMeetingId) {
      await stockModification.loadRegisteredOperations()
    }
  }
)
</script>
