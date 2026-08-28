// Worker script for tick pulses
let timerId: number | null = null;

self.onmessage = (e: MessageEvent) => {
  if (e.data === 'start') {
    if (timerId !== null) clearInterval(timerId);
    timerId = self.setInterval(() => {
      self.postMessage('tick');
    }, 1000);
  } else if (e.data === 'stop') {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }
};
