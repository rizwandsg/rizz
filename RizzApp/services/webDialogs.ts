import { Alert, type AlertButton, type AlertOptions } from 'react-native';

// React Native Web's Alert.alert is a no-op. Supply real browser dialogs so
// confirmations, success navigation and retry messages work on the website.
type DialogRequest = { title: string; message?: string; buttons: AlertButton[]; options?: AlertOptions };
const queue: DialogRequest[] = [];
let current: HTMLDialogElement | null = null;
let installed = false;
let nextId = 0;
export function clearWebDialogs() {
  queue.length = 0;
  current?.remove();
  current = null;
}
function showNext() {
  if (current || !queue.length) return;
  const request = queue.shift()!;
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog');
  current = dialog;
  const heading = document.createElement('h2');
  heading.id = 'rizz-dialog-' + ++nextId;
  heading.textContent = request.title;
  Object.assign(heading.style, { margin: '0 0 12px', fontSize: '21px' });
  dialog.setAttribute('aria-labelledby', heading.id);
  dialog.setAttribute('role', 'alertdialog');
  Object.assign(dialog.style, { width: 'min(420px, calc(100vw - 40px))', boxSizing: 'border-box', maxHeight: '80vh', overflow: 'auto', border: '0', borderRadius: '14px', padding: '24px', color: '#222', boxShadow: '0 12px 60px #0005', fontFamily: 'system-ui, sans-serif' });
  dialog.append(heading);
  if (request.message) {
    const message = document.createElement('p');
    message.id = heading.id + '-message';
    dialog.setAttribute('aria-describedby', message.id);
    message.textContent = request.message;
    Object.assign(message.style, { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: '1.5', margin: '0 0 24px' });
    dialog.append(message);
  }
  let completed = false;
  function finish(button?: AlertButton, dismissed = false) {
    if (completed || current !== dialog) return;
    completed = true;
    dialog.close(); dialog.remove(); current = null;
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    try {
      if (dismissed) request.options?.onDismiss?.();
      else void Promise.resolve(button?.onPress?.()).catch(() => Alert.alert('Unable to complete action', 'Please try again.'));
    } catch { Alert.alert('Unable to complete action', 'Please try again.'); }
    showNext();
  }
  const actions = document.createElement('div');
  Object.assign(actions.style, { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end' });
  for (const button of request.buttons) {
    const element = document.createElement('button');
    element.type = 'button'; element.textContent = button.text || 'OK';
    Object.assign(element.style, { minHeight: '44px', padding: '10px 18px', borderRadius: '8px', border: '1px solid #d8dbe4', cursor: 'pointer', fontSize: '16px', background: button.style === 'cancel' ? '#f1f3f7' : button.style === 'destructive' ? '#b42318' : '#4658ab', color: button.style === 'cancel' ? '#222' : '#fff' });
    element.onclick = () => finish(button);
    actions.append(element);
  }
  dialog.append(actions);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    const cancel = request.buttons.find(button => button.style === 'cancel');
    if (cancel) finish(cancel);
    else if (request.options?.cancelable) finish(undefined, true);
  });
  document.body.append(dialog);
  dialog.showModal();
}
export function installWebDialogs() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  Alert.alert = (title, message, buttons, options) => {
    queue.push({ title: title || 'Notice', message: message ?? undefined, buttons: buttons?.length ? buttons : [{ text: 'OK' }], options });
    showNext();
  };
}
