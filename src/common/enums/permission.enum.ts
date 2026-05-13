export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Task permissions
  TASK_READ = 'task:read',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',

  // Goal permissions
  GOAL_READ = 'goal:read',
  GOAL_CREATE = 'goal:create',
  GOAL_UPDATE = 'goal:update',
  GOAL_DELETE = 'goal:delete',

  // Habit permissions
  HABIT_READ = 'habit:read',
  HABIT_CREATE = 'habit:create',
  HABIT_UPDATE = 'habit:update',
  HABIT_DELETE = 'habit:delete',

  // Note permissions
  NOTE_READ = 'note:read',
  NOTE_CREATE = 'note:create',
  NOTE_UPDATE = 'note:update',
  NOTE_DELETE = 'note:delete',

  // Schedule permissions
  SCHEDULE_READ = 'schedule:read',
  SCHEDULE_CREATE = 'schedule:create',
  SCHEDULE_UPDATE = 'schedule:update',
  SCHEDULE_DELETE = 'schedule:delete',

  // Dashboard permissions
  DASHBOARD_READ = 'dashboard:read',

  // Admin permissions
  ADMIN_READ_ALL = 'admin:read_all',
  ADMIN_UPDATE_ANY = 'admin:update_any',
  ADMIN_DELETE_ANY = 'admin:delete_any',
}