import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ revision:0, handlers:[] as {event:string; callback:(payload:any)=>void}[], getCurrentUser:vi.fn(), notify:vi.fn() }));
vi.mock('../api/authApi', () => ({getCurrentUser:state.getCurrentUser, sessionRevision:()=>state.revision}));
vi.mock('../services/notificationService', () => ({NotificationType:{PROJECT_CREATED:'project', PROJECT_UPDATED:'update', EXPENSE_ADDED:'expense'},sendAppNotification:state.notify}));
vi.mock('../services/supabaseClient', () => ({supabase:{
  channel:()=> {const channel = {on:(_kind:string, filter:any, callback:any)=>{state.handlers.push({event:filter.event,callback});return channel;},subscribe:()=>channel}; return channel;},
  removeChannel:vi.fn().mockResolvedValue(undefined),
}}));
import { subscribeToAll, unsubscribeFromAll } from '../services/websocketService';
beforeEach(async () => { await unsubscribeFromAll(); state.revision++; state.handlers=[]; state.getCurrentUser.mockReset().mockResolvedValue({id:'owner-a'}); state.notify.mockReset().mockResolvedValue(undefined); });
it('subscribes to RLS-authorized row changes without unfiltered DELETE payloads', async () => {
  const created = vi.fn();
  await subscribeToAll({onProjectCreated:created});
  expect(state.handlers.map(row=>row.event)).toEqual(['INSERT','UPDATE','INSERT','UPDATE']);
  state.handlers[0].callback({new:{id:'project-a',name:'Visible project'}});
  expect(created).toHaveBeenCalledOnce();
  state.revision++;
  state.handlers[0].callback({new:{id:'old-project',name:'Prior session'}});
  expect(created).toHaveBeenCalledOnce();
  expect(state.notify).toHaveBeenCalledOnce();
});
it('does not reconnect a pending old session after logout', async () => {
  let finish!: (user:any)=>void;
  state.getCurrentUser.mockReturnValue(new Promise(resolve=>{finish=resolve;}));
  const connecting=subscribeToAll({});
  state.revision++;
  finish({id:'old-owner'});
  await connecting;
  expect(state.handlers).toHaveLength(0);
});
