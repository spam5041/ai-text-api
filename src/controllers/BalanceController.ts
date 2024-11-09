import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

export class BalanceController {
    // Get user balance
    static async getBalance(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user) {
                return res.status(401).json({ message: 'Пользователь не авторизован' });
            }

            return res.json({ credits: Number(user.credits) });
        } catch (error) {
            console.error('Error in getBalance:', error);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Update user balance (admin only)
    static async updateBalance(req: Request, res: Response) {
        try {
            const { userId, amount } = req.body;
            const adminUser = (req as any).user;

            // Check admin permissions
            if (!adminUser || adminUser.role !== 'admin') {
                return res.status(403).json({ message: 'Недостаточно прав' });
            }

            // Validate amount
            const numericAmount = parseInt(amount);
            if (isNaN(numericAmount)) {
                return res.status(400).json({ message: 'Некорректное значение amount' });
            }

            // Find and update user
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }

            // Update credits
            const currentCredits = Number(user.credits);
            if (isNaN(currentCredits)) {
                return res.status(500).json({ message: 'Ошибка при работе с балансом' });
            }

            user.credits = currentCredits + numericAmount;

            if (isNaN(user.credits)) {
                return res.status(500).json({ message: 'Ошибка при обновлении баланса' });
            }

            await userRepository.save(user);

            return res.json({ credits: user.credits });
        } catch (error) {
            console.error('Error in updateBalance:', error);
            return res.status(500).json({ 
                message: 'Ошибка сервера',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
} 