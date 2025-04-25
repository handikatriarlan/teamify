import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('TeamGeneratorController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  it('/team-generator/generate (POST) - success case', () => {
    return request(app.getHttpServer())
      .post('/team-generator/generate')
      .send({
        numberOfGroups: 2,
        maxMembersPerGroup: 3,
        names: ['Alice', 'Bob', 'Charlie', 'Dave'],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.teams.length).toBe(2);
        expect(res.body.totalParticipants).toBe(4);
        expect(res.body.isEvenDistribution).toBe(true);
      });
  });

  it('/team-generator/generate (POST) - validation failure', () => {
    return request(app.getHttpServer())
      .post('/team-generator/generate')
      .send({
        numberOfGroups: 0, // Invalid
        maxMembersPerGroup: 3,
        names: ['Alice', 'Bob'],
      })
      .expect(400);
  });

  it('/team-generator/generate (POST) - not enough names', () => {
    return request(app.getHttpServer())
      .post('/team-generator/generate')
      .send({
        numberOfGroups: 3,
        maxMembersPerGroup: 3,
        names: ['Alice', 'Bob'],
      })
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
