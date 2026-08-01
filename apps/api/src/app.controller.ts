import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/decorators/public.decorator";
import { AppService, type HealthStatus } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Liveness probe, public by design — it exposes no data. Replaces the
   * scaffolded "Hello World!" route that sat unauthenticated on `GET /api`.
   */
  @Public()
  @Get("health")
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
