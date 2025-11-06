// Progress Tracking Types

export interface ExerciseProgress {
  exerciseId: string;
  completed: boolean;
  completedAt?: Date;
  attempts: number;
  lastAttemptAt?: Date;
  score?: number;
  timeSpent?: number; // in seconds
}

export interface LessonProgress {
  lessonId: string;
  moduleId: string;
  completed: boolean;
  completedAt?: Date;
  startedAt?: Date;
  lastAccessedAt?: Date;
  timeSpent: number; // in seconds
  exercises: Record<string, ExerciseProgress>;
  quizScore?: number;
  notes?: string;
}

export interface ModuleProgress {
  moduleId: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
  startedAt?: Date;
  lessonsCompleted: number;
  totalLessons: number;
}

export interface BadgeProgress {
  badgeId: string;
  earned: boolean;
  earnedAt?: Date;
  progress: number; // 0-100
}

export interface UserProgress {
  userId?: string;
  username?: string;
  startedAt: Date;
  lastAccessedAt: Date;
  totalTimeSpent: number; // in seconds
  lessons: Record<string, LessonProgress>;
  modules: Record<string, ModuleProgress>;
  badges: Record<string, BadgeProgress>;
  completedLessons: string[];
  completedModules: string[];
  currentLesson?: string;
  currentModule?: string;
  overallCompletion: number; // 0-100
}

export interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  totalExercises: number;
  completedExercises: number;
  totalModules: number;
  completedModules: number;
  totalBadges: number;
  earnedBadges: number;
  overallCompletion: number;
  averageQuizScore: number;
  totalTimeSpent: number;
  streak: number; // consecutive days
}

export interface ProgressExport {
  version: string;
  exportedAt: Date;
  progress: UserProgress;
}
