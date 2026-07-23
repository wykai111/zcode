#!/bin/bash
# ShortDrama 部署脚本
# 用法：
#   ./deploy.sh up       构建并启动所有服务
#   ./deploy.sh down     停止所有服务
#   ./deploy.sh restart  重启服务
#   ./deploy.sh logs     查看实时日志
#   ./deploy.sh status   查看服务状态
#   ./deploy.sh rebuild  重新构建镜像（代码变更后用）
#   ./deploy.sh clean    停止并删除容器（保留数据）

set -e
cd "$(dirname "$0")"

case "$1" in
  up)
    echo "🚀 启动 ShortDrama..."
    docker compose up -d --build
    echo ""
    echo "✅ 启动完成！"
    echo "   管理后台: http://$(hostname -I | awk '{print $1}')/"
    echo "   API:      http://$(hostname -I | awk '{print $1}')/api/"
    echo "   账号:     admin / admin123"
    ;;
  down)
    echo "🛑 停止服务..."
    docker compose down
    ;;
  restart)
    echo "🔄 重启服务..."
    docker compose restart
    ;;
  logs)
    docker compose logs -f --tail=100
    ;;
  status)
    docker compose ps
    ;;
  rebuild)
    echo "🔧 重新构建并启动..."
    docker compose up -d --build --force-recreate
    ;;
  clean)
    echo "🧹 停止并删除容器（数据保留）..."
    docker compose down
    echo "如需删除数据：docker volume rm drama-mysql-data drama-uploads-data"
    ;;
  *)
    echo "用法: $0 {up|down|restart|logs|status|rebuild|clean}"
    exit 1
    ;;
esac
