export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (type === 'light') {
      navigator.vibrate(10);
    } else if (type === 'medium') {
      navigator.vibrate(30);
    } else {
      navigator.vibrate(50);
    }
  }
}
