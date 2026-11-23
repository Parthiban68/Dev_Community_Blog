import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { PublicController } from 'src/modules/public/public.controller';
import { PublicService } from 'src/modules/public/public.service';

describe('Public API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [PublicService],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the landing content in the standard response envelope', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/public/platform').expect(200);

    expect(response.body).toMatchObject({
      message: 'Request successful',
      statusCode: 200,
    });
    expect(new Date(response.body.date).toISOString()).toBe(response.body.date);
    expect(response.body.records.tagline).toBe('Build connections. Create together.');
    expect(response.body.records.features).toHaveLength(6);
  });

  it.each([
    '/api/v1/public/communities/featured',
    '/api/v1/public/projects/featured',
    '/api/v1/public/events/upcoming',
  ])('returns an honest empty collection from %s', async (path) => {
    const response = await request(app.getHttpServer()).get(path).expect(200);

    expect(response.body.records).toMatchObject({
      items: [],
      total: 0,
      available: false,
    });
  });

  it('rejects invalid query parameters with the standard error envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/public/projects/featured?limit=0')
      .expect(400);

    expect(response.body).toMatchObject({
      message: 'Validation failed',
      statusCode: 400,
      records: null,
    });
    expect(response.body.details).toBeDefined();
  });
});
