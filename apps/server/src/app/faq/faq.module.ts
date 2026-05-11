import { Module } from "@nestjs/common";
import { FaqService } from "./faq.service";
import { FaqController } from "./faq.controller";

@Module({
    imports: [],
    controllers: [FaqController],
    providers: [FaqService]
})
export class FaqModule {

}