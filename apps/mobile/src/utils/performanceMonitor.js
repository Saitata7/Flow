// utils/performanceMonitor.js
// Performance monitoring utility for React Native

import { InteractionManager } from 'react-native';
import logger from './logger';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTimes: [],
      apiCallTimes: [],
      syncTimes: [],
      calculationTimes: []
    };
    this.thresholds = {
      render: 100, // ms
      apiCall: 2000, // ms
      sync: 5000, // ms
      calculation: 500 // ms
    };
    this.isEnabled = __DEV__; // Only enable in development
  }

  /**
   * Monitor render performance
   */
  startRenderTimer(componentName) {
    if (!this.isEnabled) return null;
    
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      this.metrics.renderTimes.push({
        component: componentName,
        time: renderTime,
        timestamp: new Date().toISOString()
      });
      
      if (renderTime > this.thresholds.render) {
        logger.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
      
      return renderTime;
    };
  }

  /**
   * Monitor API call performance
   */
  startApiTimer(endpoint) {
    if (!this.isEnabled) return null;
    
    const startTime = performance.now();
    
    return (success = true) => {
      const endTime = performance.now();
      const apiTime = endTime - startTime;
      
      this.metrics.apiCallTimes.push({
        endpoint,
        time: apiTime,
        success,
        timestamp: new Date().toISOString()
      });
      
      if (apiTime > this.thresholds.apiCall) {
        logger.warn(`⚠️ Slow API call detected for ${endpoint}: ${apiTime.toFixed(2)}ms`);
      }
      
      return apiTime;
    };
  }

  /**
   * Monitor sync performance
   */
  startSyncTimer(syncType) {
    if (!this.isEnabled) return null;
    
    const startTime = performance.now();
    
    return (success = true) => {
      const endTime = performance.now();
      const syncTime = endTime - startTime;
      
      this.metrics.syncTimes.push({
        type: syncType,
        time: syncTime,
        success,
        timestamp: new Date().toISOString()
      });
      
      if (syncTime > this.thresholds.sync) {
        logger.warn(`⚠️ Slow sync detected for ${syncType}: ${syncTime.toFixed(2)}ms`);
      }
      
      return syncTime;
    };
  }

  /**
   * Monitor calculation performance
   */
  startCalculationTimer(calculationName) {
    if (!this.isEnabled) return null;
    
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const calculationTime = endTime - startTime;
      
      this.metrics.calculationTimes.push({
        name: calculationName,
        time: calculationTime,
        timestamp: new Date().toISOString()
      });
      
      if (calculationTime > this.thresholds.calculation) {
        logger.warn(`⚠️ Slow calculation detected for ${calculationName}: ${calculationTime.toFixed(2)}ms`);
      }
      
      return calculationTime;
    };
  }

  /**
   * Wrap a function with performance monitoring
   */
  wrapFunction(fn, name) {
    if (!this.isEnabled) return fn;
    
    return async (...args) => {
      const timer = this.startCalculationTimer(name);
      try {
        const result = await fn(...args);
        timer();
        return result;
      } catch (error) {
        timer();
        throw error;
      }
    };
  }

  /**
   * Monitor heavy operations with InteractionManager
   */
  monitorHeavyOperation(operationName, operation) {
    if (!this.isEnabled) return operation();
    
    return InteractionManager.runAfterInteractions(async () => {
      const timer = this.startCalculationTimer(operationName);
      try {
        const result = await operation();
        timer();
        return result;
      } catch (error) {
        timer();
        throw error;
      }
    });
  }

  /**
   * Get performance metrics summary
   */
  getMetricsSummary() {
    const summary = {
      render: this.getMetricSummary('renderTimes'),
      apiCalls: this.getMetricSummary('apiCallTimes'),
      sync: this.getMetricSummary('syncTimes'),
      calculations: this.getMetricSummary('calculationTimes')
    };
    
    return summary;
  }

  /**
   * Get summary for a specific metric type
   */
  getMetricSummary(metricType) {
    const metrics = this.metrics[metricType];
    if (!metrics || metrics.length === 0) {
      return { count: 0, average: 0, max: 0, min: 0 };
    }
    
    const times = metrics.map(m => m.time);
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    return {
      count: metrics.length,
      average: Math.round(average * 100) / 100,
      max: Math.round(max * 100) / 100,
      min: Math.round(min * 100) / 100
    };
  }

  /**
   * Get slow operations
   */
  getSlowOperations() {
    const slowOperations = [];
    
    Object.keys(this.metrics).forEach(metricType => {
      const threshold = this.thresholds[metricType.replace('Times', '')];
      const slowMetrics = this.metrics[metricType].filter(m => m.time > threshold);
      
      slowMetrics.forEach(metric => {
        slowOperations.push({
          type: metricType.replace('Times', ''),
          name: metric.component || metric.endpoint || metric.type || metric.name,
          time: metric.time,
          timestamp: metric.timestamp
        });
      });
    });
    
    return slowOperations.sort((a, b) => b.time - a.time);
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = [];
    });
    logger.log('Performance metrics cleared');
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: this.getMetricsSummary(),
      slowOperations: this.getSlowOperations(),
      rawMetrics: this.metrics
    };
    
    return exportData;
  }

  /**
   * Log performance report
   */
  logPerformanceReport() {
    const summary = this.getMetricsSummary();
    const slowOperations = this.getSlowOperations();
    
    logger.log('📊 Performance Report:');
    logger.log('  Render Times:', summary.render);
    logger.log('  API Calls:', summary.apiCalls);
    logger.log('  Sync Operations:', summary.sync);
    logger.log('  Calculations:', summary.calculations);
    
    if (slowOperations.length > 0) {
      logger.warn('⚠️ Slow Operations:');
      slowOperations.slice(0, 5).forEach(op => {
        logger.warn(`  ${op.type}: ${op.name} - ${op.time.toFixed(2)}ms`);
      });
    }
  }
}

// Export singleton instance
export default new PerformanceMonitor();
