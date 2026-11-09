import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class IngestionService {
  async triggerIngestion(docId: number) {
    const response = await axios.post('http://localhost:5000/ingest', { docId });
    return response.data;
  }
}
