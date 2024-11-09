import express from 'express';
import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { authMiddleware } from './middleware/auth.middleware';
import { AuthController } from './controllers/AuthController';
import { BalanceController } from './controllers/BalanceController';
import { GenerationController } from './controllers/GenerationController';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app = express();

app.use(express.json());

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AI Text API',
            version: '1.0.0',
            description: 'API для работы с текстовыми нейросетями',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }],
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    apis: ['./src/routes/*.ts'],
};

// Initialize Swagger
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.post('/auth/register', AuthController.register);
app.post('/auth/login', AuthController.login);
app.get('/balance', authMiddleware, BalanceController.getBalance);
app.post('/balance/update', authMiddleware, BalanceController.updateBalance);
app.post('/generate', authMiddleware, GenerationController.generate);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

export default app; 