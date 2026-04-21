import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {IconButton} from 'react-native-paper';
import {COLORS} from '../theme/tokens';

// Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import TaskManagerScreen from '../screens/main/TaskManagerScreen';
import FocusFlowScreen from '../screens/main/FocusFlowScreen';
import CalendarScreen from '../screens/main/CalendarScreen';
import RewardsScreen from '../screens/main/RewardsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.onSurfaceVariant,
        tabBarIcon: ({focused, color, size}) => {
          let iconName = '';
          if (route.name === 'Dashboard') iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          else if (route.name === 'Tasks') iconName = focused ? 'clipboard-text' : 'clipboard-text-outline';
          else if (route.name === 'Focus') iconName = focused ? 'timer' : 'timer-outline';
          else if (route.name === 'Calendar') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Rewards') iconName = focused ? 'trophy' : 'trophy-outline';

          return <IconButton icon={iconName} iconColor={color} size={size} />;
        },
      })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tasks" component={TaskManagerScreen} />
      <Tab.Screen name="Focus" component={FocusFlowScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
