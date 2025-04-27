"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = bootstrap;
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const cors_config_1 = require("./config/cors.config");
const platform_express_1 = require("@nestjs/platform-express");
const express = require("express");
const server = express();
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(server));
    app.enableCors(cors_config_1.corsConfig.getOptions());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Teamify API')
        .setDescription('API for generating random teams from a list of names')
        .setVersion('1.0')
        .addTag('team-generator', 'Team generation operations')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.init();
    return server;
}
if (process.env.NODE_ENV !== 'vercel') {
    bootstrap().then(server => {
        const port = process.env.PORT || 3000;
        server.listen(port, () => {
            console.log(`Application is running on: http://localhost:${port}`);
        });
    });
}
//# sourceMappingURL=main.js.map