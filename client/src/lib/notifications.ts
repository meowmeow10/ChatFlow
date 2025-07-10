
class NotificationSound {
  private audio: HTMLAudioElement | null = null;

  constructor(soundFile: string) {
    try {
      this.audio = new Audio(soundFile);
      this.audio.volume = 0.5;
    } catch (error) {
      console.warn('Could not load notification sound:', error);
    }
  }

  play() {
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    }
  }
}

export const dmSound = new NotificationSound('/beep.mp3');
export const friendRequestSound = new NotificationSound('/beep.mp3');
