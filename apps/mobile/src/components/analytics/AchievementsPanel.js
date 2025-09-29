import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { colors, typography, layout } from '../../../styles';

const { width: screenWidth } = Dimensions.get('window');

const AchievementsPanel = ({ flows, theme = 'light' }) => {
  const themeColors = theme === 'light' ? colors.light : colors.dark;

  const achievements = useMemo(() => {
    const now = moment();
    const achievements = [];
    
    // Calculate overall stats
    let totalCompleted = 0;
    let totalScheduled = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let totalPoints = 0;

    flows.forEach(flow => {
      const startDate = moment(flow.startDate);
      const endDate = now;
      const diffInDays = endDate.diff(startDate, 'days') + 1;

      let flowCompleted = 0;
      let flowScheduled = 0;
      let flowStreak = 0;
      let maxStreak = 0;

      for (let i = 0; i < diffInDays; i++) {
        const currentDate = startDate.clone().add(i, 'days');
        const dayKey = currentDate.format('YYYY-MM-DD');
        
        const isScheduled = flow.repeatType === 'day' 
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(currentDate.format('ddd')))
          : flow.selectedMonthDays && flow.selectedMonthDays.includes(currentDate.date().toString());

        if (isScheduled) {
          flowScheduled++;
          totalScheduled++;
          const status = flow.status?.[dayKey];
          if (status?.symbol === '✅') {
            flowCompleted++;
            totalCompleted++;
            flowStreak++;
            maxStreak = Math.max(maxStreak, flowStreak);
            totalPoints += 10;
          } else {
            flowStreak = 0;
          }
        }
      }

      bestStreak = Math.max(bestStreak, maxStreak);
    });

    const successRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;

    // Generate achievements based on data
    if (totalCompleted >= 100) {
      achievements.push({
        id: 'century',
        title: 'Century Club',
        description: 'Completed 100+ flow entries',
        icon: '🏆',
        color: colors.light.success,
        unlocked: true,
        progress: Math.min(totalCompleted, 100),
        maxProgress: 100,
      });
    } else {
      achievements.push({
        id: 'century',
        title: 'Century Club',
        description: 'Complete 100 flow entries',
        icon: '🏆',
        color: colors.light.secondaryText,
        unlocked: false,
        progress: totalCompleted,
        maxProgress: 100,
      });
    }

    if (bestStreak >= 30) {
      achievements.push({
        id: 'month_master',
        title: 'Month Master',
        description: '30+ day streak achieved',
        icon: '🔥',
        color: colors.light.warning,
        unlocked: true,
        progress: Math.min(bestStreak, 30),
        maxProgress: 30,
      });
    } else {
      achievements.push({
        id: 'month_master',
        title: 'Month Master',
        description: 'Achieve a 30-day streak',
        icon: '🔥',
        color: colors.light.secondaryText,
        unlocked: false,
        progress: bestStreak,
        maxProgress: 30,
      });
    }

    if (successRate >= 80) {
      achievements.push({
        id: 'consistency_king',
        title: 'Consistency King',
        description: '80%+ success rate maintained',
        icon: '👑',
        color: colors.light.info,
        unlocked: true,
        progress: Math.min(successRate, 80),
        maxProgress: 80,
      });
    } else {
      achievements.push({
        id: 'consistency_king',
        title: 'Consistency King',
        description: 'Maintain 80% success rate',
        icon: '👑',
        color: colors.light.secondaryText,
        unlocked: false,
        progress: successRate,
        maxProgress: 80,
      });
    }

    if (flows.length >= 5) {
      achievements.push({
        id: 'flow_master',
        title: 'Flow Master',
        description: 'Tracking 5+ different flows',
        icon: '⭐',
        color: colors.light.primaryOrange,
        unlocked: true,
        progress: Math.min(flows.length, 5),
        maxProgress: 5,
      });
    } else {
      achievements.push({
        id: 'flow_master',
        title: 'Flow Master',
        description: 'Track 5 different flows',
        icon: '⭐',
        color: colors.light.secondaryText,
        unlocked: false,
        progress: flows.length,
        maxProgress: 5,
      });
    }

    if (totalPoints >= 1000) {
      achievements.push({
        id: 'point_collector',
        title: 'Point Collector',
        description: 'Earned 1000+ points',
        icon: '💎',
        color: colors.light.success,
        unlocked: true,
        progress: Math.min(totalPoints, 1000),
        maxProgress: 1000,
      });
    } else {
      achievements.push({
        id: 'point_collector',
        title: 'Point Collector',
        description: 'Earn 1000 points',
        icon: '💎',
        color: colors.light.secondaryText,
        unlocked: false,
        progress: totalPoints,
        maxProgress: 1000,
      });
    }

    if (bestStreak >= 7) {
      achievements.push({
        id: 'week_warrior',
        title: 'Week Warrior',
        description: '7+ day streak achieved',
        icon: '⚡',
        color: colors.light.warning,
        unlocked: true,
        progress: Math.min(bestStreak, 7),
        maxProgress: 7,
      });
    } else {
      achievements.push({
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Achieve a 7-day streak',
        icon: '⚡',
        color: colors.light.secondaryText,
        unlocked: false,
        progress: bestStreak,
        maxProgress: 7,
      });
    }

    return achievements;
  }, [flows]);

  const AchievementCard = ({ achievement }) => (
    <View style={[styles.achievementCard, { backgroundColor: themeColors.cardBackground }]}>
      <LinearGradient
        colors={achievement.unlocked ? [achievement.color + '20', achievement.color + '10'] : [themeColors.progressBackground + '20', themeColors.progressBackground + '10']}
        style={styles.achievementGradient}
      >
        <View style={styles.achievementHeader}>
          <Text style={styles.achievementIcon}>{achievement.icon}</Text>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, { color: achievement.unlocked ? themeColors.primaryText : themeColors.secondaryText }]}>
              {achievement.title}
            </Text>
            <Text style={[styles.achievementDescription, { color: themeColors.secondaryText }]}>
              {achievement.description}
            </Text>
          </View>
          {achievement.unlocked && (
            <View style={[styles.unlockedBadge, { backgroundColor: achievement.color }]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: themeColors.progressBackground }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                  backgroundColor: achievement.unlocked ? achievement.color : themeColors.secondaryText
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: themeColors.secondaryText }]}>
            {achievement.progress}/{achievement.maxProgress}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>
          Achievements
        </Text>
        <Text style={[styles.sectionSubtitle, { color: themeColors.secondaryText }]}>
          {unlockedCount}/{achievements.length} unlocked
        </Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.achievementsContainer}
      >
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: layout.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  sectionTitle: {
    ...typography.styles.title2,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  sectionSubtitle: {
    ...typography.styles.caption,
    opacity: 0.8,
  },
  achievementsContainer: {
    paddingHorizontal: layout.spacing.md,
  },
  achievementCard: {
    width: screenWidth * 0.7,
    marginRight: layout.spacing.md,
    borderRadius: layout.radii.large,
    ...layout.elevation.low,
  },
  achievementGradient: {
    padding: layout.spacing.md,
    borderRadius: layout.radii.large,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: layout.spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    ...typography.styles.title3,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  achievementDescription: {
    ...typography.styles.caption,
    lineHeight: 16,
  },
  unlockedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: layout.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...typography.styles.caption,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
});

export default AchievementsPanel;
