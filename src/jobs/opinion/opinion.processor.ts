import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { bullConfig } from '../../config/bullmq.config';
import { AiService } from '../../modules/AI/ai.service';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

const prisma = new PrismaClient();
const config = new ConfigService();
const http = new HttpService();
const aiService = new AiService(http, config);
const logger = new Logger('OpinionWorker');

const cleanup = async () => {
  logger.log('Cleaning up resources...');
  await prisma.$disconnect();
  logger.log('Disconnected from database');
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

const worker = new Worker(
  'opinion-queue',
  async (job) => {
    const { debateRoomId, userId, text } = job.data;

    try {
      const opinion = await prisma.debateParticipant.findUnique({
        where: {
          debateRoomId_userId: {
            userId,
            debateRoomId,
          },
        },
        include: {
          debateRoom: {
            select: {
              title: true,
              description: true,
            },
          },
        },
      });

      if (!opinion) {
        logger.warn(`Opinion not found: Room=${debateRoomId}, User=${userId}`);
        return { success: false, error: 'Opinion not found' };
      }

      const result = await aiService.scoreOpinion({
        opinion: text,
        title: opinion.debateRoom.title,
        description: opinion.debateRoom.description,
      });

      const updateData: any = {
        aiScore: result.aiScore,
        is_aiFeedback: true,
      };

      if (result.flagged !== undefined) {
        updateData.aiFlagged = result.flagged;
      }

      await prisma.debateParticipant.update({
        where: {
          debateRoomId_userId: {
            userId,
            debateRoomId,
          },
        },
        data: updateData,
      });

      logger.log(
        `Scored opinion: Room=${debateRoomId}, User=${userId} → Score: ${result.aiScore}, Tone: ${result.tone}, Accuracy: ${result.factAccuracy}, Relevance: ${result.relevance}${result.flagged ? ', Flagged: true' : ''}`,
      );

      return { success: true, score: result.aiScore };
    } catch (err) {
      logger.error(
        `Failed to score opinion: Room=${debateRoomId}, User=${userId}`,
        err.stack,
      );
      return { success: false, error: err.message };
    }
  },
  {
    ...bullConfig,
    concurrency: Number(process.env.BULL_CONCURRENCY) || 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

worker.on('completed', (job) => {
  logger.log(`Job ${job.id} completed: ${JSON.stringify(job.returnvalue)}`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed: ${err.message}`);
});

logger.log(
  `Opinion scoring worker started with concurrency: ${Number(process.env.BULL_CONCURRENCY) || 5}`,
);
