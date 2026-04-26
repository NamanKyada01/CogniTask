import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  shieldActive: boolean;
  habitDNA: {[key: string]: boolean};
  createdAt: FirebaseFirestoreTypes.FieldValue;
}

export type TaskStatus = 'scheduled' | 'in-progress' | 'completed' | 'missed';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'custom';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  category: string;
  startTime: FirebaseFirestoreTypes.Timestamp;
  endTime: FirebaseFirestoreTypes.Timestamp;
  duration: number;           // minutes
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  xpAwarded: number;
  reminderMinutes: number;
  repeatType: RepeatType;
  repeat: string[];           // ['Mon','Tue',...] used when repeatType='weekly'
  color: string;
  userId: string;
  createdAt: FirebaseFirestoreTypes.FieldValue;
}

export interface FocusSession {
  id?: string;
  userId: string;
  taskId?: string;
  startTime: FirebaseFirestoreTypes.Timestamp;
  endTime: FirebaseFirestoreTypes.Timestamp;
  duration: number;
  xpAwarded: number;
  soundscape?: string;
}

export interface Reward {
  id?: string;
  title: string;
  icon: string;
  unlockedAt: FirebaseFirestoreTypes.Timestamp;
  xpCost?: number;
}
