import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { GcpStorageService } from '../src/gcp-storage/gcp-storage.service';

const mockGcpStorageService = {
  createCitizenFolder: jest.fn().mockResolvedValue('https://fake-url/folder/'),
  listDocuments: jest.fn().mockResolvedValue([
    {
      name: 'test.pdf',
      size: '12345',
      lastModified: '2024-01-01T00:00:00Z',
      contentType: 'application/pdf',
      metadata: {},
      backendUrl: '/download-file/123/test.pdf',
    },
  ]),
  signFileByName: jest.fn().mockResolvedValue(undefined),
  transferFilesBetweenFolders: jest
    .fn()
    .mockResolvedValue(['https://fake-url/copied/test.pdf']),
};

describe('GcpUploadController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GcpStorageService)
      .useValue(mockGcpStorageService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  it('/create-folder (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/create-folder')
      .send({ idCitizen: '123' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: 'folder created successfully',
      folderUrl: 'https://fake-url/folder/',
    });
  });

  it('/list-documents/:idCitizen (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/list-documents/123');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Documents listed successfully');
    expect(res.body.files).toHaveLength(1);
  });

  it('/sign-file (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/sign-file')
      .send({ idCitizen: '123', fileName: 'test.pdf' });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('signed successfully');
  });

  it('/transfer-files (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/transfer-files')
      .send({
        sourceCitizenId: '123',
        targetCitizenId: '456',
        fileNames: ['test.pdf'],
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('successfully copied');
    expect(res.body.copiedFiles).toHaveLength(1);
  });

  afterAll(async () => {
    await app.close();
  });
});
