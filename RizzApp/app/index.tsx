import { useEffect } from 'react';
import { initDB } from '../database/db';

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeApp();
  }, []);


}