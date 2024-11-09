import axios from "axios";
import { Response } from 'express';

// Model configuration interface
export interface ModelConfig {
    name: string;
    tokenPrice: number;
    endpoint: string;
}

// Abstract base class for AI models
export abstract class AIModel {
    abstract generateText(prompt: string): Promise<string>;
    abstract streamGenerateText(prompt: string, res: Response | ((data: any) => void)): Promise<void>;
    abstract calculateCost(tokens: number): number;
    abstract getTokenCount(text: string): number;
}

export class OpenAIModel extends AIModel {
    private apiKey: string;
    private endpoint: string;
    private tokenPrice: number;

    constructor(config: ModelConfig) {
        super();
        this.apiKey = process.env.OPENAI_API_KEY || "";
        this.endpoint = config.endpoint;
        this.tokenPrice = config.tokenPrice;
    }

    // Generate text using OpenAI API
    async generateText(prompt: string): Promise<string> {
        try {
            const response = await axios.post(
                this.endpoint,
                {
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.choices && response.data.choices[0]) {
                return response.data.choices[0].message.content;
            } else {
                throw new Error('Неверный формат ответа от API');
            }
        } catch (error) {
            console.error('OpenAI API Error:', error);
            if (axios.isAxiosError(error)) {
                throw new Error(`Ошибка API: ${error.response?.data?.error?.message || error.message}`);
            }
            throw error;
        }
    }

    // Stream text generation using SSE
    async streamGenerateText(prompt: string, resOrCallback: Response | ((data: any) => void)): Promise<void> {
        try {
            const response = await axios.post(
                this.endpoint,
                {
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    stream: true
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream'
                    },
                    responseType: 'stream'
                }
            );

            // Setup event handler function
            const sendEvent = typeof resOrCallback === 'function' 
                ? resOrCallback 
                : (data: any) => {
                    resOrCallback.write(`data: ${JSON.stringify(data)}\n\n`);
                };

            // Handle streaming response
            response.data.on('data', (chunk: Buffer) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    if (line.includes('[DONE]')) {
                        sendEvent({ done: true });
                        return;
                    }
                    try {
                        const parsed = JSON.parse(line.replace(/^data: /, ''));
                        if (parsed.choices?.[0]?.delta?.content) {
                            sendEvent({ content: parsed.choices[0].delta.content });
                        }
                    } catch (e) {
                        console.error('Error parsing SSE:', e);
                    }
                }
            });

            // Handle stream end
            response.data.on('end', () => {
                sendEvent({ done: true });
                if ('end' in resOrCallback) resOrCallback.end();
            });

            // Handle stream errors
            response.data.on('error', (error: Error) => {
                console.error('Stream error:', error);
                sendEvent({ error: 'Stream error occurred' });
                if ('end' in resOrCallback) resOrCallback.end();
            });

        } catch (error) {
            console.error('OpenAI Streaming Error:', error);
            const sendEvent = typeof resOrCallback === 'function' 
                ? resOrCallback 
                : (data: any) => resOrCallback.write(`data: ${JSON.stringify(data)}\n\n`);
            sendEvent({ error: 'Failed to generate text' });
            if ('end' in resOrCallback) resOrCallback.end();
        }
    }

    // Calculate cost based on token count
    calculateCost(tokens: number): number {
        return tokens * this.tokenPrice;
    }

    // Estimate token count from text
    getTokenCount(text: string): number {
        return Math.ceil(text.length / 4);
    }
}

export class GeminiModel extends AIModel {
    private apiKey: string;
    private endpoint: string;
    private tokenPrice: number;

    constructor(config: ModelConfig) {
        super();
        this.apiKey = process.env.GEMINI_API_KEY || "";
        this.endpoint = config.endpoint;
        this.tokenPrice = config.tokenPrice;
    }

    // Generate text using Gemini API
    async generateText(prompt: string): Promise<string> {
        try {
            const response = await axios.post(
                this.endpoint,
                {
                    contents: [{ parts: [{ text: prompt }] }]
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data.candidates[0].content.parts[0].text;
        } catch (error) {
            throw new Error("Ошибка генерации текста");
        }
    }

    // Stream text generation using SSE
    async streamGenerateText(prompt: string, res: Response): Promise<void> {
        try {
            const response = await axios.post(
                this.endpoint,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    stream: true
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                    responseType: 'stream'
                }
            );

            // Setup SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Handle connection close
            res.on('close', () => {
                response.data.destroy();
            });

            // Process stream data
            response.data.on('data', (chunk: Buffer) => {
                try {
                    const data = JSON.parse(chunk.toString());
                    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                        res.write(`data: ${JSON.stringify({ content: data.candidates[0].content.parts[0].text })}\n\n`);
                    }
                } catch (e) {
                    console.error('Error parsing SSE:', e);
                }
            });

            // Handle stream end
            response.data.on('end', () => {
                res.write('event: done\ndata: [DONE]\n\n');
                res.end();
            });
        } catch (error) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: 'Ошибка генерации' })}\n\n`);
            res.end();
        }
    }

    // Calculate cost based on token count
    calculateCost(tokens: number): number {
        return tokens * this.tokenPrice;
    }

    // Estimate token count from text
    getTokenCount(text: string): number {
        return Math.ceil(text.length / 4);
    }
} 