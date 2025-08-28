import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeController } from './exchange.controller';
import { ExchangeService } from './exchange.service';
import { ExchangeItem } from './entities/exchange-item.entity';
import { ExchangeTransaction } from './entities/exchange-transaction.entity';
import { UserExchangeItem } from './entities/user-exchange-item.entity';
import { PushMedalModule } from '../push-medal/push-medal.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExchangeItem,
      ExchangeTransaction,
      UserExchangeItem,
    ]),
    PushMedalModule,
    CommonModule,
  ],
  controllers: [ExchangeController],
  providers: [ExchangeService],
  exports: [ExchangeService],
})
export class ExchangeModule {}