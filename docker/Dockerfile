# Сборка проекта
FROM docker-registry.tattelecom.digital/base/node:22-alpine AS builder

WORKDIR /app

# Копируем только package.json и tsconfig.json (если используется)
COPY package.json ./

# Устанавливаем зависимости отдельно, чтобы использовать кэш
RUN npm install

# Копируем остальные файлы
COPY . .

# Выполняем сборку
RUN npm run build

# ---------------------
# Nginx для отдачи статики
# ---------------------

FROM docker-registry.tattelecom.digital/base/nginx:1.25.1
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/configs/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
