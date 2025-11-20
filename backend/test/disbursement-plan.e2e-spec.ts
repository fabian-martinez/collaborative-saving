import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { EntityManager } from 'typeorm';

describe('Disbursement Plan (e2e)', () => {
  let app: INestApplication;
  let entityManager: EntityManager;

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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up relevant tables before each test
    await entityManager.query('DELETE FROM "ledger_entries"');
    await entityManager.query('DELETE FROM "operations"');
    await entityManager.query('DELETE FROM "pending_member_payments"');
    await entityManager.query('DELETE FROM "loan_transaction_details"');
    await entityManager.query('DELETE FROM "loans"');
    await entityManager.query('DELETE FROM "stock_subscriptions"');
    await entityManager.query('DELETE FROM "meetings"');
    await entityManager.query('DELETE FROM "stocks"');
    await entityManager.query('DELETE FROM "members"');
  });

  describe('GET /v2/meetings/:id/disbursement-plan', () => {
    it('should return empty plan when no pending payments', async () => {
      // Create a meeting
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({ date: new Date(), notes: 'Test meeting' })
        .expect(201);
      const meetingId = meetingRes.body.id as string;

      // Get preview
      const response = await request(app.getHttpServer())
        .get(`/v2/meetings/${meetingId}/disbursement-plan`)
        .expect(200);

      expect(response.body).toMatchObject({
        plan: [],
        available_cash: expect.any(Number),
        total_to_disburse: 0,
      });
    });

    it('should return preview with pending payments', async () => {
      // Create member
      const memberRes = await request(app.getHttpServer())
        .post('/v2/members')
        .send({
          name: 'Test Member',
          email: 'test@example.com',
        })
        .expect(201);
      const memberId = memberRes.body.id;

      // Create meeting
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({ date: new Date(), notes: 'Test meeting' })
        .expect(201);
      const meetingId = meetingRes.body.id;

      // Create initial cash (using RecordOperation would be better, but for simplicity)
      // We'll create a PendingMemberPayment which should appear in preview
      await entityManager.query(
        `
        INSERT INTO pending_member_payments 
        (id, member_id, meeting_id, type, amount, status, created_at)
        VALUES 
        (gen_random_uuid(), $1, $2, 'DIVIDEND', 500, 'APPROVED', NOW())
        `,
        [memberId, meetingId],
      );

      // Get preview
      const response = await request(app.getHttpServer())
        .get(`/v2/meetings/${meetingId}/disbursement-plan`)
        .expect(200);

      expect((response.body as { plan: unknown[] }).plan).toHaveLength(1);
      expect(
        (response.body as { plan: Array<Record<string, unknown>> }).plan[0],
      ).toMatchObject({
        member_id: memberId,
        type: 'dividend',
        amount: 500,
        status: 'APPROVED',
      });
      expect(
        (response.body as { total_to_disburse: number }).total_to_disburse,
      ).toBe(500);
    });

    it('should return 404 when meeting not found', async () => {
      await request(app.getHttpServer())
        .get('/v2/meetings/non-existent-id/disbursement-plan')
        .expect(404);
    });
  });

  describe('POST /v2/meetings/:id/disbursement-plan', () => {
    it('should return 400 when meeting is closed', async () => {
      // Create and close meeting
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({ date: new Date(), notes: 'Test meeting' })
        .expect(201);
      const meetingId = meetingRes.body.id as string;

      await request(app.getHttpServer())
        .patch(`/v2/meetings/${meetingId}/close`)
        .send({})
        .expect(200);

      // Try to execute plan
      await request(app.getHttpServer())
        .post(`/v2/meetings/${meetingId}/disbursement-plan`)
        .send({
          plan: [],
        })
        .expect(400);
    });

    it('should return 400 when insufficient cash', async () => {
      // Create member
      const memberRes = await request(app.getHttpServer())
        .post('/v2/members')
        .send({
          name: 'Test Member',
          email: 'test@example.com',
        })
        .expect(201);
      const memberId = memberRes.body.id;

      // Create meeting
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({ date: new Date(), notes: 'Test meeting' })
        .expect(201);
      const meetingId = meetingRes.body.id;

      // Create PendingMemberPayment
      await entityManager.query(
        `
        INSERT INTO pending_member_payments 
        (id, member_id, meeting_id, type, amount, status, created_at)
        VALUES 
        (gen_random_uuid(), $1, $2, 'DIVIDEND', 5000, 'APPROVED', NOW())
        `,
        [memberId, meetingId],
      );

      // Get pending payment ID
      const pendingPaymentResult = await entityManager.query(
        `SELECT id FROM pending_member_payments WHERE meeting_id = $1`,
        [meetingId],
      );
      const pendingPaymentResultTyped = pendingPaymentResult as Array<{
        id: string;
      }>;
      const pendingPaymentId = pendingPaymentResultTyped[0]?.id;

      // Try to execute plan (no cash available)
      await request(app.getHttpServer())
        .post(`/v2/meetings/${meetingId}/disbursement-plan`)
        .send({
          plan: [
            {
              member_id: memberId,
              type: 'dividend',
              amount: 5000,
              pending_member_payment_id: pendingPaymentId,
            },
          ],
        })
        .expect(400);
    });

    it('should validate request body', async () => {
      const meetingRes = await request(app.getHttpServer())
        .post('/v2/meetings')
        .send({ date: new Date(), notes: 'Test meeting' })
        .expect(201);
      const meetingId = meetingRes.body.id as string;

      // Missing plan
      await request(app.getHttpServer())
        .post(`/v2/meetings/${meetingId}/disbursement-plan`)
        .send({})
        .expect(400);

      // Invalid plan item
      await request(app.getHttpServer())
        .post(`/v2/meetings/${meetingId}/disbursement-plan`)
        .send({
          plan: [
            {
              // Missing required fields
              type: 'dividend',
            },
          ],
        })
        .expect(400);
    });
  });
});
