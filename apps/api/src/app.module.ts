import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from './modules/auth/auth.module';
import { AssociatesModule } from './modules/hr/associates/associates.module';
import { AttendanceModule } from './modules/hr/attendance/attendance.module';
import { LeaveModule } from './modules/hr/leave/leave.module';
import { FixedExpensesModule } from './modules/expenses/fixed-expenses/fixed-expenses.module';
import { ManualExpensesModule } from './modules/expenses/manual-expenses/manual-expenses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 50,
      },
    ]),
    AuthModule,
    AssociatesModule,
    AttendanceModule,
    LeaveModule,
    FixedExpensesModule,
    ManualExpensesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
