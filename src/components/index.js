// components/index.js
// Central export for all shared components
// Usage: import { Button, Card, Icon, Toast } from '../components';

export { default as Button } from './common/Button';
export { default as Card } from './common/card';
export { default as Icon } from './common/Icon';
export { default as Toast } from './common/Toast';

// Re-export other commonly used components
export { default as ViewFlow } from './ViewFlow';
export { default as FlowCard } from './flow/FlowCard';
export { default as FlowCalendar } from './flow/FlowCalendar';
export { default as TodaysFlows } from './flow/todayResponse/TodaysFlows';

// Export component types for TypeScript if needed
export const ComponentTypes = {
  Button: 'Button',
  Card: 'Card',
  Icon: 'Icon',
  Toast: 'Toast',
  ViewFlow: 'ViewFlow',
  FlowCard: 'FlowCard',
  FlowCalendar: 'FlowCalendar',
  TodaysFlows: 'TodaysFlows',
};
