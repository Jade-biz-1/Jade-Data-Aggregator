import type {
  UserProgress,
  LessonProgress,
  ModuleProgress,
  ExerciseProgress,
  BadgeProgress,
  ProgressStats,
  ProgressExport,
} from './types';

const STORAGE_KEY = 'tutorial_progress';
const STORAGE_VERSION = '1.0';

export class ProgressTracker {
  private progress: UserProgress;
  private autoSave: boolean;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor(autoSave: boolean = true) {
    this.autoSave = autoSave;
    this.progress = this.loadProgress() || this.initializeProgress();
  }

  // ==================== INITIALIZATION ====================

  private initializeProgress(): UserProgress {
    const now = new Date();
    return {
      startedAt: now,
      lastAccessedAt: now,
      totalTimeSpent: 0,
      lessons: {},
      modules: {},
      badges: {},
      completedLessons: [],
      completedModules: [],
      overallCompletion: 0,
    };
  }

  // ==================== STORAGE OPERATIONS ====================

  saveProgress(): void {
    if (typeof window === 'undefined') return;

    try {
      this.progress.lastAccessedAt = new Date();
      const data = JSON.stringify(this.progress, this.dateReplacer);
      localStorage.setItem(STORAGE_KEY, data);
      console.log('[ProgressTracker] Progress saved successfully');
    } catch (error) {
      console.error('[ProgressTracker] Failed to save progress:', error);
    }
  }

  loadProgress(): UserProgress | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const progress = JSON.parse(data, this.dateReviver) as UserProgress;
      console.log('[ProgressTracker] Progress loaded successfully');
      return progress;
    } catch (error) {
      console.error('[ProgressTracker] Failed to load progress:', error);
      return null;
    }
  }

  private debouncedSave(): void {
    if (!this.autoSave) return;

    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = setTimeout(() => {
      this.saveProgress();
    }, 500); // Save after 500ms of inactivity
  }

  // ==================== LESSON TRACKING ====================

  startLesson(lessonId: string, moduleId: string): void {
    const now = new Date();

    if (!this.progress.lessons[lessonId]) {
      this.progress.lessons[lessonId] = {
        lessonId,
        moduleId,
        completed: false,
        startedAt: now,
        lastAccessedAt: now,
        timeSpent: 0,
        exercises: {},
      };
    } else {
      this.progress.lessons[lessonId].lastAccessedAt = now;
    }

    this.progress.currentLesson = lessonId;
    this.progress.currentModule = moduleId;

    // Initialize module if needed
    if (!this.progress.modules[moduleId]) {
      this.progress.modules[moduleId] = {
        moduleId,
        title: moduleId,
        completed: false,
        startedAt: now,
        lessonsCompleted: 0,
        totalLessons: 0,
      };
    }

    this.debouncedSave();
  }

  completeLesson(lessonId: string, quizScore?: number): void {
    const lesson = this.progress.lessons[lessonId];
    if (!lesson) {
      console.warn(`[ProgressTracker] Lesson ${lessonId} not found`);
      return;
    }

    const now = new Date();
    lesson.completed = true;
    lesson.completedAt = now;
    lesson.lastAccessedAt = now;

    if (quizScore !== undefined) {
      lesson.quizScore = quizScore;
    }

    // Add to completed list if not already there
    if (!this.progress.completedLessons.includes(lessonId)) {
      this.progress.completedLessons.push(lessonId);
    }

    // Update module progress
    this.updateModuleProgress(lesson.moduleId);

    // Recalculate overall completion
    this.updateOverallCompletion();

    this.debouncedSave();
    console.log(`[ProgressTracker] Lesson ${lessonId} completed`);
  }

  unmarkLessonComplete(lessonId: string): void {
    const lesson = this.progress.lessons[lessonId];
    if (!lesson) return;

    lesson.completed = false;
    lesson.completedAt = undefined;

    // Remove from completed list
    this.progress.completedLessons = this.progress.completedLessons.filter(
      (id) => id !== lessonId
    );

    // Update module progress
    this.updateModuleProgress(lesson.moduleId);

    // Recalculate overall completion
    this.updateOverallCompletion();

    this.debouncedSave();
  }

  addTimeToLesson(lessonId: string, seconds: number): void {
    const lesson = this.progress.lessons[lessonId];
    if (!lesson) return;

    lesson.timeSpent += seconds;
    this.progress.totalTimeSpent += seconds;
    this.debouncedSave();
  }

  // ==================== EXERCISE TRACKING ====================

  startExercise(lessonId: string, exerciseId: string): void {
    const lesson = this.progress.lessons[lessonId];
    if (!lesson) {
      console.warn(`[ProgressTracker] Lesson ${lessonId} not found`);
      return;
    }

    if (!lesson.exercises[exerciseId]) {
      lesson.exercises[exerciseId] = {
        exerciseId,
        completed: false,
        attempts: 0,
      };
    }

    lesson.exercises[exerciseId].lastAttemptAt = new Date();
    lesson.exercises[exerciseId].attempts += 1;

    this.debouncedSave();
  }

  completeExercise(
    lessonId: string,
    exerciseId: string,
    score?: number,
    timeSpent?: number
  ): void {
    const lesson = this.progress.lessons[lessonId];
    if (!lesson) {
      console.warn(`[ProgressTracker] Lesson ${lessonId} not found`);
      return;
    }

    if (!lesson.exercises[exerciseId]) {
      lesson.exercises[exerciseId] = {
        exerciseId,
        completed: false,
        attempts: 0,
      };
    }

    const exercise = lesson.exercises[exerciseId];
    exercise.completed = true;
    exercise.completedAt = new Date();

    if (score !== undefined) {
      exercise.score = score;
    }

    if (timeSpent !== undefined) {
      exercise.timeSpent = timeSpent;
    }

    this.debouncedSave();
    console.log(`[ProgressTracker] Exercise ${exerciseId} completed`);
  }

  // ==================== MODULE TRACKING ====================

  private updateModuleProgress(moduleId: string): void {
    const moduleProgress = this.progress.modules[moduleId];
    if (!moduleProgress) return;

    // Count completed lessons in this module
    const moduleLessons = Object.values(this.progress.lessons).filter(
      (lesson) => lesson.moduleId === moduleId
    );

    const completedCount = moduleLessons.filter((lesson) => lesson.completed).length;
    moduleProgress.lessonsCompleted = completedCount;
    moduleProgress.totalLessons = moduleLessons.length;

    // Check if module is completed
    if (moduleProgress.totalLessons > 0 && completedCount === moduleProgress.totalLessons) {
      moduleProgress.completed = true;
      moduleProgress.completedAt = new Date();

      // Add to completed modules list
      if (!this.progress.completedModules.includes(moduleId)) {
        this.progress.completedModules.push(moduleId);
      }
    } else {
      moduleProgress.completed = false;
      moduleProgress.completedAt = undefined;

      // Remove from completed modules list
      this.progress.completedModules = this.progress.completedModules.filter(
        (id) => id !== moduleId
      );
    }
  }

  setModuleInfo(moduleId: string, title: string, totalLessons: number): void {
    if (!this.progress.modules[moduleId]) {
      this.progress.modules[moduleId] = {
        moduleId,
        title,
        completed: false,
        startedAt: new Date(),
        lessonsCompleted: 0,
        totalLessons,
      };
    } else {
      this.progress.modules[moduleId].title = title;
      this.progress.modules[moduleId].totalLessons = totalLessons;
    }

    this.debouncedSave();
  }

  // ==================== BADGE TRACKING ====================

  awardBadge(badgeId: string): void {
    if (!this.progress.badges[badgeId]) {
      this.progress.badges[badgeId] = {
        badgeId,
        earned: false,
        progress: 0,
      };
    }

    this.progress.badges[badgeId].earned = true;
    this.progress.badges[badgeId].earnedAt = new Date();
    this.progress.badges[badgeId].progress = 100;

    this.debouncedSave();
    console.log(`[ProgressTracker] Badge ${badgeId} awarded`);
  }

  updateBadgeProgress(badgeId: string, progress: number): void {
    if (!this.progress.badges[badgeId]) {
      this.progress.badges[badgeId] = {
        badgeId,
        earned: false,
        progress: 0,
      };
    }

    this.progress.badges[badgeId].progress = Math.min(100, Math.max(0, progress));
    this.debouncedSave();
  }

  // ==================== COMPLETION CALCULATIONS ====================

  getCompletionPercentage(): number {
    return this.progress.overallCompletion;
  }

  private updateOverallCompletion(): void {
    const stats = this.getStats();

    if (stats.totalLessons === 0) {
      this.progress.overallCompletion = 0;
      return;
    }

    this.progress.overallCompletion = Math.round(
      (stats.completedLessons / stats.totalLessons) * 100
    );
  }

  getStats(): ProgressStats {
    const lessons = Object.values(this.progress.lessons);
    const modules = Object.values(this.progress.modules);
    const badges = Object.values(this.progress.badges);

    const completedLessons = lessons.filter((l) => l.completed).length;
    const totalLessons = lessons.length;

    // Count exercises
    let totalExercises = 0;
    let completedExercises = 0;
    lessons.forEach((lesson) => {
      const exercises = Object.values(lesson.exercises);
      totalExercises += exercises.length;
      completedExercises += exercises.filter((e) => e.completed).length;
    });

    // Calculate average quiz score
    const lessonsWithQuiz = lessons.filter((l) => l.quizScore !== undefined);
    const averageQuizScore =
      lessonsWithQuiz.length > 0
        ? lessonsWithQuiz.reduce((sum, l) => sum + (l.quizScore || 0), 0) /
          lessonsWithQuiz.length
        : 0;

    // Calculate streak (simplified - would need date tracking for real implementation)
    const streak = 0; // TODO: Implement proper streak calculation

    return {
      totalLessons,
      completedLessons,
      totalExercises,
      completedExercises,
      totalModules: modules.length,
      completedModules: modules.filter((m) => m.completed).length,
      totalBadges: badges.length,
      earnedBadges: badges.filter((b) => b.earned).length,
      overallCompletion: this.progress.overallCompletion,
      averageQuizScore: Math.round(averageQuizScore),
      totalTimeSpent: this.progress.totalTimeSpent,
      streak,
    };
  }

  // ==================== GETTERS ====================

  getProgress(): UserProgress {
    return { ...this.progress };
  }

  getLessonProgress(lessonId: string): LessonProgress | undefined {
    return this.progress.lessons[lessonId];
  }

  getModuleProgress(moduleId: string): ModuleProgress | undefined {
    return this.progress.modules[moduleId];
  }

  isLessonCompleted(lessonId: string): boolean {
    return this.progress.lessons[lessonId]?.completed || false;
  }

  isModuleCompleted(moduleId: string): boolean {
    return this.progress.modules[moduleId]?.completed || false;
  }

  isBadgeEarned(badgeId: string): boolean {
    return this.progress.badges[badgeId]?.earned || false;
  }

  // ==================== EXPORT / IMPORT ====================

  exportProgress(): ProgressExport {
    return {
      version: STORAGE_VERSION,
      exportedAt: new Date(),
      progress: { ...this.progress },
    };
  }

  exportProgressAsJSON(): string {
    const exportData = this.exportProgress();
    return JSON.stringify(exportData, this.dateReplacer, 2);
  }

  exportProgressAsFile(): void {
    if (typeof window === 'undefined') return;

    const json = this.exportProgressAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `tutorial-progress-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[ProgressTracker] Progress exported to file');
  }

  importProgress(data: ProgressExport | string): boolean {
    try {
      const exportData: ProgressExport =
        typeof data === 'string' ? JSON.parse(data, this.dateReviver) : data;

      // Validate version
      if (exportData.version !== STORAGE_VERSION) {
        console.warn(
          `[ProgressTracker] Version mismatch: ${exportData.version} vs ${STORAGE_VERSION}`
        );
      }

      this.progress = exportData.progress;
      this.saveProgress();

      console.log('[ProgressTracker] Progress imported successfully');
      return true;
    } catch (error) {
      console.error('[ProgressTracker] Failed to import progress:', error);
      return false;
    }
  }

  // ==================== UTILITY ====================

  resetProgress(): void {
    this.progress = this.initializeProgress();
    this.saveProgress();
    console.log('[ProgressTracker] Progress reset');
  }

  clearStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    console.log('[ProgressTracker] Storage cleared');
  }

  setUserId(userId: string, username?: string): void {
    this.progress.userId = userId;
    if (username) {
      this.progress.username = username;
    }
    this.debouncedSave();
  }

  // Date serialization helpers
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }
}

// Export singleton instance
export const progressTracker = new ProgressTracker(true);
