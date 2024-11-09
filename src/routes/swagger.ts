/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         error:
 *           type: string
 *   
 *     GenerationResponse:
 *       type: object
 *       properties:
 *         result:
 *           type: string
 *           description: Generated text
 *         tokensUsed:
 *           type: number
 *           description: Number of tokens used
 *         cost:
 *           type: number
 *           description: Generation cost in credits
 *         remainingCredits:
 *           type: number
 *           description: User's remaining balance
 *
 * /auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Успешная регистрация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Пользователь уже существует
 *
 * /auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Неверный email или пароль
 *
 * /generate:
 *   post:
 *     summary: Генерация текста
 *     security:
 *       - bearerAuth: []
 *     tags: [Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Text prompt for generation
 *               modelName:
 *                 type: string
 *                 enum: [gpt-3.5-turbo, gemini]
 *                 default: gpt-3.5-turbo
 *     responses:
 *       200:
 *         description: Успешная генерация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerationResponse'
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: SSE stream with generated text chunks
 *       402:
 *         description: Недостаточно кредитов
 *
 * /balance:
 *   get:
 *     summary: Получение баланса пользователя
 *     security:
 *       - bearerAuth: []
 *     tags: [Balance]
 *     responses:
 *       200:
 *         description: Текущий баланс
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 credits:
 *                   type: number
 *
 * /balance/update:
 *   post:
 *     summary: Обновление баланса пользователя
 *     description: Доступно только для администраторов
 *     security:
 *       - bearerAuth: []
 *     tags: [Balance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Баланс успешно обновлен
 *       403:
 *         description: Недостаточно прав
 */