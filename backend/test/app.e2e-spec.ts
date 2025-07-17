import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});

// Test e2e para el endpoint de resumen de reunión
// (Nota: este esqueleto debe ser completado con datos reales y mocks según el entorno de test)
describe('GET /meetings/:id/summary', () => {
  it('debe devolver todos los campos si no se especifica fields', async () => {
    // TODO: implementar test real con datos de prueba
    // const res = await request(app.getHttpServer()).get('/meetings/MEETING_ID/summary');
    // expect(res.status).toBe(200);
    // expect(res.body).toHaveProperty('totalCash');
    // expect(res.body).toHaveProperty('totalInterest');
    // ...
  });
  it('debe devolver solo los campos solicitados', async () => {
    // TODO: implementar test real con datos de prueba
    // const res = await request(app.getHttpServer()).get('/meetings/MEETING_ID/summary?fields=totalCash,totalDividends');
    // expect(res.status).toBe(200);
    // expect(res.body).toHaveProperty('totalCash');
    // expect(res.body).toHaveProperty('totalDividends');
    // expect(res.body).not.toHaveProperty('totalInterest');
  });
});
