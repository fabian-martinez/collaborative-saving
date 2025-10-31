/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { EntityManager } from 'typeorm';
import { MemberFactory } from '../factories/member.factory';
import { Member } from '../../src/members/entities/member.entity';

describe('Members E2E Tests (Hexagonal Architecture)', () => {
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

  beforeEach(async () => {
    // Clean up members table before each test
    await entityManager.query('DELETE FROM "ledger_entries" WHERE true');
    await entityManager.query('DELETE FROM "operations" WHERE true');
    await entityManager.query(
      'DELETE FROM "loan_transaction_details" WHERE true',
    );
    await entityManager.query('DELETE FROM "loans" WHERE true');
    await entityManager.query('DELETE FROM "stock_subscriptions" WHERE true');
    await entityManager.query('DELETE FROM "members" WHERE true');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v2/members', () => {
    it('should return empty array when no members exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/v2/members')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it('should return list of active members only', async () => {
      // Create test members using factory
      const activeMember1 = MemberFactory.createActive({
        name: 'Active Member 1',
        email: 'active1@example.com',
      });
      const activeMember2 = MemberFactory.createActive({
        name: 'Active Member 2',
        email: 'active2@example.com',
      });
      const inactiveMember = MemberFactory.createInactive({
        name: 'Inactive Member',
        email: 'inactive@example.com',
      });

      // Insert into database
      await entityManager.save(Member, [
        activeMember1,
        activeMember2,
        inactiveMember,
      ]);

      const response = await request(app.getHttpServer())
        .get('/v2/members')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect((response.body as unknown[]).length).toBeGreaterThanOrEqual(2);

      // Verify only active members are returned
      const memberNames = (response.body as { name: string }[]).map(
        (m) => m.name,
      );
      expect(memberNames).toContain('Active Member 1');
      expect(memberNames).toContain('Active Member 2');
      expect(memberNames).not.toContain('Inactive Member');
    });

    it('should return members with all required fields', async () => {
      const testMember = MemberFactory.createActive({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '123456789',
        role: 'member',
        status: 'active',
        address: '123 Main St',
        phone: '+1234567890',
        beneficiary: 'Test Beneficiary',
      });

      await entityManager.save(Member, testMember);

      const response = await request(app.getHttpServer())
        .get('/v2/members')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect((response.body as unknown[]).length).toBe(1);
      const member: Record<string, unknown> = (
        response.body as Record<string, unknown>[]
      )[0];

      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('name', 'Test Member');
      expect(member).toHaveProperty('email', 'test@example.com');
      expect(member).toHaveProperty('role', 'member');
      expect(member).toHaveProperty('status', 'active');
      expect(member).toHaveProperty('identificationNumber', '123456789');
      expect(member).toHaveProperty('address', '123 Main St');
      expect(member).toHaveProperty('phone', '+1234567890');
      expect(member).toHaveProperty('beneficiary', 'Test Beneficiary');
      expect(member).toHaveProperty('registrationDate');
      expect(member).toHaveProperty('createdAt');
    });
  });

  describe('POST /v2/members', () => {
    it('should create a member with minimal required fields', async () => {
      const createDto = {
        name: 'New Member',
        email: 'newmember@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/v2/members')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'New Member');
      expect(response.body).toHaveProperty('email', 'newmember@example.com');
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).toHaveProperty('role', 'member');
      expect(response.body).toHaveProperty('registrationDate');
      expect(response.body).toHaveProperty('createdAt');

      // Verify member can be retrieved
      const getResponse = await request(app.getHttpServer())
        .get(`/v2/members/${(response.body as { id: string }).id}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty(
        'id',
        (response.body as { id: string }).id,
      );
      expect(getResponse.body).toHaveProperty('name', 'New Member');
    });

    it('should create a member with all fields', async () => {
      const createDto = {
        name: 'Complete Member',
        email: 'complete@example.com',
        identificationNumber: '987654321',
        role: 'admin',
        address: '123 Main Street',
        phone: '+1234567890',
        beneficiary: 'John Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/v2/members')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Complete Member');
      expect(response.body).toHaveProperty('email', 'complete@example.com');
      expect(response.body).toHaveProperty('identificationNumber', '987654321');
      expect(response.body).toHaveProperty('role', 'admin');
      expect(response.body).toHaveProperty('address', '123 Main Street');
      expect(response.body).toHaveProperty('phone', '+1234567890');
      expect(response.body).toHaveProperty('beneficiary', 'John Doe');
      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should return 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/v2/members')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should return 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/v2/members')
        .send({
          name: 'Test Member',
        })
        .expect(400);
    });

    it('should return 400 when email format is invalid', async () => {
      await request(app.getHttpServer())
        .post('/v2/members')
        .send({
          name: 'Test Member',
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should return 400 when role is invalid', async () => {
      await request(app.getHttpServer())
        .post('/v2/members')
        .send({
          name: 'Test Member',
          email: 'test@example.com',
          role: 'invalid-role',
        })
        .expect(400);
    });

    it('should set default role to "member" when not provided', async () => {
      const createDto = {
        name: 'Default Role Member',
        email: 'defaultrole@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/v2/members')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('role', 'member');
    });

    it('should set default status to "active"', async () => {
      const createDto = {
        name: 'Active Member',
        email: 'active@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/v2/members')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should accept valid roles (member, admin, treasurer)', async () => {
      const roles = ['member', 'admin', 'treasurer'] as const;

      for (const role of roles) {
        const createDto = {
          name: `Member ${role}`,
          email: `${role}@example.com`,
          role,
        };

        const response = await request(app.getHttpServer())
          .post('/v2/members')
          .send(createDto)
          .expect(201);

        expect(response.body).toHaveProperty('role', role);
      }
    });

    it('should create member that appears in GET /v2/members list', async () => {
      const createDto = {
        name: 'List Member',
        email: 'list@example.com',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/v2/members')
        .send(createDto)
        .expect(201);

      const memberId = (createResponse.body as { id: string }).id;

      const listResponse = await request(app.getHttpServer())
        .get('/v2/members')
        .expect(200);

      const memberIds = (listResponse.body as { id: string }[]).map(
        (m) => m.id,
      );
      expect(memberIds).toContain(memberId);
    });
  });

  describe('GET /members/:id', () => {
    it('should return 404 when member does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/v2/members/${nonExistentId}`)
        .expect(404);
    });

    it('should return 400 when invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/v2/members/invalid-uuid')
        .expect(400);
    });

    it('should return member detail by id', async () => {
      const testMember = MemberFactory.createActive({
        name: 'Detail Member',
        email: 'detail@example.com',
        identificationNumber: '987654321',
        address: '456 Oak Ave',
        phone: '+9876543210',
        beneficiary: 'Detail Beneficiary',
      });

      const savedMember = await entityManager.save(Member, testMember);

      const response = await request(app.getHttpServer())
        .get(`/v2/members/${savedMember.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', savedMember.id);
      expect(response.body).toHaveProperty('name', 'Detail Member');
      expect(response.body).toHaveProperty('email', 'detail@example.com');
      expect(response.body).toHaveProperty('identificationNumber', '987654321');
      expect(response.body).toHaveProperty('address', '456 Oak Ave');
      expect(response.body).toHaveProperty('phone', '+9876543210');
      expect(response.body).toHaveProperty('beneficiary', 'Detail Beneficiary');
      expect(response.body).toHaveProperty('registrationDate');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should not return deleted members', async () => {
      const deletedMember = MemberFactory.create({
        name: 'Deleted Member',
        email: 'deleted@example.com',
        deletedAt: new Date(), // Soft deleted
      });

      const savedMember = await entityManager.save(Member, deletedMember);

      await request(app.getHttpServer())
        .get(`/v2/members/${savedMember.id}`)
        .expect(404);
    });
  });

  describe('PATCH /v2/members/:id', () => {
    let testMemberId: string;

    beforeEach(async () => {
      const testMember = MemberFactory.createActive({
        name: 'Original Name',
        email: 'original@example.com',
        address: 'Original Address',
        phone: '+1111111111',
        beneficiary: 'Original Beneficiary',
        role: 'member',
      });

      const savedMember = await entityManager.save(Member, testMember);
      testMemberId = savedMember.id;
    });

    it('should return 404 when member does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .patch(`/v2/members/${nonExistentId}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });

    it('should return 400 when invalid UUID format', async () => {
      await request(app.getHttpServer())
        .patch('/v2/members/invalid-uuid')
        .send({ name: 'Updated Name' })
        .expect(400);
    });

    it('should update member name', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v2/members/${testMemberId}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body).toHaveProperty('id', testMemberId);
      expect(response.body).toHaveProperty('name', 'Updated Name');
      expect(response.body).toHaveProperty('email', 'original@example.com'); // Unchanged
    });

    it('should update member email', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v2/members/${testMemberId}`)
        .send({ email: 'updated@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('email', 'updated@example.com');
      expect(response.body).toHaveProperty('name', 'Original Name'); // Unchanged
    });

    it('should update multiple fields', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v2/members/${testMemberId}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
          address: 'Updated Address',
          phone: '+2222222222',
          beneficiary: 'Updated Beneficiary',
        })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Name');
      expect(response.body).toHaveProperty('email', 'updated@example.com');
      expect(response.body).toHaveProperty('address', 'Updated Address');
      expect(response.body).toHaveProperty('phone', '+2222222222');
      expect(response.body).toHaveProperty(
        'beneficiary',
        'Updated Beneficiary',
      );
    });

    it('should update role', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v2/members/${testMemberId}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body).toHaveProperty('role', 'admin');
    });

    it('should validate email format', async () => {
      await request(app.getHttpServer())
        .patch(`/v2/members/${testMemberId}`)
        .send({ email: 'invalid-email' })
        .expect(400);
    });
  });

  describe('DELETE /v2/members/:id', () => {
    let testMemberId: string;

    beforeEach(async () => {
      const testMember = MemberFactory.createActive({
        name: 'Member To Delete',
        email: 'todelete@example.com',
      });

      const savedMember = await entityManager.save(Member, testMember);
      testMemberId = savedMember.id;
    });

    it('should return 404 when member does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .delete(`/v2/members/${nonExistentId}`)
        .expect(404);
    });

    it('should return 400 when invalid UUID format', async () => {
      await request(app.getHttpServer())
        .delete('/v2/members/invalid-uuid')
        .expect(400);
    });

    it('should perform logical delete (soft delete)', async () => {
      // Delete the member
      await request(app.getHttpServer())
        .delete(`/v2/members/${testMemberId}`)
        .expect(200);

      // Verify member no longer appears in list
      const membersResponse = await request(app.getHttpServer())
        .get('/v2/members')
        .expect(200);

      // Ensure the response is an array of members with valid shape
      expect(Array.isArray(membersResponse.body)).toBe(true);

      const memberIds = (membersResponse.body as { id: string }[]).map(
        (m) => m.id,
      );
      expect(memberIds).not.toContain(testMemberId);

      // Verify member still exists in DB but is marked as deleted
      const deletedMember = await entityManager.findOne(Member, {
        where: { id: testMemberId },
        withDeleted: true,
      });

      expect(deletedMember).toBeDefined();
      expect(deletedMember?.deletedAt).not.toBeNull();
      expect(deletedMember?.status).toBe('inactive');
    });

    it('should not return deleted member in GET /members/:id', async () => {
      // Delete the member
      await request(app.getHttpServer())
        .delete(`/v2/members/${testMemberId}`)
        .expect(200);

      // Verify member cannot be retrieved by ID
      await request(app.getHttpServer())
        .get(`/v2/members/${testMemberId}`)
        .expect(404);
    });

    it('should return 404 when trying to delete already deleted member', async () => {
      // First delete
      await request(app.getHttpServer())
        .delete(`/v2/members/${testMemberId}`)
        .expect(200);

      // Try to delete again
      await request(app.getHttpServer())
        .delete(`/v2/members/${testMemberId}`)
        .expect(404);
    });
  });
});
