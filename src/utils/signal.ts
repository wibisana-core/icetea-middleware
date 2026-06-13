import { ISignal } from "../types/common.types";


export class Signal implements ISignal {
  private signal: boolean;

  constructor() {
    this.signal = false;
  }

  set(value: boolean) {
    this.signal = value;
  }

  get() {
    return this.signal;
  }
}