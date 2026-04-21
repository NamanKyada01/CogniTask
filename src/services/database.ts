import firestore from '@react-native-firebase/firestore';
import {Task, UserProfile, FocusSession} from '../types';

const USERS_COLLECTION = 'users';

export const DatabaseService = {
  serverTimestamp: () => firestore.FieldValue.serverTimestamp(),
  
  // --- User Profile ---
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const doc = await firestore().collection(USERS_COLLECTION).doc(userId).get();
    return doc.exists ? (doc.data() as UserProfile) : null;
  },

  updateXP: async (userId: string, xpToAdd: number) => {
    const userRef = firestore().collection(USERS_COLLECTION).doc(userId);
    await firestore().runTransaction(async transaction => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) return;

      const data = userDoc.data() as UserProfile;
      let newXP = data.xp + xpToAdd;
      let newLevel = data.level;

      // Simple leveling logic: 1000 XP per level
      if (newXP >= 1000) {
        newLevel += Math.floor(newXP / 1000);
        newXP = newXP % 1000;
      }

      transaction.update(userRef, {
        xp: newXP,
        level: newLevel,
      });
    });
  },

  // --- Tasks (Subcollection under User) ---
  getTasks: async (userId: string): Promise<Task[]> => {
    const querySnapshot = await firestore()
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection('tasks')
      .orderBy('startTime', 'asc')
      .get();

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];
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

  // --- Focus Sessions ---
  addFocusSession: async (userId: string, session: Omit<FocusSession, 'id'>) => {
    await firestore()
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection('sessions')
      .add(session);
    
    // Auto-award XP for focus session completion
    await DatabaseService.updateXP(userId, session.xpAwarded);
  },
};
