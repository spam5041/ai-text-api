import app from './app';
import { AppDataSource } from './config/database';

// Initialize database and start server
AppDataSource.initialize()
    .then(() => {
        app.listen(3000, () => {
            console.log('Server is running on port 3000');
        });
    })
    .catch((error: Error) => {
        console.error('Error during server startup:', error);
        process.exit(1);
    }); 