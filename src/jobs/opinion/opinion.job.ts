import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { bullConfig } from '../../config/bullmq.config';

@Injectable()
export class OpinionJob {
  public queue: Queue;

  constructor() {
    this.queue = new Queue('opinion-queue', bullConfig);
  }

  async addOpinionJob(data: {
    debateRoomId: string;
    userId: string;
    text: string;
  }) {
    await this.queue.add('score-opinion', data);
  }
}
