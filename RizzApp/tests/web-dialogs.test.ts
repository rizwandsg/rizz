// @vitest-environment happy-dom
import { Alert } from 'react-native';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('react-native',()=>({Alert:{alert:vi.fn()}}));
import { clearWebDialogs, installWebDialogs } from '../services/webDialogs';
installWebDialogs();
afterEach(clearWebDialogs);
const dialog=()=>document.querySelector('dialog')!;
function click(label:string){const button=[...dialog().querySelectorAll('button')].find(button=>button.textContent===label)!;button.click();}
it('requires explicit destructive confirmation and preserves focus on cancellation',()=>{
  const previous=document.createElement('button');document.body.append(previous);previous.focus();
  const remove=vi.fn();Alert.alert('Delete project','Retain records until confirmed',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:remove}]);
  expect(dialog().getAttribute('role')).toBe('alertdialog');expect(remove).not.toHaveBeenCalled();
  click('Cancel');expect(remove).not.toHaveBeenCalled();expect(document.activeElement).toBe(previous);
  Alert.alert('Delete project','Confirm',[{text:'Cancel',style:'cancel'},{text:'Delete',onPress:remove}]);
  click('Delete');expect(remove).toHaveBeenCalledTimes(1);expect(document.querySelector('dialog')).toBeNull();previous.remove();
});
it('runs success navigation only after acknowledgement',()=>{
  const navigate=vi.fn();Alert.alert('Saved','Project created',[{text:'OK',onPress:navigate}]);expect(navigate).not.toHaveBeenCalled();
  click('OK');expect(navigate).toHaveBeenCalledOnce();
});
it('queues messages and does not interpret record names as HTML',()=>{
  const content='<img src=x onerror=alert(1)>';Alert.alert('First',content);Alert.alert('Second','Next message');
  expect(dialog().textContent).toContain(content);expect(dialog().querySelector('img')).toBeNull();
  click('OK');expect(dialog().textContent).toContain('Second');click('OK');expect(document.querySelector('dialog')).toBeNull();
});
it('treats Escape as cancellation and never confirms a destructive action',()=>{
  const remove=vi.fn();Alert.alert('Delete','Confirm',[{text:'Cancel',style:'cancel'},{text:'Delete',onPress:remove}]);
  dialog().dispatchEvent(new Event('cancel',{cancelable:true}));expect(remove).not.toHaveBeenCalled();expect(document.querySelector('dialog')).toBeNull();
});
it('clears private messages and pending callbacks when the signed-in account changes',()=>{
  const pending=vi.fn();Alert.alert('Workspace A','Private record',[{text:'Delete',onPress:pending}]);const oldButton=dialog().querySelector('button')!;
  Alert.alert('Queued private message');clearWebDialogs();oldButton.click();expect(pending).not.toHaveBeenCalled();expect(document.querySelector('dialog')).toBeNull();
  Alert.alert('Workspace B');expect(dialog().textContent).not.toContain('Private');
});
