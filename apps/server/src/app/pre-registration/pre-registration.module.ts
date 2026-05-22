import { Module } from "@nestjs/common";
import { PreRegistrationController } from "./pre-registration.controller";
import { PreRegistrationService } from "./pre-registration.service";
import { EventModule } from "../event/event.module";

@Module({
    imports: [EventModule],
    controllers: [PreRegistrationController],
    providers: [PreRegistrationService],
})
export class PreRegistrationModule { }
