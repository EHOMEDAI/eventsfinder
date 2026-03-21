EventsFinder MVP
Course submission version of an event social platform project, built with Next.js + Express + MySQL + Prisma.

Quick Start
Copy environment variables: cp .env.example .env
Start MySQL: pnpm db:up
Install dependencies: pnpm install
Generate Prisma Client: pnpm db:generate
Run migrations: pnpm db:migrate
Seed initial data: pnpm db:seed
Start frontend and backend: pnpm dev

By default:

Frontend runs at http://localhost:3000
Backend runs at http://localhost:4000
MySQL is exposed at localhost:3307
Using Local MySQL

If your local MySQL is available, for example with root / 123456:

Run directly: pnpm local:start
Stop services: pnpm local:stop
Check status: pnpm local:status

Default settings:

Database host: 127.0.0.1:3306
Database username: root
Database password: 123456
Database name: eventsfinder_local

The script will automatically:

Create the local database
Run Prisma migrations
Seed initial data if the database is empty
Start the API and Web services in the background

If you want to override the default values, set environment variables before starting. For example:

LOCAL_DB_PASSWORD=your_password LOCAL_DB_NAME=eventsfinder_demo pnpm local:start
Demo Accounts
Administrator: admin@eventsfinder.local / Password123!
Regular user: user@eventsfinder.local / Password123!
