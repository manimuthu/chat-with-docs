import { BadGatewayException, Injectable, NotFoundException  } from '@nestjs/common';
import { Repository, FindOptionsWhere  } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Document } from './document.entity';
import axios from 'axios';

@Injectable()
export class DocumentsService {
  constructor(@InjectRepository(Document) private repo: Repository<Document>) {}

  createDocument(filename: string, user: User) {
    const doc = this.repo.create({ filename, uploadedBy: user });
    return this.repo.save(doc);
  }

  findUserDocs(userId: number) {
    return this.repo.find({ where: { uploadedBy: { id: userId } } });
  }

  async saveFile(file: Express.Multer.File, userId: number) {
    const document = this.repo.create({
      filename: file.originalname,
      storageFilename: file.filename,
      uploadedBy: { id: userId },
    });

    return this.repo.save(document);
  }

  
async triggerIngestion(id: number) {
    const doc = await this.repo.findOne({ where: { id } });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const documents = await this.repo.find();
    const ingestionPayload = {
      documents: documents.map((document) => ({
        documentId: document.id,
        filename: document.filename,
        storageFilename: document.storageFilename ?? document.filename,
      })),
    };
    try {
      const ragApiUrl = process.env.RAG_API_URL ?? 'http://localhost:5000';
      const response = await axios.post(`${ragApiUrl}/ingest`, ingestionPayload);
      return { status: 'success', response: response.data };
    } catch {
      throw new BadGatewayException('Python ingestion service is unavailable');
    }
  }

  async getAllDocuments(userId: number): Promise<Document[]> {
    const where: FindOptionsWhere<Document> = {
      uploadedBy: {
        id: userId, // 👈 Correct way to query nested relation
      },
    };

    return this.repo.find({
      where,
      order: { uploadedAt: 'DESC' },
      select: ['id', 'filename', 'uploadedAt'], // optional: exclude relation
    });
  }

}
