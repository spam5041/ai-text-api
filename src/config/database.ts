import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/User";

// Load environment variables
dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "ai_text_api",
    synchronize: true,
    logging: true,
    entities: [User],
    migrations: ["src/migrations/**/*.ts"],
    subscribers: ["src/subscribers/**/*.ts"],
});

// Initialize database only when this file is run directly
if (require.main === module) {
    AppDataSource.initialize()
        .then(() => {
            console.log("Data Source has been initialized!");
        })
        .catch((err) => {
            console.error("Error during Data Source initialization:", err);
        });
} 