export class RoomError extends Error {
  code: number;
  constructor(message: string, code: number = 400) { // Default to 400
    super(message);
    this.code = code;
  }
}