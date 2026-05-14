import { Module } from "@nestjs/common";
import { TermsController } from "./terms.controller";
import { TermsService } from "./terms.service";

@Module({
    imports: [],
    controllers: [TermsController],
    providers: [TermsService],
})
export class TermsModule { }
