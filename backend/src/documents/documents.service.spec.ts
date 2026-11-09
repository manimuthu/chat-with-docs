import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Document } from './document.entity';
import { BadGatewayException, NotFoundException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');

const mockRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should save the original filename separately from the stored filename', async () => {
    const file = {
      originalname: 'Annual Report.pdf',
      filename: 'file-123.pdf',
    } as Express.Multer.File;
    mockRepo.create.mockReturnValue({
      filename: file.originalname,
      storageFilename: file.filename,
      uploadedBy: { id: 7 },
    });
    mockRepo.save.mockImplementation((document) => Promise.resolve(document));

    await service.saveFile(file, 7);

    expect(mockRepo.create).toHaveBeenCalledWith({
      filename: 'Annual Report.pdf',
      storageFilename: 'file-123.pdf',
      uploadedBy: { id: 7 },
    });
  });

  it('should throw NotFoundException if doc not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(service.triggerIngestion(1)).rejects.toThrow(NotFoundException);
  });

  it('should call Python API and return success response', async () => {
    const mockDoc = { id: 1, filename: 'file.pdf' };
    mockRepo.findOne.mockResolvedValue(mockDoc);
    mockRepo.find.mockResolvedValue([
      { id: 1, filename: 'original-file.pdf', storageFilename: 'file-123.pdf' },
    ]);

    const mockAxiosResponse = { data: { message: 'Ingested successfully' } };
    (axios.post as jest.Mock).mockResolvedValue(mockAxiosResponse);

    const result = await service.triggerIngestion(1);

    expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/ingest', {
      documents: [
        {
          documentId: 1,
          filename: 'original-file.pdf',
          storageFilename: 'file-123.pdf',
        },
      ],
    });

    expect(result).toEqual({
      status: 'success',
      response: { message: 'Ingested successfully' },
    });
  });

  it('should report an error when the Python API is unavailable', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 1, filename: 'file.pdf' });
    mockRepo.find.mockResolvedValue([]);
    (axios.post as jest.Mock).mockRejectedValue(new Error('Connection refused'));

    await expect(service.triggerIngestion(1)).rejects.toThrow(BadGatewayException);
  });
});
