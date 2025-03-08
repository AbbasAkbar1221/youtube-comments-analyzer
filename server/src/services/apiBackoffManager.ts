export class ApiBackoffManager {
    private isApiAvailable: boolean = true;
    private retryAfter: number = 0;
    private currentBackoff: number;
    private readonly maxBackoff: number;
    private readonly apiName: string;
  
    constructor(apiName: string, initialBackoff: number, maxBackoff: number) {
      this.apiName = apiName;
      this.currentBackoff = initialBackoff;
      this.maxBackoff = maxBackoff;
    }
  
    isAvailable(): boolean {
      const currentTime = Date.now();
      
      if (!this.isApiAvailable && currentTime >= this.retryAfter) {
        this.isApiAvailable = true;
        console.log(`Attempting to use ${this.apiName} again after backoff period`);
      }
      
      return this.isApiAvailable;
    }
  
    triggerBackoff(): void {
      this.isApiAvailable = false;
      this.retryAfter = Date.now() + this.currentBackoff;
      this.currentBackoff = Math.min(this.currentBackoff * 2, this.maxBackoff);
    }
  
    resetBackoff(): void {
      this.currentBackoff = this.currentBackoff / 2;
    }

    getCurrentBackoff(): number {
      return this.currentBackoff;
    }
  }