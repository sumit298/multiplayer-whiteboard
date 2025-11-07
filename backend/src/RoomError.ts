export class RoomError extends Error {
  code: number;
  name = 'RoomError';
  constructor(message: string, code: number = 400) { // Default to 400
    super(message);
    this.code = code;
  }
}