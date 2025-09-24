// services/schedulerService.js
const cron = require('node-cron');
const notificationService = require('./notificationService');
const { db } = require('../db/config');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('Scheduler service already initialized');
      return;
    }

    try {
      // Start daily reminder job (runs every minute to check for users who need reminders)
      this.startDailyReminderJob();
      
      // Start weekly report job (runs every Sunday at 9 AM)
      this.startWeeklyReportJob();
      
      // Start cleanup job (runs daily at 2 AM to clean up old logs)
      this.startCleanupJob();

      this.isInitialized = true;
      console.log('Scheduler service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize scheduler service:', error);
      throw error;
    }
  }

  startDailyReminderJob() {
    // Run every minute to check for users who need daily reminders
    const job = cron.schedule('* * * * *', async () => {
      try {
        await this.processDailyReminders();
      } catch (error) {
        console.error('Error processing daily reminders:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    job.start();
    this.jobs.set('dailyReminders', job);
    console.log('Daily reminder job started');
  }

  startWeeklyReportJob() {
    // Run every Sunday at 9 AM UTC
    const job = cron.schedule('0 9 * * 0', async () => {
      try {
        await this.processWeeklyReports();
      } catch (error) {
        console.error('Error processing weekly reports:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    job.start();
    this.jobs.set('weeklyReports', job);
    console.log('Weekly report job started');
  }

  startCleanupJob() {
    // Run daily at 2 AM UTC to clean up old notification logs
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        await this.cleanupOldLogs();
      } catch (error) {
        console.error('Error cleaning up old logs:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    job.start();
    this.jobs.set('cleanup', job);
    console.log('Cleanup job started');
  }

  async processDailyReminders() {
    try {
      const currentTime = new Date();
      const currentHour = currentTime.getUTCHours();
      const currentMinute = currentTime.getUTCMinutes();
      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      // Get users who have daily reminders enabled and their reminder time matches current time
      const query = `
        SELECT us.user_id, us.settings
        FROM user_settings us
        WHERE us.deleted_at IS NULL
        AND JSON_EXTRACT(us.settings, '$.reminders.dailyReminders') = true
        AND JSON_EXTRACT(us.settings, '$.reminders.reminderTime') = ?
      `;

      const result = await db.query(query, [currentTimeString]);
      
      for (const row of result.rows) {
        const userId = row.user_id;
        const settings = row.settings;
        
        try {
          // Check if user has already received a reminder today
          const today = new Date().toISOString().split('T')[0];
          const reminderCheckQuery = `
            SELECT COUNT(*) as count
            FROM notification_logs
            WHERE user_id = ? 
            AND category = 'reminder'
            AND DATE(sent_at) = ?
            AND JSON_EXTRACT(data, '$.type') = 'daily_reminder'
          `;
          
          const reminderResult = await db.query(reminderCheckQuery, [userId, today]);
          
          if (reminderResult.rows[0].count === 0) {
            // Send daily reminder
            await notificationService.sendPush(userId, {
              title: 'Daily Flow Reminder',
              body: "Don't forget to complete your daily flows!",
              category: 'reminder',
              data: {
                type: 'daily_reminder',
                reminderTime: settings.reminders.reminderTime,
              },
            });
            
            console.log(`Daily reminder sent to user ${userId}`);
          }
        } catch (error) {
          console.error(`Error sending daily reminder to user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing daily reminders:', error);
    }
  }

  async processWeeklyReports() {
    try {
      // Get users who have weekly reports enabled
      const query = `
        SELECT us.user_id, us.settings
        FROM user_settings us
        WHERE us.deleted_at IS NULL
        AND JSON_EXTRACT(us.settings, '$.reminders.weeklyReports') = true
      `;

      const result = await db.query(query);
      
      for (const row of result.rows) {
        const userId = row.user_id;
        
        try {
          // Check if user has already received a weekly report this week
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
          weekStart.setHours(0, 0, 0, 0);
          
          const reportCheckQuery = `
            SELECT COUNT(*) as count
            FROM notification_logs
            WHERE user_id = ? 
            AND category = 'report'
            AND sent_at >= ?
            AND JSON_EXTRACT(data, '$.type') = 'weekly_report'
          `;
          
          const reportResult = await db.query(reportCheckQuery, [userId, weekStart.toISOString()]);
          
          if (reportResult.rows[0].count === 0) {
            // Send weekly report
            await notificationService.sendWeeklyReport(userId);
            console.log(`Weekly report sent to user ${userId}`);
          }
        } catch (error) {
          console.error(`Error sending weekly report to user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing weekly reports:', error);
    }
  }

  async cleanupOldLogs() {
    try {
      // Delete notification logs older than 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      const query = `
        DELETE FROM notification_logs 
        WHERE sent_at < ?
      `;
      
      const result = await db.query(query, [cutoffDate.toISOString()]);
      console.log(`Cleaned up ${result.rowCount} old notification logs`);
      
      // Delete inactive device tokens older than 30 days
      const deviceCutoffDate = new Date();
      deviceCutoffDate.setDate(deviceCutoffDate.getDate() - 30);
      
      const deviceQuery = `
        DELETE FROM user_devices 
        WHERE is_active = false 
        AND last_used_at < ?
      `;
      
      const deviceResult = await db.query(deviceQuery, [deviceCutoffDate.toISOString()]);
      console.log(`Cleaned up ${deviceResult.rowCount} inactive device tokens`);
      
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  async scheduleUserReminder(userId, reminderTime, timezone = 'UTC') {
    try {
      // Store user's reminder schedule in database
      const query = `
        INSERT INTO notification_schedules (user_id, type, scheduled_time, timezone, is_active, next_send_at)
        VALUES (?, 'daily_reminder', ?, ?, true, ?)
        ON CONFLICT (user_id, type) 
        DO UPDATE SET 
          scheduled_time = EXCLUDED.scheduled_time,
          timezone = EXCLUDED.timezone,
          is_active = EXCLUDED.is_active,
          next_send_at = EXCLUDED.next_send_at
      `;
      
      // Calculate next send time
      const nextSendTime = this.calculateNextSendTime(reminderTime, timezone);
      
      await db.query(query, [userId, reminderTime, timezone, nextSendTime.toISOString()]);
      
      console.log(`Scheduled daily reminder for user ${userId} at ${reminderTime} ${timezone}`);
    } catch (error) {
      console.error('Error scheduling user reminder:', error);
      throw error;
    }
  }

  calculateNextSendTime(reminderTime, timezone) {
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const nextSend = new Date();
    
    // Set the time
    nextSend.setUTCHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (nextSend <= now) {
      nextSend.setUTCDate(nextSend.getUTCDate() + 1);
    }
    
    return nextSend;
  }

  async cancelUserReminder(userId) {
    try {
      const query = `
        UPDATE notification_schedules 
        SET is_active = false, updated_at = NOW()
        WHERE user_id = ? AND type = 'daily_reminder'
      `;
      
      await db.query(query, [userId]);
      console.log(`Cancelled daily reminder for user ${userId}`);
    } catch (error) {
      console.error('Error cancelling user reminder:', error);
      throw error;
    }
  }

  stop() {
    console.log('Stopping scheduler service...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Stopped ${name} job`);
    }
    
    this.jobs.clear();
    this.isInitialized = false;
    console.log('Scheduler service stopped');
  }

  getJobStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    }
    return status;
  }
}

module.exports = new SchedulerService();
