import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAppTheme} from '../theme/ThemeContext';

// Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import TaskManagerScreen from '../screens/main/TaskManagerScreen';
import FocusFlowScreen from '../screens/main/FocusFlowScreen';
import CalendarScreen from '../screens/main/CalendarScreen';
import RewardsScreen from '../screens/main/RewardsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, [string, string]> = {
  Dashboard: ['view-dashboard', 'view-dashboard-outline'],
  Tasks:     ['clipboard-text', 'clipboard-text-outline'],
  Focus:     ['timer', 'timer-outline'],
  Calendar:  ['calendar', 'calendar-outline'],
  Rewards:   ['trophy', 'trophy-outline'],
  Profile:   ['account-circle', 'account-circle-outline'],
};

const MainTabNavigator = () => {
  const {colors} = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceLow,
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarIcon: ({focused, color}) => {
          const [active, inactive] = TAB_ICONS[route.name] ?? ['circle', 'circle-outline'];
          return (
            <MaterialCommunityIcons
              name={focused ? active : inactive}
              size={24}
              color={color}
            />
          );
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
