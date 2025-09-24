// utils/notificationHelpers.js
import { useNotificationContext } from '../context/NotificationContext';
import { useAchievements } from '../hooks/useAchievements';

// Helper function to process flow completion and trigger notifications
export const processFlowCompletion = async (flowData, flows) => {
  try {
    // This would typically be called when a user completes a flow
    // For now, we'll create a mock flow completion
    
    const completedFlow = {
      id: flowData.id || Date.now().toString(),
      completedAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      ...flowData
    };

    // Add the completed flow to the flows array
    const updatedFlows = [...flows, completedFlow];

    // Process achievements (this would be called from the achievement hook)
    // const { processFlows } = useAchievements();
    // const newAchievements = await processFlows(updatedFlows);

    return {
      success: true,
      completedFlow,
      updatedFlows,
      // newAchievements
    };
  } catch (error) {
    console.error('Error processing flow completion:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to send daily reminder
export const sendDailyReminder = async () => {
  try {
    const { sendNotification } = useNotificationContext();
    
    const messages = [
      "Good morning! Time to check in with your flows. How are you feeling today?",
      "Rise and shine! Your daily flow check-in is waiting for you.",
      "Morning! Ready to start your day with some mindful reflection?",
      "Good day! Don't forget to complete your daily flows.",
      "Hello! Your flows are calling - time for your daily check-in!"
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    await sendNotification(
      "Daily Flow Reminder",
      randomMessage,
      { type: 'daily_reminder' }
    );

    return { success: true };
  } catch (error) {
    console.error('Error sending daily reminder:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to send weekly report
export const sendWeeklyReport = async (weeklyStats) => {
  try {
    const { sendNotification } = useNotificationContext();
    
    const { completedFlows, streak, achievements } = weeklyStats;
    
    let message = `This week you completed ${completedFlows} flows`;
    if (streak > 0) {
      message += ` and maintained a ${streak}-day streak`;
    }
    if (achievements > 0) {
      message += `! You also unlocked ${achievements} new achievement${achievements > 1 ? 's' : ''}`;
    }
    message += '. Keep up the great work!';

    await sendNotification(
      "Weekly Flow Report",
      message,
      { 
        type: 'weekly_report',
        stats: weeklyStats
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error sending weekly report:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to send achievement notification
export const sendAchievementNotification = async (achievement) => {
  try {
    const { sendNotification } = useNotificationContext();
    
    await sendNotification(
      `${achievement.icon} ${achievement.title}`,
      achievement.message,
      { 
        type: 'achievement',
        achievementId: achievement.id,
        ...achievement
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error sending achievement notification:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to send community update
export const sendCommunityUpdate = async (updateData) => {
  try {
    const { sendNotification } = useNotificationContext();
    
    await sendNotification(
      "Community Update",
      updateData.message || "New activity in your community!",
      { 
        type: 'community_update',
        ...updateData
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error sending community update:', error);
    return { success: false, error: error.message };
  }
};
