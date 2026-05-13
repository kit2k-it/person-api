import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { EncryptionUtil } from '../src/common/utils/encryption.util';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for all users
  const hashedPassword = await EncryptionUtil.hash('password123');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: true,
      timezone: 'UTC',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'USER',
      emailVerified: true,
      timezone: 'Asia/Ho_Chi_Minh',
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
        },
      },
    },
  });
  console.log('✅ Demo user created:', user.email);

  // Create sample tasks for demo user
  const tasks = await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for the Personal Management System API',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        tags: ['documentation', 'api'],
        order: 1,
      },
      {
        userId: user.id,
        title: 'Review pull requests',
        description: 'Review pending PRs from the team',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        tags: ['code-review', 'team'],
        order: 2,
      },
      {
        userId: user.id,
        title: 'Implement user authentication',
        description: 'Add JWT authentication with refresh tokens',
        status: 'DONE',
        priority: 'URGENT',
        completedAt: new Date(),
        tags: ['auth', 'security'],
        order: 3,
      },
      {
        userId: user.id,
        title: 'Optimize database queries',
        description: 'Fix N+1 queries and add indexes',
        status: 'TODO',
        priority: 'MEDIUM',
        tags: ['database', 'performance'],
        order: 4,
      },
      {
        userId: user.id,
        title: 'Write unit tests',
        description: 'Achieve 80% test coverage',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        tags: ['testing', 'quality'],
        order: 5,
      },
    ],
  });
  console.log(`✅ Created ${tasks.count} sample tasks`);

  // Create sample goals for demo user
  const goal1 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Launch Personal Management System',
      description: 'Complete development and launch the full-featured PMS API',
      status: 'IN_PROGRESS',
      progress: 60,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      color: '#3B82F6',
    },
  });

  // Add milestones to goal
  await prisma.milestone.createMany({
    data: [
      {
        goalId: goal1.id,
        title: 'Complete API development',
        description: 'All CRUD endpoints implemented',
        order: 1,
      },
      {
        goalId: goal1.id,
        title: 'Write documentation',
        description: 'Complete API docs and README',
        order: 2,
      },
      {
        goalId: goal1.id,
        title: 'Deploy to production',
        description: 'Deploy to cloud with Docker',
        order: 3,
      },
    ],
  });
  console.log('✅ Created goal with milestones');

  // Create sample habits for demo user
  const habits = await prisma.habit.createMany({
    data: [
      {
        userId: user.id,
        title: 'Morning Exercise',
        description: '30 minutes of exercise every morning',
        frequency: 'DAILY',
        targetCount: 1,
        unit: 'minutes',
        category: 'Health',
        color: '#10B981',
        reminderAt: new Date(new Date().setHours(7, 0, 0, 0)),
      },
      {
        userId: user.id,
        title: 'Read Books',
        description: 'Read at least 20 pages per day',
        frequency: 'DAILY',
        targetCount: 20,
        unit: 'pages',
        category: 'Learning',
        color: '#F59E0B',
        reminderAt: new Date(new Date().setHours(21, 0, 0, 0)),
      },
      {
        userId: user.id,
        title: 'Code Practice',
        description: 'Solve coding challenges on LeetCode',
        frequency: 'DAILY',
        targetCount: 1,
        unit: 'problems',
        category: 'Career',
        color: '#8B5CF6',
      },
    ],
  });
  console.log(`✅ Created ${habits.count} sample habits`);

  // Create sample check-ins for habits
  const habitRecords = await prisma.habit.findMany({
    where: { userId: user.id },
    take: 3,
  });

  for (const habit of habitRecords) {
    // Create check-ins for the last 7 days
    for (let i = 0; i < 7; i++) {
      const checkInDate = DateUtil.startOfDay(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
      await prisma.habitCheckIn.upsert({
        where: {
          habitId_date: {
            habitId: habit.id,
            date: checkInDate,
          },
        },
        update: {
          completedAt: Math.random() > 0.3 ? new Date() : null,
          count: habit.title.includes('Read') ? Math.floor(Math.random() * 30) + 10 : 1,
        },
        create: {
          habitId: habit.id,
          userId: user.id,
          date: checkInDate,
          completedAt: Math.random() > 0.3 ? new Date() : null,
          count: habit.title.includes('Read') ? Math.floor(Math.random() * 30) + 10 : 1,
        },
      });
    }
  }
  console.log('✅ Created habit check-ins');

  // Create sample notes for demo user
  const notes = await prisma.note.createMany({
    data: [
      {
        userId: user.id,
        title: 'Project Ideas',
        content: '# Project Ideas\n\n## Personal Management System\n- Build a comprehensive PMS API\n- Use NestJS + PostgreSQL + Prisma\n- Include task management, habit tracking, notes\n\n## Features to add:\n- AI-powered insights\n- Mobile app\n- Calendar integration',
        category: 'Ideas',
        tags: ['projects', 'planning'],
        isFavorite: true,
        wordCount: 42,
        readTime: 1,
      },
      {
        userId: user.id,
        title: 'Meeting Notes - Team Sync',
        content: '## Agenda\n\n1. Project updates\n2. blockers\n3. Next sprint planning\n\n## Action Items\n- Review PRs by Friday\n- Complete documentation\n- Setup CI/CD pipeline',
        category: 'Work',
        tags: ['meetings', 'team'],
        wordCount: 32,
        readTime: 1,
      },
      {
        userId: user.id,
        title: 'Learning Notes - System Design',
        content: '## Key Concepts\n\n- Scalability patterns\n- Database sharding\n- Caching strategies\n- Load balancing\n\n## Resources\n- "Designing Data-Intensive Applications"\n- System Design Primer on GitHub',
        category: 'Learning',
        tags: ['system-design', 'architecture'],
        wordCount: 28,
        readTime: 1,
      },
    ],
  });
  console.log(`✅ Created ${notes.count} sample notes`);

  // Create sample calendar events for demo user
  const now = new Date();
  const events = await prisma.schedule.createMany({
    data: [
      {
        userId: user.id,
        title: 'Team Standup',
        description: 'Daily standup meeting',
        type: 'EVENT',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30, 0),
        category: 'Work',
        color: '#3B82F6',
        priority: 'HIGH',
      },
      {
        userId: user.id,
        title: 'Project Deadline',
        description: 'Submit final project deliverables',
        type: 'TASK',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 0, 0, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59),
        isAllDay: true,
        category: 'Work',
        color: '#EF4444',
        priority: 'HIGH',
      },
      {
        userId: user.id,
        title: 'Doctor Appointment',
        description: 'Annual checkup',
        type: 'EVENT',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 15, 0, 0),
        location: 'City Medical Center',
        category: 'Personal',
        color: '#10B981',
      },
    ],
  });
  console.log(`✅ Created ${events.count} sample events`);

  // Create sample activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: user.id,
        action: 'USER_REGISTERED',
        resource: 'User',
        resourceId: user.id,
        details: { email: user.email },
      },
      {
        userId: user.id,
        action: 'TASK_CREATED',
        resource: 'Task',
        resourceId: 'sample-task-1',
        details: { title: 'Complete project documentation' },
      },
      {
        userId: user.id,
        action: 'LOGIN',
        resource: 'Auth',
        details: { ip: '127.0.0.1' },
      },
    ],
  });
  console.log('✅ Created activity logs');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Demo accounts:');
  console.log('   Admin: admin@example.com / password123');
  console.log('   User:  demo@example.com / password123');
}

// Helper function for date manipulation
const DateUtil = {
  startOfDay: (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
