import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { PendingMemberPaymentType } from '@domain/entities/pending-member-payment.entity';
import { DisbursementPlanPreviewDto } from '@application/dto/meetings/disbursement-plan-preview.dto';
import {
  DisbursementPlanItemDto,
  DisbursementType,
} from '@application/dto/meetings/disbursement-plan-item.dto';
import { CASH_ACCOUNT } from '@domain/constants/account-types';
import { DisbursementStockRequestDto } from '@application/dto/meetings/disbursement-stock-request.dto';

/**
 * Get Disbursement Plan Preview Query Handler
 *
 * Retrieves pending disbursements for a meeting and calculates available cash
 */
export class GetDisbursementPlanPreviewQueryHandler {
  constructor(
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
  ) {}

  async execute(meetingId: string): Promise<DisbursementPlanPreviewDto> {
    // 1. Obtener todos los PendingMemberPayment pendientes de la reunión
    const pendingPayments =
      await this.pendingMemberPaymentRepository.findPendingByMeeting(meetingId);

    // 2. Calcular efectivo disponible sumando LedgerEntry con CASH_ACCOUNT
    const ledgerEntries =
      await this.ledgerEntryRepository.findByMeeting(meetingId);
    const cashEntries = ledgerEntries.filter(
      (entry) => entry.accountType === CASH_ACCOUNT,
    );
    const availableCash = cashEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    );

    // 3. Mapear PendingMemberPayment a DisbursementPlanItemDto
    const plan: DisbursementPlanItemDto[] = pendingPayments.map((p) => {
      // Mapear PendingMemberPaymentType a DisbursementType
      let disbursementType: DisbursementType;
      const paymentType = p.type;
      if (paymentType === PendingMemberPaymentType.DIVIDEND) {
        disbursementType = DisbursementType.DIVIDEND;
      } else if (paymentType === PendingMemberPaymentType.STOCK_WITHDRAWAL) {
        disbursementType = DisbursementType.WITHDRAWAL;
      } else if (paymentType === PendingMemberPaymentType.LOAN) {
        disbursementType = DisbursementType.LOAN;
      } else {
        disbursementType = DisbursementType.OTHER;
      }

      // Crear DisbursementStockRequest si hay stockSubscriptionId
      const disbursementStockRequest: DisbursementStockRequestDto | undefined =
        p.stockSubscriptionId && p.stockId
          ? {
              stockId: p.stockId,
              stockWithdrawalQuantity: undefined,
            }
          : undefined;

      return {
        memberId: p.memberId,
        type: disbursementType,
        amount: p.amount,
        status: p.status,
        notes: p.notes || undefined,
        stockSubscriptionId: p.stockSubscriptionId || undefined,
        loanId: p.loanId || undefined,
        pendingMemberPaymentId: p.id,
        disbursementStockRequest,
      };
    });

    // 4. Calcular total a desembolsar
    const totalToDisburse = plan.reduce((sum, item) => sum + item.amount, 0);

    return {
      plan,
      availableCash,
      totalToDisburse,
    };
  }
}
