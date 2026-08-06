import { ClassSerializerInterceptor, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { validateEnv } from "./config/env.validation";
import { AuthModule } from "./modules/auth/auth.module";
import { AccessTokenGuard } from "./modules/auth/guards/access-token.guard";
import { RolesGuard } from "./modules/auth/guards/roles.guard";
import { FirmsModule } from "./modules/firms/firms.module";
import { AssociatesModule } from "./modules/hr/associates/associates.module";
import { AttendanceModule } from "./modules/hr/attendance/attendance.module";
import { LeaveModule } from "./modules/hr/leave/leave.module";
import { FixedExpensesModule } from "./modules/expenses/fixed-expenses/fixed-expenses.module";
import { ManualExpensesModule } from "./modules/expenses/manual-expenses/manual-expenses.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { RecurringExpensesModule } from "./modules/expenses/recurring-expenses/recurring-expenses.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./modules/users/users.module";
import { MattersModule } from "./modules/matters/matters.module";
import { HearingsModule } from "./modules/matters/hearings/hearings.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { CaseDocumentsModule } from "./modules/case-documents/case-documents.module";
import { ClientsModule } from "./modules/clients/clients.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Missing or malformed configuration now fails at boot rather than
      // turning into a 401 the first time a JWT secret is read.
      validate: validateEnv
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 50 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    AssociatesModule,
    AttendanceModule,
    LeaveModule,
    FixedExpensesModule,
    ManualExpensesModule,
    ExpensesModule,
    RecurringExpensesModule,
    FirmsModule,
    MattersModule,
    HearingsModule,
    TasksModule,
    CaseDocumentsModule,
    ClientsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Guards run in declaration order: rate limit, then authenticate, then
    // authorize. Binding auth globally means a new controller is protected by
    // default and has to opt out with @Public().
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },

    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    // Applies the @Expose rules on the entities the services return.
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },

    { provide: APP_FILTER, useClass: AllExceptionsFilter }
  ]
})
export class AppModule {}
