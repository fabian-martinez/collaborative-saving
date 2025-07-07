import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { EntityManager } from 'typeorm';
import { Member } from '../src/members/entities/member.entity';
import { Stock } from '../src/stocks/entities/stock.entity';
import { CreateStockSubscriptionDto } from '../src/stock-subscriptions/dto/create-stock-subscription.dto';
import { CreateLoanDto } from '../src/loans/dto/create-loan.dto';
import { SimplifiedRecordTransactionsDto } from '../src/meetings/dto/simplified-record-transactions.dto';
import { Operation } from '../src/operations/entities/operation.entity';
import { Loan } from '../src/loans/entities/loan.entity';
import { Meeting } from '../src/meetings/entities/meeting.entity';

describe('Business Use Case (e2e)', () => {
  let app: INestApplication;
  let entityManager: EntityManager;
  let member1Id: string;
  let member2Id: string;
  let stock1Id: string;

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
    // Clean up all relevant tables before tests
    await entityManager.query('DELETE FROM "ledger_entries"');
    await entityManager.query('DELETE FROM "operations"');
    await entityManager.query('DELETE FROM "meetings"');
    await entityManager.query('DELETE FROM "loan_transaction_details"');
    await entityManager.query('DELETE FROM "loans"');
    await entityManager.query('DELETE FROM "stock_subscriptions"');
    await entityManager.query('DELETE FROM "mandatory_contributions"');
    await entityManager.query('DELETE FROM "stocks"');
    await entityManager.query('DELETE FROM "members"');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Phase 1: Create Core Entities', () => {
    it('should create members', async () => {
      const member1Res = await request(app.getHttpServer())
        .post('/members')
        .send({ name: 'Socio 1', email: 'socio1@example.com' })
        .expect(201);
      member1Id = (member1Res.body as Member).id;
      const member2Res = await request(app.getHttpServer())
        .post('/members')
        .send({ name: 'Socio 2', email: 'socio2@example.com' })
        .expect(201);
      member2Id = (member2Res.body as Member).id;
      expect(member1Id).toBeDefined();
      expect(member2Id).toBeDefined();
    });

    it('should create stock catalog', async () => {
      const stocksToCreate = [
        { type: 'Acción Grande', value: 10000, monthly_contribution: 100 },
        { type: 'Acción Mediana', value: 5000, monthly_contribution: 100 },
        { type: 'Acción Pequeña', value: 2000, monthly_contribution: 0 },
        { type: 'Bono Navideño', value: 500, monthly_contribution: 50 },
      ];
      for (const stock of stocksToCreate) {
        await request(app.getHttpServer())
          .post('/stocks')
          .send(stock)
          .expect(201);
      }
      const response = await request(app.getHttpServer()).get('/stocks');
      expect(response.body).toHaveLength(stocksToCreate.length);
    });

    it('should create mandatory contributions catalog', async () => {
      const contributionsToCreate = [
        { asset_type: 'Aporte Acción Grande', total: 100 },
        { asset_type: 'Aporte Acción Mediana', total: 100 },
        { asset_type: 'Aporte Bono Navideño', total: 50 },
        { asset_type: 'Aporte Administrativo', total: 5 },
      ];
      for (const contribution of contributionsToCreate) {
        await request(app.getHttpServer())
          .post('/meetings/mandatory-contributions')
          .send(contribution)
          .expect(201);
      }
      const response = await request(app.getHttpServer()).get(
        '/meetings/mandatory-contributions',
      );
      expect(response.body).toHaveLength(contributionsToCreate.length);
    });
  });

  describe('Phase 2: Record Meeting Transactions', () => {
    it('should setup prerequisites for member 1', async () => {
      // 1. Create a meeting
      await request(app.getHttpServer())
        .post('/meetings')
        .send({ notes: 'Test Meeting' })
        .expect(201);

      // 2. Get Member 1 and a stock
      const members = await request(app.getHttpServer())
        .get('/members')
        .expect(200);
      member1Id = (members.body as Member[]).find(
        (m) => m.name === 'Socio 1',
      )!.id;
      const stocks = await request(app.getHttpServer())
        .get('/stocks')
        .expect(200);
      stock1Id = (stocks.body as Stock[]).find(
        (s) => s.type === 'Acción Grande',
      )!.id;

      // 3. Create stock subscription for Member 1
      const subDto: CreateStockSubscriptionDto = {
        member_id: member1Id,
        stock_id: stock1Id,
        quantity: 2,
      };
      await request(app.getHttpServer())
        .post('/stock-subscriptions')
        .send(subDto)
        .expect(201);

      // 4. Create a loan for Member 1
      const loanDto: CreateLoanDto = {
        member_id: member1Id,
        loan_type: 'corriente',
        approved_amount: 3000,
        interest_rate: 0.01,
        status: 'active',
      };
      await request(app.getHttpServer())
        .post('/loans')
        .send(loanDto)
        .expect(201);
    });

    it('should record transactions for member 1 and verify results', async () => {
      // 1. Get created loan
      const member1LoansRes = await request(app.getHttpServer())
        .get(`/loans?member_id=${member1Id}`)
        .expect(200);
      const loan = (member1LoansRes.body as Loan[])[0];
      const loanId = loan.id;
      const initialBalance = loan.outstanding_balance;

      // 2. Define payments payload
      const payload: SimplifiedRecordTransactionsDto = {
        memberId: member1Id,
        payments: [
          {
            type: 'mandatory_contribution',
            description: 'Aporte Administrativo',
            amount: 5,
          },
          {
            type: 'stock_fee',
            description: 'Cuota de 2 Acciones Grandes',
            amount: 200,
          },
          {
            type: 'loan_payment',
            description: 'Abono a Crédito Corriente 1',
            amount: 100,
            referenceId: loanId,
          },
        ],
      };

      // 3. Call the endpoint
      const res = await request(app.getHttpServer())
        .post('/meetings/active/record-transactions')
        .send(payload)
        .expect(201);
      const operationId = (res.body as Operation).id;
      expect(operationId).toBeDefined();

      // 4. Verify results
      // 4.1 Check new loan balance
      const updatedLoanRes = await request(app.getHttpServer())
        .get(`/loans/${loanId}`)
        .expect(200);
      const updatedLoan = updatedLoanRes.body as Loan;
      const interestPaid = initialBalance * 0.01; // 3000 * 0.01 = 30
      const principalPaid = 100 - interestPaid; // 100 - 30 = 70
      const expectedNewBalance = initialBalance - principalPaid; // 3000 - 70 = 2930
      expect(Number(updatedLoan.outstanding_balance)).toBe(expectedNewBalance);

      // 4.2 Check ledger entries
      const operation = await entityManager.findOne(Operation, {
        where: { id: operationId },
        relations: ['ledger_entries'],
      });
      // (contrib: 2) + (stock: 2) + (loan: 3) = 7 entries
      expect(operation!.ledger_entries).toHaveLength(7);
    });
  });

  describe('Meeting Management Rules', () => {
    it('should enforce a single active meeting', async () => {
      // 1. Verify a meeting is already active from the previous test suite,
      //    and trying to create another one fails.
      await request(app.getHttpServer())
        .post('/meetings')
        .send({ notes: 'This should fail' })
        .expect(400)
        .then((res) => {
          expect((res.body as { message: string }).message).toContain(
            'An active meeting already exists',
          );
        });

      // 2. Find and close the currently active meeting.
      const meetingsRes = await request(app.getHttpServer())
        .get('/meetings')
        .expect(200);
      const activeMeeting = (meetingsRes.body as Meeting[]).find(
        (m) => m.status === 'active',
      );
      expect(activeMeeting).toBeDefined();

      if (activeMeeting) {
        await request(app.getHttpServer())
          .patch(`/meetings/${activeMeeting.id}/close`)
          .expect(200);
      }

      // 3. Verify that a new meeting can now be created.
      const newMeetingRes = await request(app.getHttpServer())
        .post('/meetings')
        .send({ notes: 'This should succeed' })
        .expect(201);
      const newMeetingId = (newMeetingRes.body as Meeting).id;
      expect(newMeetingId).toBeDefined();
    });
  });
});
