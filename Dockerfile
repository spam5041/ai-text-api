# Базовый образ Node.js
FROM node:18-alpine

# Рабочая директория
WORKDIR /app

# Установка зависимостей для сборки
RUN apk add --no-cache python3 make g++

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Компилируем TypeScript
RUN npm run build

# Очищаем dev зависимости
RUN npm ci --only=production

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"] 