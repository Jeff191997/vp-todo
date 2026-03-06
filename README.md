# VP Todo – Full-Stack TODO App

VP Todo is a full-stack task management web application that allows users to manage tasks, track progress, and collaborate with other users. The application includes authentication, task assignment, search and filtering, and a dashboard overview.

## Live Demo

https://vp-todo.vercel.app

## GitHub Repository

[https://github.com/YOUR_GITHUB_USERNAME/vp-todo](https://github.com/Jeff191997/vp-todo)

---

# Features

- GitHub Authentication using NextAuth
- Create, edit, and delete tasks
- Assign tasks to multiple users
- Task status tracking (Pending, In Progress, Completed)
- Filtering by category, Task Status
- Task search
- Dashboard overview with task statistics

---

# Tech Stack

Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

Backend

- Next.js API Routes
- Prisma ORM

Database

- PostgreSQL (Supabase)

Authentication

- NextAuth with GitHub OAuth

Deployment

- Vercel

---

# Project Structure

app/ # Next.js routes and pages
components/ # UI components
lib/ # utility functions and Prisma client
prisma/ # Prisma schema and migrations
public/ # static assets

# Local Development

1. Clone the repository
2. Install Dependencies -> npm install
3. Create .env file based on .env.example
   DATABASE_URL=
   DIRECT_URL=
   NEXTAUTH_URL=
   NEXTAUTH_SECRET=
   GITHUB_ID=
   GITHUB_SECRET=

4. Run the development server -> npm run dev

# Author

Kaung Myat Tun
