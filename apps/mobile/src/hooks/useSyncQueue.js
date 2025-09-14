// hooks/useSyncQueue.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const useSyncQueue = () => {
  const [queue, setQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => setIsOnline(state.isConnected));
    loadQueue();
    return unsubscribe;
  }, []);

  const loadQueue = async () => {
    const storedQueue = await AsyncStorage.getItem('syncQueue');
    if (storedQueue) setQueue(JSON.parse(storedQueue));
  };

  const saveQueue = async (newQueue) => {
    await AsyncStorage.setItem('syncQueue', JSON.stringify(newQueue));
  };

  const addToQueue = (operation) => {
    const newQueue = [...queue, operation];
    setQueue(newQueue);
    saveQueue(newQueue);
    if (isOnline) sync();
  };

  const sync = async () => {
    if (isSyncing || !isOnline || queue.length === 0) return;
    setIsSyncing(true);
    // Process queue, call APIs, remove successful
    const remaining = []; // Assume processing
    setQueue(remaining);
    saveQueue(remaining);
    setIsSyncing(false);
  };

  useEffect(() => {
    if (isOnline) sync();
  }, [isOnline]);

  return {
    addToQueue,
    queue,
    isOnline,
    isSyncing,
    // Add more
  };
};

export default useSyncQueue;