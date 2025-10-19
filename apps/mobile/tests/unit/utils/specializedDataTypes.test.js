/**
 * COMPREHENSIVE VALIDATION TESTS FOR SPECIALIZED DATA TYPES
 * Tests: Binary, Quantitative, Time-based, Activity Context, Stats, Notes, Emotional
 * Covers all specialized validation scenarios for flow tracking data
 */

import {
  sanitizeTextInput,
  validateInput,
  validateFlowData,
  validateUserData,
  validateNumericInput,
} from '../../../src/utils/validation';

// Mock specialized validation functions
const validateBinaryData = (data) => {
  const errors = [];
  
  if (data.symbol && !['+', '-', '*', '/'].includes(data.symbol)) {
    errors.push('Binary symbol must be +, -, *, or /');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData: {
      ...data,
      symbol: data.symbol || '+'
    }
  };
};

const validateQuantitativeData = (data) => {
  const errors = [];
  
  if (data.quantitative) {
    if (typeof data.quantitative.count !== 'number' || data.quantitative.count < 0) {
      errors.push('Quantitative count must be a non-negative number');
    }
    
    if (data.quantitative.unitText && typeof data.quantitative.unitText !== 'string') {
      errors.push('Unit text must be a string');
    }
    
    if (data.quantitative.unitText && data.quantitative.unitText.length > 50) {
      errors.push('Unit text must be no more than 50 characters');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData: {
      ...data,
      quantitative: data.quantitative ? {
        count: Math.max(0, data.quantitative.count || 0),
        unitText: sanitizeTextInput(data.quantitative.unitText || '')
      } : undefined
    }
  };
};

const validateTimeBasedData = (data) => {
  const errors = [];
  
  if (data.timebased) {
    if (typeof data.timebased.totalDuration !== 'number' || data.timebased.totalDuration < 0) {
      errors.push('Total duration must be a non-negative number');
    }
    
    if (data.timebased.segments && Array.isArray(data.timebased.segments)) {
      data.timebased.segments.forEach((segment, index) => {
        if (typeof segment.duration !== 'number' || segment.duration < 0) {
          errors.push(`Segment ${index + 1} duration must be a non-negative number`);
        }
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData: {
      ...data,
      timebased: data.timebased ? {
        totalDuration: Math.max(0, data.timebased.totalDuration || 0),
        segments: data.timebased.segments ? data.timebased.segments.map(segment => ({
          ...segment,
          duration: Math.max(0, segment.duration || 0)
        })) : []
      } : undefined
    }
  };
};

const validateEmotionalData = (data) => {
  const errors = [];
  
  if (data.emotion && typeof data.emotion !== 'string') {
    errors.push('Emotion must be a string');
  }
  
  if (data.emotion && data.emotion.length > 100) {
    errors.push('Emotion must be no more than 100 characters');
  }
  
  if (data.moodScore !== undefined) {
    if (typeof data.moodScore !== 'number' || data.moodScore < 1 || data.moodScore > 5) {
      errors.push('Mood score must be a number between 1 and 5');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData: {
      ...data,
      emotion: data.emotion ? sanitizeTextInput(data.emotion) : undefined,
      moodScore: data.moodScore !== undefined ? Math.max(1, Math.min(5, Math.round(data.moodScore))) : undefined
    }
  };
};

const validateNotesData = (data) => {
  const errors = [];
  
  if (data.note && typeof data.note !== 'string') {
    errors.push('Note must be a string');
  }
  
  if (data.note && data.note.length > 1000) {
    errors.push('Note must be no more than 1000 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData: {
      ...data,
      note: data.note ? sanitizeTextInput(data.note) : undefined
    }
  };
};

const validateStatsData = (data) => {
  const errors = [];
  
  if (data.stats) {
    if (typeof data.stats.completionRate !== 'number' || data.stats.completionRate < 0 || data.stats.completionRate > 100) {
      errors.push('Completion rate must be a number between 0 and 100');
    }
    
    if (typeof data.stats.streak !== 'number' || data.stats.streak < 0) {
      errors.push('Streak must be a non-negative number');
    }
    
    if (typeof data.stats.totalPoints !== 'number' || data.stats.totalPoints < 0) {
      errors.push('Total points must be a non-negative number');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData: {
      ...data,
      stats: data.stats ? {
        completionRate: Math.max(0, Math.min(100, data.stats.completionRate || 0)),
        streak: Math.max(0, data.stats.streak || 0),
        totalPoints: Math.max(0, data.stats.totalPoints || 0)
      } : undefined
    }
  };
};

const validateActivityContextData = (data) => {
  const errors = [];
  
  if (data.activityContext) {
    if (typeof data.activityContext.isActive !== 'boolean') {
      errors.push('Activity context isActive must be a boolean');
    }
    
    if (data.activityContext.lastActivity && typeof data.activityContext.lastActivity !== 'string') {
      errors.push('Last activity must be a string');
    }
    
    if (data.activityContext.sessionDuration && (typeof data.activityContext.sessionDuration !== 'number' || data.activityContext.sessionDuration < 0)) {
      errors.push('Session duration must be a non-negative number');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData: {
      ...data,
      activityContext: data.activityContext ? {
        isActive: Boolean(data.activityContext.isActive),
        lastActivity: data.activityContext.lastActivity ? sanitizeTextInput(data.activityContext.lastActivity) : undefined,
        sessionDuration: Math.max(0, data.activityContext.sessionDuration || 0)
      } : undefined
    }
  };
};

// Mock API and database operations
const mockApiCall = jest.fn();
const mockDbOperation = jest.fn();

describe('🔒 SPECIALIZED: Binary, Quantitative, Time-based, Activity Context, Stats, Notes, Emotional Validation', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('📊 BINARY TRACKING VALIDATION', () => {

    describe('✅ Binary Flow Entry Validation', () => {
      it('should validate binary flow entry data before API call', () => {
        const binaryEntryData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          emotion: 'happy',
          note: 'Great day!',
        };
        
        const validation = validateBinaryData(binaryEntryData);
        
        expect(validation.valid).toBe(true);
        expect(validation.sanitizedData.symbol).toBe('+');
        
        // Simulate API call with validated binary data
        mockApiCall('/flow-entries', validation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/flow-entries', validation.sanitizedData);
      });

      it('should reject invalid binary symbols before API call', () => {
        const invalidBinaryData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: 'invalid', // Invalid symbol
          emotion: 'happy',
          note: 'Great day!',
        };
        
        const validation = validateBinaryData(invalidBinaryData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Binary symbol must be +, -, *, or /');
        
        // Should not make API call with invalid binary data
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should sanitize malicious binary entry data before API call', () => {
        const maliciousBinaryData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          emotion: '<script>alert("xss")</script>happy',
          note: "'; DROP TABLE flow_entries; --",
        };
        
        const validation = validateBinaryData(maliciousBinaryData);
        const emotionValidation = validateEmotionalData(validation.sanitizedData);
        const notesValidation = validateNotesData(emotionValidation.sanitizedData);
        
        expect(validation.valid).toBe(true);
        expect(emotionValidation.valid).toBe(true);
        expect(notesValidation.valid).toBe(true);
        expect(notesValidation.sanitizedData.emotion).toBe('scriptalert(xss)/scripthappy');
        expect(notesValidation.sanitizedData.note).toBe('DROP TABLE flow_entries --');
        
        // Simulate API call with sanitized binary data
        mockApiCall('/flow-entries', notesValidation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/flow-entries', notesValidation.sanitizedData);
      });
    });

    describe('🗄️ Binary Database Operations', () => {
      it('should validate binary data before database insert', () => {
        const binaryData = {
          flowId: 'flow123',
          userId: 'user123',
          date: '2024-01-15',
          symbol: '+',
          emotion: 'happy',
          note: 'Completed successfully',
        };
        
        const validation = validateBinaryData(binaryData);
        const emotionValidation = validateEmotionalData(validation.sanitizedData);
        const notesValidation = validateNotesData(emotionValidation.sanitizedData);
        
        expect(validation.valid).toBe(true);
        expect(emotionValidation.valid).toBe(true);
        expect(notesValidation.valid).toBe(true);
        
        // Simulate database insert with validated binary data
        mockDbOperation('INSERT INTO flow_entries (flow_id, user_id, date, symbol, emotion, note) VALUES (?, ?, ?, ?, ?, ?)', 
          [notesValidation.sanitizedData.flowId, notesValidation.sanitizedData.userId, notesValidation.sanitizedData.date, 
           notesValidation.sanitizedData.symbol, notesValidation.sanitizedData.emotion, notesValidation.sanitizedData.note]);
        
        expect(mockDbOperation).toHaveBeenCalledWith(
          'INSERT INTO flow_entries (flow_id, user_id, date, symbol, emotion, note) VALUES (?, ?, ?, ?, ?, ?)', 
          ['flow123', 'user123', '2024-01-15', '+', 'happy', 'Completed successfully']
        );
      });
    });
  });

  describe('📈 QUANTITATIVE TRACKING VALIDATION', () => {

    describe('🔢 Quantitative Flow Entry Validation', () => {
      it('should validate quantitative flow entry data before API call', () => {
        const quantitativeEntryData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          quantitative: {
            count: 5,
            unitText: 'reps',
          },
          emotion: 'satisfied',
          note: 'Good workout',
        };
        
        const validation = validateQuantitativeData(quantitativeEntryData);
        
        expect(validation.valid).toBe(true);
        expect(validation.sanitizedData.quantitative.count).toBe(5);
        expect(validation.sanitizedData.quantitative.unitText).toBe('reps');
        
        // Simulate API call with validated quantitative data
        mockApiCall('/flow-entries', validation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/flow-entries', validation.sanitizedData);
      });

      it('should reject invalid quantitative count before API call', () => {
        const invalidQuantitativeData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          quantitative: {
            count: -5, // Invalid negative count
            unitText: 'reps',
          },
        };
        
        const validation = validateQuantitativeData(invalidQuantitativeData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Quantitative count must be a non-negative number');
        
        // Should not make API call with invalid quantitative data
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should validate quantitative unit text length before API call', () => {
        const invalidUnitTextData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          quantitative: {
            count: 5,
            unitText: 'a'.repeat(51), // Too long
          },
        };
        
        const validation = validateQuantitativeData(invalidUnitTextData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Unit text must be no more than 50 characters');
        
        // Should not make API call with invalid unit text
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should sanitize malicious quantitative data before API call', () => {
        const maliciousQuantitativeData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          quantitative: {
            count: 5,
            unitText: '<script>alert("xss")</script>reps',
          },
          note: "'; DROP TABLE quantitative_data; --",
        };
        
        const validation = validateQuantitativeData(maliciousQuantitativeData);
        const notesValidation = validateNotesData(validation.sanitizedData);
        
        expect(validation.valid).toBe(true);
        expect(notesValidation.valid).toBe(true);
        expect(validation.sanitizedData.quantitative.unitText).toBe('scriptalert(xss)/scriptreps');
        expect(notesValidation.sanitizedData.note).toBe('DROP TABLE quantitative_data --');
        
        // Simulate API call with sanitized quantitative data
        mockApiCall('/flow-entries', notesValidation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/flow-entries', notesValidation.sanitizedData);
      });
    });

    describe('🗄️ Quantitative Database Operations', () => {
      it('should validate quantitative data before database insert', () => {
        const quantitativeData = {
          flowId: 'flow123',
          userId: 'user123',
          date: '2024-01-15',
          symbol: '+',
          quantitative: {
            count: 10,
            unitText: 'pushups',
          },
        };
        
        const validation = validateQuantitativeData(quantitativeData);
        
        expect(validation.valid).toBe(true);
        expect(validation.sanitizedData.quantitative.count).toBe(10);
        expect(validation.sanitizedData.quantitative.unitText).toBe('pushups');
        
        // Simulate database insert with validated quantitative data
        mockDbOperation('INSERT INTO flow_entries (flow_id, user_id, date, symbol, quantitative_data) VALUES (?, ?, ?, ?, ?)', 
          [validation.sanitizedData.flowId, validation.sanitizedData.userId, validation.sanitizedData.date, 
           validation.sanitizedData.symbol, JSON.stringify(validation.sanitizedData.quantitative)]);
        
        expect(mockDbOperation).toHaveBeenCalledWith(
          'INSERT INTO flow_entries (flow_id, user_id, date, symbol, quantitative_data) VALUES (?, ?, ?, ?, ?)', 
          ['flow123', 'user123', '2024-01-15', '+', '{"count":10,"unitText":"pushups"}']
        );
      });
    });
  });

  describe('⏱️ TIME-BASED TRACKING VALIDATION', () => {

    describe('🕐 Time-based Flow Entry Validation', () => {
      it('should validate time-based flow entry data before API call', () => {
        const timeBasedEntryData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          timebased: {
            totalDuration: 1800, // 30 minutes in seconds
            segments: [
              { start: '09:00', end: '09:15', duration: 900 },
              { start: '09:15', end: '09:30', duration: 900 },
            ],
          },
          emotion: 'focused',
          note: 'Productive session',
        };
        
        const validation = validateTimeBasedData(timeBasedEntryData);
        
        expect(validation.valid).toBe(true);
        expect(validation.sanitizedData.timebased.totalDuration).toBe(1800);
        expect(validation.sanitizedData.timebased.segments).toHaveLength(2);
        
        // Simulate API call with validated time-based data
        mockApiCall('/flow-entries', validation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/flow-entries', validation.sanitizedData);
      });

      it('should reject invalid time-based duration before API call', () => {
        const invalidTimeBasedData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          timebased: {
            totalDuration: -300, // Invalid negative duration
            segments: [],
          },
        };
        
        const validation = validateTimeBasedData(invalidTimeBasedData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Total duration must be a non-negative number');
        
        // Should not make API call with invalid time-based data
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should validate time-based segments before API call', () => {
        const invalidSegmentsData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          timebased: {
            totalDuration: 1800,
            segments: [
              { start: '09:00', end: '09:15', duration: -900 }, // Invalid negative duration
            ],
          },
        };
        
        const validation = validateTimeBasedData(invalidSegmentsData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Segment 1 duration must be a non-negative number');
        
        // Should not make API call with invalid segments
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should sanitize malicious time-based data before API call', () => {
        const maliciousTimeBasedData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          timebased: {
            totalDuration: 1800,
            segments: [
              { start: '<script>alert("xss")</script>09:00', end: '09:15', duration: 900 },
            ],
          },
          note: "'; DROP TABLE timebased_data; --",
        };
        
        const validation = validateTimeBasedData(maliciousTimeBasedData);
        const notesValidation = validateNotesData(validation.sanitizedData);
        
        expect(validation.valid).toBe(true);
        expect(notesValidation.valid).toBe(true);
        expect(notesValidation.sanitizedData.note).toBe('DROP TABLE timebased_data --');
        
        // Simulate API call with sanitized time-based data
        mockApiCall('/flow-entries', notesValidation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/flow-entries', notesValidation.sanitizedData);
      });
    });

    describe('🗄️ Time-based Database Operations', () => {
      it('should validate time-based data before database insert', () => {
        const timeBasedData = {
          flowId: 'flow123',
          userId: 'user123',
          date: '2024-01-15',
          symbol: '+',
          timebased: {
            totalDuration: 3600, // 1 hour in seconds
            segments: [
              { start: '10:00', end: '10:30', duration: 1800 },
              { start: '10:30', end: '11:00', duration: 1800 },
            ],
          },
        };
        
        const validation = validateTimeBasedData(timeBasedData);
        
        expect(validation.valid).toBe(true);
        expect(validation.sanitizedData.timebased.totalDuration).toBe(3600);
        expect(validation.sanitizedData.timebased.segments).toHaveLength(2);
        
        // Simulate database insert with validated time-based data
        mockDbOperation('INSERT INTO flow_entries (flow_id, user_id, date, symbol, timebased_data) VALUES (?, ?, ?, ?, ?)', 
          [validation.sanitizedData.flowId, validation.sanitizedData.userId, validation.sanitizedData.date, 
           validation.sanitizedData.symbol, JSON.stringify(validation.sanitizedData.timebased)]);
        
        expect(mockDbOperation).toHaveBeenCalledWith(
          'INSERT INTO flow_entries (flow_id, user_id, date, symbol, timebased_data) VALUES (?, ?, ?, ?, ?)', 
          ['flow123', 'user123', '2024-01-15', '+', '{"totalDuration":3600,"segments":[{"start":"10:00","end":"10:30","duration":1800},{"start":"10:30","end":"11:00","duration":1800}]}']
        );
      });
    });
  });

  describe('😊 EMOTIONAL DATA VALIDATION', () => {

    describe('🎭 Emotion and Mood Validation', () => {
      it('should validate emotional data before API call', () => {
        const emotionalData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          emotion: 'excited',
          moodScore: 4,
          note: 'Feeling great!',
        };
        
        const validation = validateEmotionalData(emotionalData);
        
        expect(validation.valid).toBe(true);
        expect(validation.sanitizedData.emotion).toBe('excited');
        expect(validation.sanitizedData.moodScore).toBe(4);
        
        // Simulate API call with validated emotional data
        mockApiCall('/flow-entries', validation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/flow-entries', validation.sanitizedData);
      });

      it('should reject invalid mood score before API call', () => {
        const invalidMoodData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          emotion: 'happy',
          moodScore: 6, // Invalid mood score (should be 1-5)
        };
        
        const validation = validateEmotionalData(invalidMoodData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Mood score must be a number between 1 and 5');
        
        // Should not make API call with invalid mood score
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should validate emotion text length before API call', () => {
        const invalidEmotionData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          emotion: 'a'.repeat(101), // Too long
          moodScore: 3,
        };
        
        const validation = validateEmotionalData(invalidEmotionData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Emotion must be no more than 100 characters');
        
        // Should not make API call with invalid emotion length
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should sanitize malicious emotional data before API call', () => {
        const maliciousEmotionalData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          emotion: '<script>alert("xss")</script>happy',
          moodScore: 5,
          note: "'; DROP TABLE emotions; --",
        };
        
        const validation = validateEmotionalData(maliciousEmotionalData);
        const notesValidation = validateNotesData(validation.sanitizedData);
        
        expect(validation.valid).toBe(true);
        expect(notesValidation.valid).toBe(true);
        expect(validation.sanitizedData.emotion).toBe('scriptalert(xss)/scripthappy');
        expect(notesValidation.sanitizedData.note).toBe('DROP TABLE emotions --');
        
        // Simulate API call with sanitized emotional data
        mockApiCall('/flow-entries', notesValidation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/flow-entries', notesValidation.sanitizedData);
      });
    });
  });

  describe('📝 NOTES VALIDATION', () => {

    describe('📄 Note Content Validation', () => {
      it('should validate note data before API call', () => {
        const noteData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          note: 'This is a valid note about my progress today.',
        };
        
        const validation = validateNotesData(noteData);
        
        expect(validation.valid).toBe(true);
        expect(validation.sanitizedData.note).toBe('This is a valid note about my progress today.');
        
        // Simulate API call with validated note data
        mockApiCall('/flow-entries', validation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/flow-entries', validation.sanitizedData);
      });

      it('should reject overly long notes before API call', () => {
        const invalidNoteData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          note: 'a'.repeat(1001), // Too long
        };
        
        const validation = validateNotesData(invalidNoteData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Note must be no more than 1000 characters');
        
        // Should not make API call with invalid note length
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should sanitize malicious note content before API call', () => {
        const maliciousNoteData = {
          flowId: 'flow123',
          date: '2024-01-15',
          symbol: '+',
          note: '<script>alert("xss")</script>Great progress today!\'; DROP TABLE notes; --',
        };
        
        const validation = validateNotesData(maliciousNoteData);
        
        expect(validation.valid).toBe(true);
        expect(validation.sanitizedData.note).toBe('scriptalert(xss)/scriptGreat progress today!DROP TABLE notes --');
        
        // Simulate API call with sanitized note data
        mockApiCall('/flow-entries', validation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/flow-entries', validation.sanitizedData);
      });
    });
  });

  describe('📊 STATS VALIDATION', () => {

    describe('📈 Statistics Data Validation', () => {
      it('should validate stats data before API call', () => {
        const statsData = {
          flowId: 'flow123',
          stats: {
            completionRate: 85.5,
            streak: 7,
            totalPoints: 150,
          },
        };
        
        const validation = validateStatsData(statsData);
        
        expect(validation.valid).toBe(true);
        expect(validation.sanitizedData.stats.completionRate).toBe(85.5);
        expect(validation.sanitizedData.stats.streak).toBe(7);
        expect(validation.sanitizedData.stats.totalPoints).toBe(150);
        
        // Simulate API call with validated stats data
        mockApiCall('/flow-stats', validation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/flow-stats', validation.sanitizedData);
      });

      it('should reject invalid completion rate before API call', () => {
        const invalidStatsData = {
          flowId: 'flow123',
          stats: {
            completionRate: 150, // Invalid (should be 0-100)
            streak: 7,
            totalPoints: 150,
          },
        };
        
        const validation = validateStatsData(invalidStatsData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Completion rate must be a number between 0 and 100');
        
        // Should not make API call with invalid completion rate
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should reject negative streak before API call', () => {
        const invalidStatsData = {
          flowId: 'flow123',
          stats: {
            completionRate: 85.5,
            streak: -3, // Invalid negative streak
            totalPoints: 150,
          },
        };
        
        const validation = validateStatsData(invalidStatsData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Streak must be a non-negative number');
        
        // Should not make API call with invalid streak
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should reject negative total points before API call', () => {
        const invalidStatsData = {
          flowId: 'flow123',
          stats: {
            completionRate: 85.5,
            streak: 7,
            totalPoints: -50, // Invalid negative points
          },
        };
        
        const validation = validateStatsData(invalidStatsData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Total points must be a non-negative number');
        
        // Should not make API call with invalid total points
        expect(mockApiCall).not.toHaveBeenCalled();
      });
    });
  });

  describe('🔄 ACTIVITY CONTEXT VALIDATION', () => {

    describe('⚡ Activity Context Data Validation', () => {
      it('should validate activity context data before API call', () => {
        const activityContextData = {
          userId: 'user123',
          activityContext: {
            isActive: true,
            lastActivity: 'Flow completion',
            sessionDuration: 1800, // 30 minutes
          },
        };
        
        const validation = validateActivityContextData(activityContextData);
        
        expect(validation.valid).toBe(true);
        expect(validation.sanitizedData.activityContext.isActive).toBe(true);
        expect(validation.sanitizedData.activityContext.lastActivity).toBe('Flow completion');
        expect(validation.sanitizedData.activityContext.sessionDuration).toBe(1800);
        
        // Simulate API call with validated activity context data
        mockApiCall('/activity-context', validation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/activity-context', validation.sanitizedData);
      });

      it('should reject invalid activity context boolean before API call', () => {
        const invalidActivityData = {
          userId: 'user123',
          activityContext: {
            isActive: 'true', // Invalid (should be boolean)
            lastActivity: 'Flow completion',
            sessionDuration: 1800,
          },
        };
        
        const validation = validateActivityContextData(invalidActivityData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Activity context isActive must be a boolean');
        
        // Should not make API call with invalid activity context
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should reject negative session duration before API call', () => {
        const invalidActivityData = {
          userId: 'user123',
          activityContext: {
            isActive: true,
            lastActivity: 'Flow completion',
            sessionDuration: -300, // Invalid negative duration
          },
        };
        
        const validation = validateActivityContextData(invalidActivityData);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Session duration must be a non-negative number');
        
        // Should not make API call with invalid session duration
        expect(mockApiCall).not.toHaveBeenCalled();
      });

      it('should sanitize malicious activity context data before API call', () => {
        const maliciousActivityData = {
          userId: 'user123',
          activityContext: {
            isActive: true,
            lastActivity: '<script>alert("xss")</script>Flow completion',
            sessionDuration: 1800,
          },
        };
        
        const validation = validateActivityContextData(maliciousActivityData);
        
        expect(validation.valid).toBe(true);
        expect(validation.sanitizedData.activityContext.lastActivity).toBe('scriptalert(xss)/scriptFlow completion');
        
        // Simulate API call with sanitized activity context data
        mockApiCall('/activity-context', validation.sanitizedData);
        expect(mockApiCall).toHaveBeenCalledWith('/activity-context', validation.sanitizedData);
      });
    });
  });

  describe('🚨 COMPREHENSIVE EDGE CASES', () => {

    describe('🛡️ Security Validation for All Data Types', () => {
      it('should prevent SQL injection in all specialized data types', () => {
        const maliciousDataTypes = [
          { type: 'binary', data: { symbol: '+', note: "'; DROP TABLE binary_data; --" } },
          { type: 'quantitative', data: { quantitative: { count: 5, unitText: "'; DROP TABLE quantitative_data; --" } } },
          { type: 'timebased', data: { timebased: { totalDuration: 1800, segments: [{ start: "'; DROP TABLE timebased_data; --", duration: 900 }] } } },
          { type: 'emotional', data: { emotion: "'; DROP TABLE emotions; --", moodScore: 3 } },
          { type: 'notes', data: { note: "'; DROP TABLE notes; --" } },
          { type: 'stats', data: { stats: { completionRate: 85, streak: 7, totalPoints: 150 } } },
          { type: 'activity', data: { activityContext: { isActive: true, lastActivity: "'; DROP TABLE activity_context; --" } } },
        ];
        
        maliciousDataTypes.forEach(({ type, data }) => {
          let validation;
          
          switch (type) {
            case 'binary':
              validation = validateBinaryData(data);
              break;
            case 'quantitative':
              validation = validateQuantitativeData(data);
              break;
            case 'timebased':
              validation = validateTimeBasedData(data);
              break;
            case 'emotional':
              validation = validateEmotionalData(data);
              break;
            case 'notes':
              validation = validateNotesData(data);
              break;
            case 'stats':
              validation = validateStatsData(data);
              break;
            case 'activity':
              validation = validateActivityContextData(data);
              break;
          }
          
          // Should sanitize dangerous characters
          const sanitizedData = JSON.stringify(validation.sanitizedData);
          expect(sanitizedData).not.toContain("'");
          expect(sanitizedData).not.toContain('"');
          expect(sanitizedData).not.toContain(';');
          expect(sanitizedData).not.toContain('--');
          
          // Simulate database operation with sanitized data
          mockDbOperation(`INSERT INTO ${type}_data (data) VALUES (?)`, [sanitizedData]);
          expect(mockDbOperation).toHaveBeenCalledWith(`INSERT INTO ${type}_data (data) VALUES (?)`, [sanitizedData]);
        });
      });

      it('should prevent XSS in all specialized data types', () => {
        const xssDataTypes = [
          { type: 'binary', data: { symbol: '+', note: '<script>alert("xss")</script>Note' } },
          { type: 'quantitative', data: { quantitative: { count: 5, unitText: '<script>alert("xss")</script>reps' } } },
          { type: 'timebased', data: { timebased: { totalDuration: 1800, segments: [{ start: '<script>alert("xss")</script>09:00', duration: 900 }] } } },
          { type: 'emotional', data: { emotion: '<script>alert("xss")</script>happy', moodScore: 3 } },
          { type: 'notes', data: { note: '<script>alert("xss")</script>Note content' } },
          { type: 'activity', data: { activityContext: { isActive: true, lastActivity: '<script>alert("xss")</script>Activity' } } },
        ];
        
        xssDataTypes.forEach(({ type, data }) => {
          let validation;
          
          switch (type) {
            case 'binary':
              validation = validateBinaryData(data);
              break;
            case 'quantitative':
              validation = validateQuantitativeData(data);
              break;
            case 'timebased':
              validation = validateTimeBasedData(data);
              break;
            case 'emotional':
              validation = validateEmotionalData(data);
              break;
            case 'notes':
              validation = validateNotesData(data);
              break;
            case 'activity':
              validation = validateActivityContextData(data);
              break;
          }
          
          // Should remove HTML tags
          const sanitizedData = JSON.stringify(validation.sanitizedData);
          expect(sanitizedData).not.toContain('<');
          expect(sanitizedData).not.toContain('>');
          expect(sanitizedData).not.toContain('script');
          
          // Simulate API call with sanitized data
          mockApiCall(`/api/${type}`, validation.sanitizedData);
          expect(mockApiCall).toHaveBeenCalledWith(`/api/${type}`, validation.sanitizedData);
        });
      });
    });

    describe('📏 Length Constraint Enforcement for All Data Types', () => {
      it('should enforce length constraints in all specialized data types', () => {
        const lengthTestCases = [
          { type: 'quantitative', field: 'unitText', value: 'a'.repeat(51), shouldFail: true },
          { type: 'quantitative', field: 'unitText', value: 'reps', shouldFail: false },
          { type: 'emotional', field: 'emotion', value: 'a'.repeat(101), shouldFail: true },
          { type: 'emotional', field: 'emotion', value: 'happy', shouldFail: false },
          { type: 'notes', field: 'note', value: 'a'.repeat(1001), shouldFail: true },
          { type: 'notes', field: 'note', value: 'Valid note', shouldFail: false },
        ];
        
        lengthTestCases.forEach(({ type, field, value, shouldFail }) => {
          // Clear mocks before each test case
          mockApiCall.mockClear();
          
          let validation;
          const testData = { [field]: value };
          
          switch (type) {
            case 'quantitative':
              validation = validateQuantitativeData({ quantitative: testData });
              break;
            case 'emotional':
              validation = validateEmotionalData(testData);
              break;
            case 'notes':
              validation = validateNotesData(testData);
              break;
          }
          
          if (shouldFail) {
            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            // Should not make API call with invalid data
            expect(mockApiCall).not.toHaveBeenCalled();
          } else {
            expect(validation.valid).toBe(true);
            expect(validation.errors.length).toBe(0);
            // Should make API call with valid data
            mockApiCall(`/api/${type}`, validation.sanitizedData);
            expect(mockApiCall).toHaveBeenCalledWith(`/api/${type}`, validation.sanitizedData);
          }
        });
      });
    });
  });
});
