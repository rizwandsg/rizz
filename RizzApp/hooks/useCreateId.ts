import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
// Retained across retries so a lost response cannot create a second financial record.
export function useCreateId() { return useState(() => randomUUID())[0]; }
