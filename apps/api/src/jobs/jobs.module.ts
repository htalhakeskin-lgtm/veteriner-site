import { Module } from '@nestjs/common';
import { TestimonialsModule } from '../modules/testimonials/testimonials.module';
import { RemindersJob } from './reminders.job';

@Module({
  imports: [TestimonialsModule],
  providers: [RemindersJob],
})
export class JobsModule {}
