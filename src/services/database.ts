import firestore from '@react-native-firebase/firestore';
import {Task, UserProfile, FocusSession, RepeatType} from '../types';

const USERS_COLLECTION = 'users';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Given a base task and a target date string (YYYY-MM-DD), returns a
 * virtual copy of the task with startTime/endTime shifted to that date.
 */
const shiftTaskToDate = (task: Task, dateStr: string): Task => {
  const base = task.startTime.toDate();
  const end = task.endTime.toDate();
  const [year, month, day] = dateStr.split('-').map(Number);

  const newStart = new Date(base);
  newStart.setFullYear(year, month - 1, day);

  const newEnd = new Date(end);
  newEnd.setFullYear(year, month - 1, day);

  return {
    ...task,
    startTime: firestore.Timestamp.fromDate(newStart),
    endTime: firestore.Timestamp.fromDate(newEnd),
  };
};

/**
 * Expands recurring tasks into virtual instances for a given date.
 * Returns true if the task should appear on that date.
 */
export const taskOccursOnDate = (task: Task, dateStr: string): boolean => {
  const taskBaseDate = task.startTime.toDate().toISOString().split('T')[0];

  if (task.repeatType === 'none' || !task.repeatType) {
    return taskBaseDate === dateStr;
  }

  // Don't show before the task's start date
  if (dateStr < taskBaseDate) return false;

  if (task.repeatType === 'daily') return true;

  if (task.repeatType === 'weekly') {
    const dayName = DAY_NAMES[new Date(dateStr + 'T12:00:00').getDay()];
    return task.repeat.includes(dayName);
  }

  // 'custom' — only the exact date
  return taskBaseDate === dateStr;
};

/**
 * Returns all task instances (real + virtual recurring) for a specific date.
 */
export const getTasksForDate = (allTasks: Task[], dateStr: string): Task[] => {
  const result: Task[] = [];
  for (const task of allTasks) {
    if (taskOccursOnDate(task, dateStr)) {
      const taskBaseDate = task.startTime.toDate().toISOString().split('T')[0];
      if (taskBaseDate === dateStr) {
        result.push(task); // original
      } else {
        result.push(shiftTaskToDate(task, dateStr)); // virtual copy
      }
    }
  }
  return result.sort(
    (a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime(),
  );
};

export const DatabaseService = {
  serverTimestamp: () => firestore.FieldValue.serverTimestamp(),

  // --- User Profile ---
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const doc = await firestore().collection(USERS_COLLECTION).doc(userId).get();
    return doc.exists() ? (doc.data() as UserProfile) : null;
  },

  updateUserProfile: async (userId: string, data: Partial<UserProfile>) => {
    await firestore().collection(USERS_COLLECTION).doc(userId).update(data);
  },

  updateXP: async (userId: string, xpToAdd: number) => {
    const userRef = firestore().collection(USERS_COLLECTION).doc(userId);
    await firestore().runTransaction(async transaction => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) return;
      const data = userDoc.data() as UserProfile;
      let newXP = data.xp + xpToAdd;
      let newLevel = data.level;
      if (newXP >= 1000) {
        newLevel += Math.floor(newXP / 1000);
        newXP = newXP % 1000;
      }
      transaction.update(userRef, {xp: newXP, level: newLevel});
    });
  },

  // --- Tasks ---
  getTasks: async (userId: string): Promise<Task[]> => {
    const snapshot = await firestore()
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection('tasks')
      .orderBy('startTime', 'asc')
      .get();
    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})) as Task[];
  },

  createTask: async (userId: string, task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    return await firestore()
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection('tasks')
      .add({
        ...task,
        userId,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
  },

  updateTaskStatus: async (userId: string, taskId: string, status: Task['status']) => {
    await firestore()
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection('tasks')
      .doc(taskId)
      .update({status});
  },

  deleteTask: async (userId: string, taskId: string) => {
    await firestore()
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection('tasks')
      .doc(taskId)
      .delete();
  },

  // --- Focus Sessions ---
  addFocusSession: async (userId: string, session: Omit<FocusSession, 'id'>) => {
    await firestore()
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection('sessions')
      .add(session);
    await DatabaseService.updateXP(userId, session.xpAwarded);
  },
};
