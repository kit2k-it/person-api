# Personal Management System API

Production-ready backend API for personal productivity management built with **NestJS**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.

## Features

### Core Functionality
- **Authentication & Authorization**: JWT-based auth with refresh tokens, RBAC
- **User Management**: Profile management, avatar upload, settings
- **Task Management**: Full CRUD, status tracking, priorities, tags, deadlines, search & filter, pagination, bulk operations
- **Goal Tracking**: Goals with milestones, progress tracking, status management
- **Habit Tracking**: Daily check-ins, streak tracking, statistics
- **Notes**: Rich text notes (Markdown), categories, tags, favorites, version history
- **Calendar/Scheduling**: Events, reminders, recurrence, conflict detection
- **Dashboard**: Productivity analytics, trends, insights across all modules

### Technical Features
- Clean Architecture & SOLID principles
- Modular design
- Repository pattern
- Comprehensive DTO validation
- Centralized error handling
- Request/response logging
- Rate limiting
- Security headers (Helmet)
- CORS configuration
- Soft deletes
- Audit logging
- Swagger/OpenAPI documentation
- Docker deployment
- TypeScript strict mode

## Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.9
- **Database**: PostgreSQL 17
- **ORM**: Prisma 7.x
- **Authentication**: Passport, JWT, bcrypt
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker, Docker Compose
- **Testing**: Jest, Supertest

## Project Structure

```
src/
├── common/
│   ├── decorators/     # Custom decorators (CurrentUser, Roles)
│   ├── dto/            # Shared DTOs (ApiResponse, Pagination)
│   ├── enums/          # Enumerations (UserRole, TaskStatus, etc.)
│   ├── exceptions/     # Exception filters
│   ├── filters/        # HTTP exception filters
│   ├── guards/         # Route guards (JWT, Roles, Permissions)
│   ├── interceptors/   # Logging, response formatting
│   ├── middleware/     # Custom middleware
│   ├── pipes/          # Custom pipes
│   └── utils/          # Utility functions
├── config/             # Configuration files
├── modules/            # Feature modules
│   ├── auth/          # Authentication module
│   ├── users/         # User management
│   ├── tasks/         # Task management
│   ├── goals/         # Goal tracking
│   ├── habits/        # Habit tracking
│   ├── notes/         # Notes management
│   ├── schedules/     # Calendar events
│   ├── dashboard/     # Analytics & insights
│   └── shared/        # Shared services (Prisma)
└── main.ts            # Application entry point
```

## Quick Start

### Prerequisites
- Node.js 22+
- PostgreSQL 17 (or use Docker)
- Docker & Docker Compose (optional)

### Local Development

1. **Clone and install dependencies**

```bash
npm install
```

2. **Setup environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup database**

```bash
# Start PostgreSQL with Docker (recommended)
docker-compose up -d postgres

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

4. **Start development server**

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`

Swagger documentation: `http://localhost:3000/api-docs`

### Docker Deployment

1. **Start all services**

```bash
docker-compose up -d
```

- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Swagger: `http://localhost:3000/api-docs`

2. **Stop services**

```bash
docker-compose down
```

## API Documentation

Interactive Swagger documentation is available at `/api-docs` when running in development mode.

### Authentication

All protected endpoints require a valid JWT token. Include it in the Authorization header:

```
Authorization: Bearer <access_token>
```

Or send it as an HttpOnly cookie: `access_token`

### Standard Response Format

Success:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "meta": {}
}
```

Error:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [],
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## Environment Variables

See `.env.example` for all available configuration options. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRY` | Access token expiry | 15m |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | 7d |
| `CORS_ORIGIN` | Allowed CORS origins | http://localhost:3000 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit max requests | 100 |

**Security**: Always use strong, random secrets in production!

## Database

### Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npm run db:reset
```

### Seeding

```bash
npm run prisma:seed
```

Seed data includes:
- Admin user: `admin@example.com` / `password123`
- Demo user: `demo@example.com` / `password123`
- Sample tasks, goals, habits, notes, events

### Prisma Studio

View and edit database:

```bash
npm run prisma:studio
```

Available at `http://localhost:5555`

## Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

## Code Quality

```bash
# Lint
npm run lint

# Format
npm run format
```

## Production Deployment

### Build

```bash
npm run build
```

Produces optimized production build in `dist/` directory.

### Environment Configuration

1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set strong JWT secrets
4. Configure CORS for your domain
5. Set up email service (SMTP)
6. Enable Redis for production (caching, sessions)

### Docker Production

```bash
# Build production image
docker build -t person-api:latest --target production .

# Or use docker-compose
docker-compose -f docker-compose.yml --profile production up -d
```

### Health Checks

- `GET /health` - Application health status

## Security Best Practices

- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens with HttpOnly cookies
- Refresh token rotation
- Rate limiting on auth endpoints
- Helmet security headers
- CORS properly configured
- SQL injection protected (Prisma)
- XSS protection
- Request size limits
- No secrets in code

## RBAC & Permissions

### Roles
- `ADMIN`: Full system access
- `USER`: Regular user access

### Permissions
The system implements permission-based access control. Users with `ADMIN` role bypass permission checks.

Key permissions:
- `task:read`, `task:create`, `task:update`, `task:delete`
- `goal:*` (similar pattern)
- `habit:*`
- `note:*`
- `schedule:*`
- `dashboard:read`
- `admin:*` (admin-only)

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token

### Users (Authenticated)
- `GET /api/v1/users/profile` - Get profile
- `PUT /api/v1/users/profile` - Update profile
- `PUT /api/v1/users/avatar` - Upload avatar
- `PUT /api/v1/users/settings` - Update settings
- `DELETE /api/v1/users/account` - Delete account

### Tasks
- `GET /api/v1/tasks` - List tasks (with filters)
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks/:id` - Get task
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task
- `GET /api/v1/tasks/stats` - Get statistics
- `PUT /api/v1/tasks/bulk` - Bulk update

### Goals
- `GET /api/v1/goals` - List goals
- `POST /api/v1/goals` - Create goal
- `GET /api/v1/goals/:id` - Get goal
- `PUT /api/v1/goals/:id` - Update goal
- `DELETE /api/v1/goals/:id` - Delete goal
- `PUT /api/v1/goals/:id/progress` - Update progress
- `POST /api/v1/goals/:id/milestones` - Add milestone
- `PUT /api/v1/goals/:id/milestones/:milestoneId` - Update milestone
- `DELETE /api/v1/goals/:id/milestones/:milestoneId` - Delete milestone
- `GET /api/v1/goals/stats` - Get statistics

### Habits
- `GET /api/v1/habits` - List habits
- `POST /api/v1/habits` - Create habit
- `GET /api/v1/habits/:id` - Get habit
- `PUT /api/v1/habits/:id` - Update habit
- `DELETE /api/v1/habits/:id` - Delete habit
- `POST /api/v1/habits/:id/check-in` - Check in
- `GET /api/v1/habits/:id/check-ins` - Get check-ins
- `GET /api/v1/habits/stats` - Get statistics

### Notes
- `GET /api/v1/notes` - List notes
- `POST /api/v1/notes` - Create note
- `GET /api/v1/notes/:id` - Get note
- `PUT /api/v1/notes/:id` - Update note
- `DELETE /api/v1/notes/:id` - Delete note
- `PUT /api/v1/notes/:id/favorite` - Toggle favorite
- `GET /api/v1/notes/search?q=query` - Search notes

### Schedules
- `GET /api/v1/schedules` - List events
- `POST /api/v1/schedules` - Create event
- `GET /api/v1/schedules/:id` - Get event
- `PUT /api/v1/schedules/:id` - Update event
- `DELETE /api/v1/schedules/:id` - Delete event
- `GET /api/v1/schedules/upcoming` - Get upcoming events
- `GET /api/v1/schedules/range?startDate=&endDate=` - Get events by date range

### Dashboard
- `GET /api/v1/dashboard` - Overview dashboard
- `GET /api/v1/dashboard/tasks-analytics?startDate=&endDate=` - Task analytics
- `GET /api/v1/dashboard/habits-analytics?days=` - Habit analytics
- `GET /api/v1/dashboard/goals-progress` - Goals progress
- `GET /api/v1/dashboard/productivity-trends?period=` - Productivity trends

## Architecture Decisions

### Clean Architecture
The project follows Clean Architecture principles with clear separation of concerns:
- **Controllers** handle HTTP requests/responses
- **Services** contain business logic
- **Repositories** (via Prisma) handle data access
- **DTOs** define data contracts
- **Guards/Pipes/Filters** handle cross-cutting concerns

### Database Design
- Soft deletes with `deletedAt` field
- Proper indexing for performance
- Foreign key constraints with cascade deletes where appropriate
- JSON fields for flexible data (preferences, recurrence patterns)

### Security
- Password hashing with bcrypt
- JWT tokens stored in HttpOnly cookies + Authorization header
- Refresh token rotation
- Rate limiting
- Input validation on all endpoints
- SQL injection protection via Prisma
- XSS protection via Helmet
- CORS configuration

## Performance Considerations

- Pagination on all list endpoints
- Database query optimization (no N+1 with Prisma)
- Connection pooling configured
- Response compression
- Indexes on frequently queried fields
- Soft deletes for data retention

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Run linting and formatting
7. Submit a pull request

## License

UNLICENSED - Private project

## Support

For issues, questions, or feature requests, please open an issue on GitHub.