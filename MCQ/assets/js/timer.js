const Timer = {
  intervalId: null,
  remaining: 0,
  start(seconds, onTick, onExpire) {
    this.stop();
    this.remaining = seconds;
    const tick = () => {
      if (this.remaining <= 0) {
        this.stop();
        onExpire();
        return;
      }
      this.remaining -= 1;
      onTick(this.remaining);
    };
    onTick(this.remaining);
    this.intervalId = window.setInterval(tick, 1000);
  },
  stop() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
};
