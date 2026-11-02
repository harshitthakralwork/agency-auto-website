import { initGSAP } from "../gsap/provider";

export class CinematicEngine {
  private static initialized: boolean = false;

  static initialize() {
    if (this.initialized) return;
    initGSAP();
    this.initialized = true;
  }
}
