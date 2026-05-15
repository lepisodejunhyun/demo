import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import { NgOpenApiGen } from 'ng-openapi-gen';
import { Options } from 'ng-openapi-gen/lib/options';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:4201',
    credentials: true,
  });

  app.use(cookieParser());

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.SHOP_PORT || 3001;

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Swagger Document')
      .addBearerAuth()
      .build(),
    {}
  );

  app.use(
    '/reference',
    apiReference({
      spec: {
        content: document,
      },
    })
  );

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  generateApiClient(document).then(() => {
    Logger.log('API Client Generated');
  }).catch((err) => {
    Logger.warn(`API Client Generation Failed: ${err.message}. (It might be locked by another process)`);
  });

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();

const generateApiClient = async (document: any) => {
  const options: Options = {
    input: JSON.parse(JSON.stringify(document)),
    output: 'libs/api-client-shop/src/lib',
    indexFile: true,
    silent: true,
  }

  const RefParser = new $RefParser();
  const openApi: any = await RefParser.bundle(options.input, {
    dereference: { circular: false },
  });

  const ngOpenGen = new NgOpenApiGen(openApi, options);
  ngOpenGen.generate();
};
