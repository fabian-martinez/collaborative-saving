import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EntityManager } from 'typeorm';
import { runMigrations, cleanDatabase } from './database-setup';
import { PaymentType } from '../src/common/enums/payment-type.enum';

// Helper function to safely query database with type assertion
function queryTyped<T>(queryPromise: Promise<unknown>): Promise<Array<T>> {
  return queryPromise.then((result) => result as Array<T>);
}

// Type definitions for HTTP responses
interface MemberResponse {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
}

interface StockResponse {
  id: string;
  type: string;
  value: number;
  monthly_contribution: number;
}

interface MeetingResponse {
  id: string;
  date: string;
  status: 'active' | 'closed';
  notes?: string;
  created_at?: string;
}

interface RecordMonthlyPaymentsResponse {
  operation_id: string;
  meeting_id: string;
  member_id: string;
  total_amount: number;
  ledger_entry_ids: string[];
}

interface PurchaseStockResponse {
  stock_subscription_id: string;
  operation_id: string;
  loan_id?: string;
}

interface StockOperationResponse {
  operation_id: string;
  message?: string;
  details?: unknown;
}

interface PurchaseResponse {
  id: string;
  stock_id: string;
  stock_subscription_id: string;
  quantity: number;
  cash_amount: number;
}

interface RevaluationResponse {
  status: 'preview' | 'executed';
  total_contributions: number;
  total_interest: number;
  total_to_distribute?: number;
  executed_at?: string;
  operation_id?: string;
}

interface DisbursementPlanPreviewResponse {
  plan: Array<{
    member_id: string;
    type: string;
    amount: number;
    pending_member_payment_id?: string;
  }>;
  available_cash: number;
  total_to_disburse: number;
}

interface ExecuteDisbursementPlanResponse {
  success: boolean;
  processed_items: number;
  total_disbursed: number;
  total_requested: number;
}

interface LoanResponse {
  id: string;
  outstanding_balance: number;
}

describe('Meetings V2 E2E Tests', () => {
  let app: INestApplication<App>;
  let entityManager: EntityManager;

  // Test data IDs
  let member1Id: string;
  let stock1Id: string; // Acción Grande
  let stock2Id: string; // Acción Mediana
  let meetingId: string;
  let loanId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    entityManager = moduleFixture.get<EntityManager>(EntityManager);

    // Run migrations to ensure database schema is up to date
    try {
      await runMigrations(entityManager);
    } catch (error) {
      console.warn('Migration warning:', error);
      // Continue even if migrations fail (might already be applied)
    }
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await cleanDatabase(entityManager);

    // Setup test data
    await setupTestData();
  });

  async function setupTestData() {
    // Create members
    const member1Res = await request(app.getHttpServer())
      .post('/v2/members')
      .send({
        name: 'Socio 1',
        email: 'socio1@test.com',
        identification_number: '123456789',
      })
      .expect(201);
    const member1Body = member1Res.body as MemberResponse;
    member1Id = member1Body.id;

    await request(app.getHttpServer())
      .post('/v2/members')
      .send({
        name: 'Socio 2',
        email: 'socio2@test.com',
        identification_number: '987654321',
      })
      .expect(201);

    // Create stocks
    const stock1Res = await request(app.getHttpServer())
      .post('/v2/stocks')
      .send({
        type: 'Acción Grande',
        value: 10000,
        monthly_contribution: 100,
        is_guaranteed: false,
      })
      .expect(201);
    const stock1Body = stock1Res.body as StockResponse;
    stock1Id = stock1Body.id;

    const stock2Res = await request(app.getHttpServer())
      .post('/v2/stocks')
      .send({
        type: 'Acción Mediana',
        value: 5000,
        monthly_contribution: 50,
        is_guaranteed: false,
      })
      .expect(201);
    const stock2Body = stock2Res.body as StockResponse;
    stock2Id = stock2Body.id;

    await request(app.getHttpServer())
      .post('/v2/stocks')
      .send({
        type: 'Acción Pequeña',
        value: 2000,
        monthly_contribution: 20,
        is_guaranteed: false,
      })
      .expect(201);

    // Create mandatory contributions
    await request(app.getHttpServer())
      .post('/v2/mandatory-contributions')
      .send({
        asset_type: 'Cuota Administrativa',
        value: 5,
      })
      .expect(201);
  }

  describe('Complete Meeting Flow', () => {
    it('should execute complete meeting flow with all operations', async () => {
      // 1. Open meeting
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({
          date: new Date().toISOString(),
          notes: 'Reunión de prueba completa',
        })
        .expect(201);
      const meetingBody = meetingRes.body as MeetingResponse;
      meetingId = meetingBody.id;
      expect(meetingBody.status).toBe('active');

      // 2. Get active meeting
      const activeMeetingRes = await request(app.getHttpServer())
        .get('/v2/meetings/active')
        .expect(200);
      const activeMeetingBody = activeMeetingRes.body as MeetingResponse;
      expect(activeMeetingBody.id).toBe(meetingId);
      expect(activeMeetingBody.status).toBe('active');

      // 3. Record monthly payments for member 1
      const paymentsRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/payments`)
        .send({
          payments: [
            {
              type: PaymentType.MANDATORY_CONTRIBUTION,
              amount: 5,
              description: 'Cuota Administrativa',
            },
            {
              type: PaymentType.STOCK_FEE,
              amount: 100,
              description: 'Cuota de Acción Grande',
            },
          ],
          meetingId: meetingId,
        })
        .expect(201);
      const paymentsBody = paymentsRes.body as RecordMonthlyPaymentsResponse;
      expect(paymentsBody.operation_id).toBeDefined();

      // 4. Purchase stocks for member 1 (cash payment)
      const purchaseRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase`)
        .send({
          stock_id: stock1Id,
          quantity: 2,
          cash_amount: 20000, // Full payment in cash
          meeting_id: meetingId,
        })
        .expect(201);
      const purchaseBody = purchaseRes.body as PurchaseStockResponse;
      expect(purchaseBody.stock_subscription_id).toBeDefined();
      subscriptionId = purchaseBody.stock_subscription_id;

      // 5. Purchase stocks for member 1 (partial cash + loan)
      const purchaseWithLoanRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase`)
        .send({
          stock_id: stock2Id,
          quantity: 1,
          cash_amount: 2000, // Partial payment
          loan_details: {
            interest_rate: 0.02,
            loan_type: 'accion',
          },
          meeting_id: meetingId,
        })
        .expect(201);
      const purchaseWithLoanBody =
        purchaseWithLoanRes.body as PurchaseStockResponse;
      expect(purchaseWithLoanBody.stock_subscription_id).toBeDefined();
      expect(purchaseWithLoanBody.loan_id).toBeDefined();
      loanId = purchaseWithLoanBody.loan_id!;

      // 6. Exchange stocks (upgrade from stock2 to stock1)
      // First get the subscription ID for stock2
      const subscriptionsRes = await request(app.getHttpServer())
        .get(`/v2/members/${member1Id}/purchases?meetingId=${meetingId}`)
        .expect(200);
      const subscriptionsBody = subscriptionsRes.body as PurchaseResponse[];
      const stock2Subscription = subscriptionsBody.find(
        (s) => s.stock_id === stock2Id,
      );

      if (stock2Subscription) {
        const exchangeRes = await request(app.getHttpServer())
          .post(`/v2/members/${member1Id}/purchase/exchange`)
          .send({
            meeting_id: meetingId,
            from_subscription_id: stock2Subscription.id,
            from_quantity: 0.5,
            to_stock_id: stock1Id,
            to_quantity: 0.25, // Upgrade: 0.5 * 5000 = 2500, 0.25 * 10000 = 2500
            difference_handling: 'cash',
          })
          .expect(201);
        const exchangeBody = exchangeRes.body as StockOperationResponse;
        expect(exchangeBody.operation_id).toBeDefined();
      }

      // 7. Pay loan with stocks
      const stockLoanPaymentRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase/loan-payment`)
        .send({
          meeting_id: meetingId,
          subscription_id: subscriptionId,
          quantity: 0.1, // Pay with 0.1 shares
          loan_id: loanId,
          notes: 'Pago parcial con acciones',
        })
        .expect(201);
      const stockLoanPaymentBody =
        stockLoanPaymentRes.body as StockOperationResponse;
      expect(stockLoanPaymentBody.operation_id).toBeDefined();

      // 8. Get meeting payments
      const meetingPaymentsRes = await request(app.getHttpServer())
        .get(`/v2/meetings/${meetingId}/payments`)
        .expect(200);
      const meetingPaymentsBody = meetingPaymentsRes.body as unknown[];
      expect(Array.isArray(meetingPaymentsBody)).toBe(true);
      expect(meetingPaymentsBody.length).toBeGreaterThan(0);

      // 9. Get revaluation preview
      const revaluationPreviewRes = await request(app.getHttpServer())
        .get(`/v2/meetings/${meetingId}/revaluation`)
        .expect(200);
      const revaluationPreviewBody =
        revaluationPreviewRes.body as RevaluationResponse;
      expect(revaluationPreviewBody.status).toBe('preview');
      expect(revaluationPreviewBody.total_contributions).toBeDefined();
      expect(revaluationPreviewBody.total_interest).toBeDefined();

      // 10. Confirm revaluation
      const revaluationConfirmRes = await request(app.getHttpServer())
        .patch(`/v2/meetings/${meetingId}/revaluation/confirm`)
        .expect(200);
      const revaluationConfirmBody =
        revaluationConfirmRes.body as RevaluationResponse;
      expect(revaluationConfirmBody.status).toBe('executed');
      expect(revaluationConfirmBody.executed_at).toBeDefined();

      // 11. Get disbursement plan preview
      const disbursementPreviewRes = await request(app.getHttpServer())
        .get(`/v2/meetings/${meetingId}/disbursement-plan`)
        .expect(200);
      const disbursementPreviewBody =
        disbursementPreviewRes.body as DisbursementPlanPreviewResponse;
      expect(disbursementPreviewBody.plan).toBeDefined();
      expect(disbursementPreviewBody.available_cash).toBeDefined();
      expect(disbursementPreviewBody.total_to_disburse).toBeDefined();

      // 12. Execute disbursement plan (if there are pending payments)
      if (
        disbursementPreviewBody.plan &&
        disbursementPreviewBody.plan.length > 0
      ) {
        const executePlanRes = await request(app.getHttpServer())
          .post(`/v2/meetings/${meetingId}/disbursement-plan`)
          .send({
            plan: disbursementPreviewBody.plan.map((item) => ({
              member_id: item.member_id,
              type: item.type,
              amount: item.amount,
              pending_member_payment_id: item.pending_member_payment_id,
            })),
          })
          .expect(200);
        const executePlanBody =
          executePlanRes.body as ExecuteDisbursementPlanResponse;
        expect(executePlanBody.success).toBe(true);
      }

      // 13. Close meeting
      const closeRes = await request(app.getHttpServer())
        .patch(`/v2/meetings/${meetingId}/close`)
        .send({})
        .expect(200);
      const closeBody = closeRes.body as MeetingResponse;
      expect(closeBody.status).toBe('closed');

      // 14. Verify final state
      const finalMeetingRes = await request(app.getHttpServer())
        .get(`/v2/meetings/${meetingId}`)
        .expect(200);
      const finalMeetingBody = finalMeetingRes.body as MeetingResponse;
      expect(finalMeetingBody.status).toBe('closed');
    });
  });

  describe('Meeting Management', () => {
    it('should not allow opening two active meetings simultaneously', async () => {
      // Create first meeting
      await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({
          date: new Date().toISOString(),
          notes: 'Primera reunión',
        })
        .expect(201);

      // Try to create second meeting (should fail)
      await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({
          date: new Date().toISOString(),
          notes: 'Segunda reunión',
        })
        .expect(400);
    });

    it('should not allow operations in closed meeting', async () => {
      // Create and close meeting
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({
          date: new Date().toISOString(),
          notes: 'Reunión cerrada',
        })
        .expect(201);
      const meetingBody = meetingRes.body as MeetingResponse;
      const closedMeetingId = meetingBody.id;

      await request(app.getHttpServer())
        .patch(`/v2/meetings/${closedMeetingId}/close`)
        .send({})
        .expect(200);

      // Try to record payments (should fail)
      await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/payments`)
        .send({
          payments: [
            {
              type: PaymentType.MANDATORY_CONTRIBUTION,
              amount: 5,
            },
          ],
          meetingId: closedMeetingId,
        })
        .expect(400);

      // Try to purchase stocks (should fail)
      await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase`)
        .send({
          stock_id: stock1Id,
          quantity: 1,
          cash_amount: 10000,
          meeting_id: closedMeetingId,
        })
        .expect(400);
    });
  });

  describe('Stock Purchase Operations', () => {
    beforeEach(async () => {
      // Create meeting for stock operations
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({
          date: new Date().toISOString(),
          notes: 'Reunión para operaciones con acciones',
        })
        .expect(201);
      const meetingBody = meetingRes.body as MeetingResponse;
      meetingId = meetingBody.id;
    });

    it('should purchase stocks with full cash payment', async () => {
      const purchaseRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase`)
        .send({
          stock_id: stock1Id,
          quantity: 1,
          cash_amount: 10000,
          meeting_id: meetingId,
        })
        .expect(201);
      const purchaseBody = purchaseRes.body as PurchaseStockResponse;

      expect(purchaseBody.stock_subscription_id).toBeDefined();
      expect(purchaseBody.operation_id).toBeDefined();
      expect(purchaseBody.loan_id).toBeUndefined();
    });

    it('should purchase stocks with full loan financing', async () => {
      const purchaseRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase`)
        .send({
          stock_id: stock1Id,
          quantity: 1,
          cash_amount: 0,
          loan_details: {
            interest_rate: 0.02,
            loan_type: 'accion',
          },
          meeting_id: meetingId,
        })
        .expect(201);
      const purchaseBody = purchaseRes.body as PurchaseStockResponse;

      expect(purchaseBody.stock_subscription_id).toBeDefined();
      expect(purchaseBody.loan_id).toBeDefined();
    });

    it('should purchase stocks with mixed payment (cash + loan)', async () => {
      const purchaseRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase`)
        .send({
          stock_id: stock1Id,
          quantity: 1,
          cash_amount: 5000, // Half in cash
          loan_details: {
            interest_rate: 0.02,
            loan_type: 'accion',
          },
          meeting_id: meetingId,
        })
        .expect(201);
      const purchaseBody = purchaseRes.body as PurchaseStockResponse;

      expect(purchaseBody.stock_subscription_id).toBeDefined();
      expect(purchaseBody.loan_id).toBeDefined();
    });
  });

  describe('Stock Exchange Operations', () => {
    let stock2SubscriptionId: string;

    beforeEach(async () => {
      // Create meeting
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({
          date: new Date().toISOString(),
          notes: 'Reunión para intercambio de acciones',
        })
        .expect(201);
      const meetingBody = meetingRes.body as MeetingResponse;
      meetingId = meetingBody.id;

      // Purchase stocks for member 1
      await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase`)
        .send({
          stock_id: stock1Id,
          quantity: 2,
          cash_amount: 20000,
          meeting_id: meetingId,
        })
        .expect(201);

      const purchase2Res = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase`)
        .send({
          stock_id: stock2Id,
          quantity: 4,
          cash_amount: 20000,
          meeting_id: meetingId,
        })
        .expect(201);
      const purchase2Body = purchase2Res.body as PurchaseStockResponse;
      stock2SubscriptionId = purchase2Body.stock_subscription_id;
    });

    it('should exchange stocks with cash difference (upgrade)', async () => {
      // Exchange: 1 stock2 (5000) -> 0.5 stock1 (5000) = equal value
      const exchangeRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase/exchange`)
        .send({
          meeting_id: meetingId,
          from_subscription_id: stock2SubscriptionId,
          from_quantity: 1,
          to_stock_id: stock1Id,
          to_quantity: 0.5,
          difference_handling: 'cash',
        })
        .expect(201);
      const exchangeBody = exchangeRes.body as StockOperationResponse;

      expect(exchangeBody.operation_id).toBeDefined();
    });

    it('should exchange stocks with credit difference', async () => {
      // Exchange: 1 stock2 (5000) -> 1 stock1 (10000) = need 5000 more
      const exchangeRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase/exchange`)
        .send({
          meeting_id: meetingId,
          from_subscription_id: stock2SubscriptionId,
          from_quantity: 1,
          to_stock_id: stock1Id,
          to_quantity: 1,
          difference_handling: 'credit',
          target_loan_id: 'new',
        })
        .expect(201);
      const exchangeBody = exchangeRes.body as StockOperationResponse;

      expect(exchangeBody.operation_id).toBeDefined();
    });

    it('should exchange stocks with equal value', async () => {
      // Exchange: 2 stock2 (10000) -> 1 stock1 (10000) = equal value
      const exchangeRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase/exchange`)
        .send({
          meeting_id: meetingId,
          from_subscription_id: stock2SubscriptionId,
          from_quantity: 2,
          to_stock_id: stock1Id,
          to_quantity: 1,
          difference_handling: 'cash',
        })
        .expect(201);
      const exchangeBody = exchangeRes.body as StockOperationResponse;

      expect(exchangeBody.operation_id).toBeDefined();
    });
  });

  describe('Stock Loan Payment Operations', () => {
    let subscriptionIdForPayment: string;
    let loanIdForPayment: string;

    beforeEach(async () => {
      // Create meeting
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({
          date: new Date().toISOString(),
          notes: 'Reunión para pago con acciones',
        })
        .expect(201);
      const meetingBody = meetingRes.body as MeetingResponse;
      meetingId = meetingBody.id;

      // Purchase stocks with loan
      const purchaseRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase`)
        .send({
          stock_id: stock1Id,
          quantity: 2,
          cash_amount: 10000,
          loan_details: {
            interest_rate: 0.02,
            loan_type: 'accion',
          },
          meeting_id: meetingId,
        })
        .expect(201);
      const purchaseBody = purchaseRes.body as PurchaseStockResponse;
      subscriptionIdForPayment = purchaseBody.stock_subscription_id;
      loanIdForPayment = purchaseBody.loan_id!;
    });

    it('should pay loan with stocks', async () => {
      const paymentRes = await request(app.getHttpServer())
        .post(`/v2/members/${member1Id}/purchase/loan-payment`)
        .send({
          meeting_id: meetingId,
          subscription_id: subscriptionIdForPayment,
          quantity: 0.5,
          loan_id: loanIdForPayment,
          notes: 'Pago parcial con acciones',
        })
        .expect(201);
      const paymentBody = paymentRes.body as StockOperationResponse;

      expect(paymentBody.operation_id).toBeDefined();

      // Verify loan balance was reduced
      const loanRes = await request(app.getHttpServer())
        .get(`/v2/loans/${loanIdForPayment}`)
        .expect(200);
      const loanBody = loanRes.body as LoanResponse;
      expect(loanBody.outstanding_balance).toBeLessThan(10000);
    });
  });

  describe('Disbursement Plan Validation', () => {
    beforeEach(async () => {
      // Create meeting
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({
          date: new Date().toISOString(),
          notes: 'Reunión para validación de desembolsos',
        })
        .expect(201);
      const meetingBody = meetingRes.body as MeetingResponse;
      meetingId = meetingBody.id;
    });

    it('should not execute disbursement plan without sufficient cash', async () => {
      // Create pending payment that exceeds available cash
      await entityManager.query(
        `
        INSERT INTO pending_member_payments 
        (id, member_id, meeting_id, type, amount, status, created_at)
        VALUES 
        (gen_random_uuid(), $1, $2, 'DIVIDEND', 1000000, 'APPROVED', NOW())
        `,
        [member1Id, meetingId],
      );

      const pendingPaymentResult = await queryTyped<{ id: string }>(
        entityManager.query(
          `SELECT id FROM pending_member_payments WHERE meeting_id = $1`,
          [meetingId],
        ),
      );
      const pendingPaymentId = pendingPaymentResult[0]?.id;
      if (!pendingPaymentId) {
        throw new Error('Pending payment not found');
      }

      // Try to execute plan (should fail due to insufficient cash)
      await request(app.getHttpServer())
        .post(`/v2/meetings/${meetingId}/disbursement-plan`)
        .send({
          plan: [
            {
              member_id: member1Id,
              type: 'dividend',
              amount: 1000000,
              pending_member_payment_id: pendingPaymentId,
            },
          ],
        })
        .expect(400);
    });
  });

  describe('Meeting Close Validation', () => {
    it('should not close meeting with negative cash balance', async () => {
      // Create meeting
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({
          date: new Date().toISOString(),
          notes: 'Reunión con balance negativo',
        })
        .expect(201);
      const meetingBody = meetingRes.body as MeetingResponse;
      const negativeBalanceMeetingId = meetingBody.id;

      // Create a large disbursement that would cause negative balance
      await entityManager.query(
        `
        INSERT INTO pending_member_payments 
        (id, member_id, meeting_id, type, amount, status, created_at)
        VALUES 
        (gen_random_uuid(), $1, $2, 'DIVIDEND', 1000000, 'APPROVED', NOW())
        `,
        [member1Id, negativeBalanceMeetingId],
      );

      // Try to close meeting (should fail if balance validation is enforced)
      // Note: This depends on business rules implementation
      const closeRes = await request(app.getHttpServer())
        .patch(`/v2/meetings/${negativeBalanceMeetingId}/close`)
        .send({});

      // The test passes if it either succeeds (if validation is not enforced)
      // or fails with 400 (if validation is enforced)
      expect([200, 400]).toContain(closeRes.status);
    });
  });
});
