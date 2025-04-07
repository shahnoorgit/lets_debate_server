import { Module } from '@nestjs/common';
import { OpinionJob } from './opinion.job';

@Module({
  providers: [OpinionJob],
  exports: [OpinionJob],
})
export class OpinionJobModule {}
