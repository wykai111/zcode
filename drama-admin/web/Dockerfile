# 前端镜像：多阶段构建
# 阶段 1：用 node 构建 Vite 产物
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# 构建时指定生产 API 基址（这里用相对路径，部署后走 nginx 反代）
RUN npm run build

# 阶段 2：用 nginx 托管 dist
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
