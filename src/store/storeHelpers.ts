import { supabase } from '../lib/supabase';
import { User } from '../types/store';

export const loadUserFromStorage = async (): Promise<User | null> => {
  try {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return null;

    const user = JSON.parse(storedUser);
    
    const { data, error } = await supabase
      .from('users')
      .select('username, avatar')
      .eq('username', user.username)
      .single();

    if (error || !data) {
      localStorage.removeItem('currentUser');
      return null;
    }

    // Check if there's a stored avatar
    const storedAvatar = localStorage.getItem(`avatar_${user.username}`);
    const avatar = storedAvatar || data.avatar || `letter:${data.username[0].toUpperCase()}:bg-blue-500`;

    const { data: isValid, error: checkError } = await supabase.rpc('check_password', {
      p_username: user.username,
      p_password: localStorage.getItem(`password_${user.username}`) || ''
    });

    if (checkError || !isValid) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem(`password_${user.username}`);
      return null;
    }

    return {
      username: data.username,
      avatar
    };
  } catch {
    localStorage.removeItem('currentUser');
    return null;
  }
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
  onError?: (error: any) => void
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (onError) onError(error);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};