// services/apiBackoffManager.ts
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
  
    /**
     * Check if the API is currently available
     */
    isAvailable(): boolean {
      const currentTime = Date.now();
      
      // If we're past the retry time, give the API another chance
      if (!this.isApiAvailable && currentTime >= this.retryAfter) {
        this.isApiAvailable = true;
        console.log(`Attempting to use ${this.apiName} again after backoff period`);
      }
      
      return this.isApiAvailable;
    }
  
    /**
     * Trigger a backoff period after an API limit is reached
     */
    triggerBackoff(): void {
      this.isApiAvailable = false;
      this.retryAfter = Date.now() + this.currentBackoff;
      // Implement exponential backoff with a maximum cap
      this.currentBackoff = Math.min(this.currentBackoff * 2, this.maxBackoff);
    }
  
    /**
     * Reset the backoff duration to initial value after successful calls
     */
    resetBackoff(): void {
      this.currentBackoff = this.currentBackoff / 2;
    }
  
    /**
     * Get current backoff duration in milliseconds
     */
    getCurrentBackoff(): number {
      return this.currentBackoff;
    }
  }