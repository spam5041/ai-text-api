import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

// JWT payload interface
interface JWTPayload {
    userId: string;
    role: string;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract token from Authorization header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Токен не предоставлен' });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JWTPayload;
        
        // Find user in database
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: decoded.userId } });

        if (!user) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }

        // Add user to request object
        (req as any).user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Неверный токен' });
    }
}; 