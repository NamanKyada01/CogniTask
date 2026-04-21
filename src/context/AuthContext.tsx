import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(userState => {
      setUser(userState);
      setLoading(false);
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  const logout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{user, loading, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
