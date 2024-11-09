import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class AuthController {
    // Handle user registration
    static async register(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            
            const userRepository = AppDataSource.getRepository(User);
            const existingUser = await userRepository.findOne({ where: { email } });
            
            if (existingUser) {
                return res.status(400).json({ message: "Пользователь уже существует" });
            }

            // Hash password and create user
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = userRepository.create({
                email,
                password: hashedPassword,
                credits: 100 // Initial balance
            });

            await userRepository.save(user);
            
            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET || "secret",
                { expiresIn: "24h" }
            );

            return res.status(201).json({ token });
        } catch (error) {
            console.error('Error in register:', error);
            return res.status(500).json({ message: "Ошибка сервера" });
        }
    }

    // Handle user login
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({ where: { email } });
            
            if (!user) {
                return res.status(401).json({ message: "Неверный email или пароль" });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: "Неверный email или пароль" });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET || "secret",
                { expiresIn: "24h" }
            );

            return res.json({ token });
        } catch (error) {
            console.error('Error in login:', error);
            return res.status(500).json({ message: "Ошибка сервера" });
        }
    }
} 