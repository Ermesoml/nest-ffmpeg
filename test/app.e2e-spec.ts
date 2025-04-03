import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as path from 'path';
import * as fs from 'fs';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const filePath = path.resolve(__dirname, 'file_example_MP4_1920_18MG.mp4');
  let fileBuffer: Buffer;

  beforeAll(async () => {
    try {
      fileBuffer = fs.readFileSync(filePath);
    } catch (error) {
      console.error(`Error reading file: ${filePath}`, error);
      throw error;
    }
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/resize (POST) - Valid resolution and file', async () => {
    return request(app.getHttpServer())
      .post('/resize')
      .attach('file', filePath)
      .field('resolution', '640x480')
      .expect(200)
      .expect('Content-Disposition', /attachment; filename="file_example_MP4_1920_18MG.mp4"/);
  });

  it('/resize (POST) - Invalid resolution format', async () => {
    return request(app.getHttpServer())
      .post('/resize')
      .attach('file', filePath)
      .field('resolution', 'invalid')
      .expect(400);
  });
});
