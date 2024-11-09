import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { OpenAIModel, GeminiModel } from '../services/AIModelService';

export class GenerationController {
    static async generate(req: Request, res: Response) {
        try {
            const { prompt, modelName } = req.body;
            const user = (req as any).user;

            // Check user authentication
            if (!user) {
                return res.status(401).json({ message: 'Пользователь не авторизован' });
            }

            // Validate prompt
            if (!prompt) {
                return res.status(400).json({ message: 'Prompt обязателен' });
            }

            const model = GenerationController.getModel(modelName);
            
            // Calculate estimated cost
            const estimatedTokens = model.getTokenCount(prompt);
            const estimatedCost = model.calculateCost(estimatedTokens);

            // Check if user has enough credits
            if (user.credits < estimatedCost) {
                return res.status(402).json({ 
                    message: 'Недостаточно кредитов',
                    required: estimatedCost,
                    available: user.credits
                });
            }

            try {
                if (req.headers.accept?.includes('text/event-stream')) {
                    // Setup SSE headers
                    res.writeHead(200, {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                        'Access-Control-Allow-Origin': '*'
                    });

                    // Start streaming
                    await model.streamGenerateText(prompt, res);
                } else {
                    // Generate text in regular mode
                    const result = await model.generateText(prompt);
                    const actualTokens = model.getTokenCount(result);
                    const actualCost = model.calculateCost(actualTokens);

                    // Validate numeric values
                    if (isNaN(actualTokens) || isNaN(actualCost) || isNaN(user.credits)) {
                        throw new Error('Invalid numeric values');
                    }

                    // Round cost to whole number
                    const roundedCost = Math.ceil(actualCost);
                    
                    // Update user balance
                    const userRepository = AppDataSource.getRepository(User);
                    user.credits = Math.floor(Number(user.credits) - roundedCost);
                    await userRepository.save(user);

                    return res.json({ 
                        result,
                        tokensUsed: actualTokens,
                        cost: roundedCost,
                        remainingCredits: user.credits
                    });
                }
            } catch (error) {
                console.error('Error in generation:', error);
                return res.status(500).json({ 
                    message: 'Ошибка генерации текста',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        } catch (error) {
            console.error('Error in generate controller:', error);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Get AI model instance based on model name
    private static getModel(modelName: string = 'gpt-3.5-turbo') {
        const models = {
            'gpt-3.5-turbo': new OpenAIModel({
                name: 'gpt-3.5-turbo',
                tokenPrice: 0.2,
                endpoint: 'https://bothub.chat/api/v2/openai/v1/chat/completions'
            }),
            'gemini': new GeminiModel({
                name: 'gemini',
                tokenPrice: 0.1,
                endpoint: process.env.GEMINI_ENDPOINT || ''
            })
        };

        return models[modelName as keyof typeof models] || models['gpt-3.5-turbo'];
    }
} 