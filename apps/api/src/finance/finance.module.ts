import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { FlutterwaveGateway } from './flutterwave.gateway';
import { ReceiptsModule } from '../receipts/receipts.module';

@Module({
  imports: [ReceiptsModule],
  controllers: [FinanceController],
  providers: [FinanceService, FlutterwaveGateway],
  exports: [FinanceService, FlutterwaveGateway],
})
export class FinanceModule {}
