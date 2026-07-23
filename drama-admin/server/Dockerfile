# 后端镜像：Node.js + 等待 MySQL + 初始化管理员 + 启动服务
FROM node:18-alpine

WORKDIR /app

# 先装依赖（利用 Docker 层缓存）
COPY package.json ./
RUN npm install --production

# 拷贝源码
COPY . .

# 上传目录
RUN mkdir -p uploads

# 启动脚本：等 MySQL 起来后，初始化管理员，再启动服务
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

CMD ["/docker-entrypoint.sh"]
