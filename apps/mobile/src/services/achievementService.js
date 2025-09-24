// services/achievementService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS_STORAGE_KEY = 'user_achievements';

// Define available achievements
export const ACHIEVEMENTS = {
  FIRST_FLOW: {
    id: 'first_flow',
    title: 'First Flow',
    description: 'Created your first flow',
    icon: '🌟',
    message: 'Congratulations! You\'ve created your first flow. The journey begins!',
  },
  WEEK_STREAK: {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Completed flows for 7 consecutive days',
    icon: '🔥',
    message: 'Amazing! You\'ve maintained your flow for a whole week!',
  },
  MONTH_STREAK: {
    id: 'month_streak',
    title: 'Monthly Master',
    description: 'Completed flows for 30 consecutive days',
    icon: '🏆',
    message: 'Incredible! A full month of consistency! You\'re unstoppable!',
  },
  HUNDRED_FLOWS: {
    id: 'hundred_flows',
    title: 'Century Club',
    description: 'Completed 100 flows',
    icon: '💯',
    message: 'Wow! 100 flows completed! You\'re a true flow master!',
  },
  PERFECT_WEEK: {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Completed all flows for 7 days in a row',
    icon: '✨',
    message: 'Perfect week! You didn\'t miss a single day!',
  },
  EARLY_BIRD: {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Completed flows before 8 AM for 5 days',
    icon: '🐦',
    message: 'Early bird gets the worm! You\'re starting your days right!',
  },
  NIGHT_OWL: {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Completed flows after 10 PM for 5 days',
    icon: '🦉',
    message: 'Night owl alert! You\'re finishing strong!',
  },
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Shared progress 5 times',
    icon: '🦋',
    message: 'You\'re spreading the flow love! Keep inspiring others!',
  },
};

class AchievementService {
  constructor() {
    this.achievements = [];
    this.loadAchievements();
  }

  // Load achievements from storage
  async loadAchievements() {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      this.achievements = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading achievements:', error);
      this.achievements = [];
    }
  }

  // Save achievements to storage
  async saveAchievements() {
    try {
      await AsyncStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(this.achievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  }

  // Check if achievement is already unlocked
  hasAchievement(achievementId) {
    return this.achievements.some(a => a.id === achievementId);
  }

  // Unlock an achievement
  async unlockAchievement(achievementId, metadata = {}) {
    if (this.hasAchievement(achievementId)) {
      return null; // Already unlocked
    }

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) {
      console.warn(`Unknown achievement: ${achievementId}`);
      return null;
    }

    const unlockedAchievement = {
      ...achievement,
      unlockedAt: new Date().toISOString(),
      metadata,
    };

    this.achievements.push(unlockedAchievement);
    await this.saveAchievements();

    return unlockedAchievement;
  }

  // Get all unlocked achievements
  getAchievements() {
    return [...this.achievements];
  }

  // Get achievement progress for streak-based achievements
  getStreakProgress(currentStreak) {
    const achievements = [];
    
    if (currentStreak >= 7 && !this.hasAchievement('week_streak')) {
      achievements.push('week_streak');
    }
    
    if (currentStreak >= 30 && !this.hasAchievement('month_streak')) {
      achievements.push('month_streak');
    }

    return achievements;
  }

  // Check for flow count achievements
  getFlowCountProgress(totalFlows) {
    const achievements = [];
    
    if (totalFlows >= 1 && !this.hasAchievement('first_flow')) {
      achievements.push('first_flow');
    }
    
    if (totalFlows >= 100 && !this.hasAchievement('hundred_flows')) {
      achievements.push('hundred_flows');
    }

    return achievements;
  }

  // Check for perfect week achievement
  async checkPerfectWeek(flows) {
    if (this.hasAchievement('perfect_week')) {
      return [];
    }

    // Check if all 7 days of the week have flows
    const weekFlows = flows.filter(flow => {
      const flowDate = new Date(flow.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return flowDate >= weekAgo;
    });

    if (weekFlows.length >= 7) {
      return ['perfect_week'];
    }

    return [];
  }

  // Check for time-based achievements
  async checkTimeBasedAchievements(flows) {
    const achievements = [];
    
    // Check early bird (before 8 AM)
    const earlyFlows = flows.filter(flow => {
      const hour = new Date(flow.completedAt).getHours();
      return hour < 8;
    });

    if (earlyFlows.length >= 5 && !this.hasAchievement('early_bird')) {
      achievements.push('early_bird');
    }

    // Check night owl (after 10 PM)
    const nightFlows = flows.filter(flow => {
      const hour = new Date(flow.completedAt).getHours();
      return hour >= 22;
    });

    if (nightFlows.length >= 5 && !this.hasAchievement('night_owl')) {
      achievements.push('night_owl');
    }

    return achievements;
  }

  // Process flows and check for new achievements
  async processFlows(flows) {
    const newAchievements = [];
    
    // Calculate current streak
    const currentStreak = this.calculateStreak(flows);
    
    // Check streak-based achievements
    const streakAchievements = this.getStreakProgress(currentStreak);
    for (const achievementId of streakAchievements) {
      const unlocked = await this.unlockAchievement(achievementId, { streak: currentStreak });
      if (unlocked) newAchievements.push(unlocked);
    }

    // Check flow count achievements
    const flowCountAchievements = this.getFlowCountProgress(flows.length);
    for (const achievementId of flowCountAchievements) {
      const unlocked = await this.unlockAchievement(achievementId, { totalFlows: flows.length });
      if (unlocked) newAchievements.push(unlocked);
    }

    // Check perfect week
    const perfectWeekAchievements = await this.checkPerfectWeek(flows);
    for (const achievementId of perfectWeekAchievements) {
      const unlocked = await this.unlockAchievement(achievementId);
      if (unlocked) newAchievements.push(unlocked);
    }

    // Check time-based achievements
    const timeAchievements = await this.checkTimeBasedAchievements(flows);
    for (const achievementId of timeAchievements) {
      const unlocked = await this.unlockAchievement(achievementId);
      if (unlocked) newAchievements.push(unlocked);
    }

    return newAchievements;
  }

  // Calculate current streak from flows
  calculateStreak(flows) {
    if (!flows || flows.length === 0) return 0;

    // Sort flows by date (most recent first)
    const sortedFlows = flows
      .filter(flow => flow.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const flow of sortedFlows) {
      const flowDate = new Date(flow.completedAt);
      flowDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate - flowDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  }

  // Reset all achievements (for testing)
  async resetAchievements() {
    this.achievements = [];
    await this.saveAchievements();
  }
}

// Create singleton instance
const achievementService = new AchievementService();

export default achievementService;
