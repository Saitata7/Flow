// components/index.js
// Central export for all shared components
// Usage: import { Button, Card, Icon, Toast } from '../components';

// Common components
export { default as Button } from './common/Button';
export { default as Card } from './common/card';
export { default as Icon } from './common/Icon';
export { default as Toast } from './common/Toast';
export { default as Badge } from './common/Badge';
export { default as WelcomePopup } from './common/WelcomePopup';

// Flow-related components
export { default as ViewFlow } from './flow/ViewFlow';
export { default as FlowCard } from './flow/FlowCard';
export { default as FlowCalendar } from './flow/FlowCalendar';
export { default as TodaysFlows } from './flow/todayResponse/TodaysFlows';

// Flow Stats components
export { default as FlowStatsDetail } from './FlowStats/FlowStatsDetail';
export { default as FlowStatsSummary } from './FlowStats/FlowStatsSummary';
export { default as FlowStatsTrends } from './FlowStats/FlowStatsTrends';

// Settings components
export { default as ImportExport } from './Settings/ImportExport';
export { default as NotificationComponent } from './Settings/Notification';
export { default as ColorPicker } from './Settings/ColorPicker';

// Profile components
export { default as AvatarUploader } from './profile/AvatarUploader';
export { default as SocialLinks } from './profile/SocialLinks';
export { default as StatsSummary } from './profile/StatsSummary';
