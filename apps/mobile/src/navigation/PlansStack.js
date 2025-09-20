// src/navigation/PlansStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlansDashboard from '../screens/plans/PlansDashboard';
import ModernPlansDashboard from '../screens/plans/ModernPlansDashboard';
import AddPlanFlow from '../screens/plans/AddPlanFlow';
import AddPublicPlan from '../screens/plans/AddPublicPlan';
import CreateGroupWizard from '../screens/plans/CreateGroupWizard';
import TrainerDashboard from '../screens/plans/TrainerDashboard';
import InviteMembers from '../screens/plans/InviteMembers';
import PlanDetail from '../screens/plans/PlanDetail';
import UnifiedPlanDetail from '../screens/plans/UnifiedPlanDetail';
import PlanInstanceDetail from '../screens/plans/PlanInstanceDetail';
import PlansLanding from '../screens/plans/PlansLanding';
import ExportPlan from '../screens/plans/ExportPlan';

const Stack = createNativeStackNavigator();

const PlansStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="PlansDashboard" 
        component={ModernPlansDashboard}
        options={{
          title: 'Plans',
        }}
      />
      {/* CreatePlanWizard removed - now using direct navigation to AddFlow */}
      <Stack.Screen 
        name="CreateGroupWizard" 
        component={CreateGroupWizard}
        options={{
          title: 'Create Group',
        }}
      />
      <Stack.Screen 
        name="TrainerDashboard" 
        component={TrainerDashboard}
        options={{
          title: 'Trainer Dashboard',
        }}
      />
      <Stack.Screen 
        name="InviteMembers" 
        component={InviteMembers}
        options={{
          title: 'Invite Members',
        }}
      />
      <Stack.Screen 
        name="AddPlanFlow" 
        component={AddPlanFlow}
        options={{
          title: 'Create Plan',
        }}
      />
      <Stack.Screen 
        name="AddPublicPlan" 
        component={AddPublicPlan}
        options={{
          title: 'Create Public Plan',
        }}
      />
      <Stack.Screen 
        name="PlanDetail" 
        component={PlanDetail}
        options={{
          title: 'Plan Details',
        }}
      />
      <Stack.Screen 
        name="UnifiedPlanDetail" 
        component={UnifiedPlanDetail}
        options={{
          title: 'Plan Details',
        }}
      />
      <Stack.Screen 
        name="PlanInstanceDetail" 
        component={PlanInstanceDetail}
        options={{
          title: 'Plan Instance',
        }}
      />
      <Stack.Screen 
        name="PlansLanding" 
        component={PlansLanding}
        options={{
          title: 'Plans',
        }}
      />
      <Stack.Screen 
        name="ExportPlan" 
        component={ExportPlan}
        options={{
          title: 'Export Plan',
        }}
      />
    </Stack.Navigator>
  );
};

export default PlansStack;