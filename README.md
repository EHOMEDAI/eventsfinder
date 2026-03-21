# EventsFinder MVP

课程交付版活动社交项目，基于 `Next.js + Express + MySQL + Prisma`。

## 快速开始

1. 复制环境变量：`cp .env.example .env`
2. 启动 MySQL：`pnpm db:up`
3. 安装依赖：`pnpm install`
4. 生成 Prisma Client：`pnpm db:generate`
5. 运行迁移：`pnpm db:migrate`
6. 初始化数据：`pnpm db:seed`
7. 启动前后端：`pnpm dev`

前端默认在 `http://localhost:3000`，后端默认在 `http://localhost:4000`，MySQL 暴露在 `localhost:3307`。

## 使用本机 MySQL

如果你本机 MySQL 可用，例如 `root / 123456`：

1. 直接运行 `pnpm local:start`
2. 停止服务运行 `pnpm local:stop`
3. 查看状态运行 `pnpm local:status`

默认使用：

- 数据库地址：`127.0.0.1:3306`
- 数据库账号：`root`
- 数据库密码：`123456`
- 数据库名：`eventsfinder_local`

脚本会自动：

- 创建本地数据库
- 执行 Prisma migration
- 首次空库时写入种子数据
- 后台启动 API 和 Web

如需覆盖默认值，可在启动前设置环境变量，例如：

`LOCAL_DB_PASSWORD=你的密码 LOCAL_DB_NAME=eventsfinder_demo pnpm local:start`

## 演示账号

- 管理员：`admin@eventsfinder.local` / `Password123!`
- 普通用户：`user@eventsfinder.local` / `Password123!`
