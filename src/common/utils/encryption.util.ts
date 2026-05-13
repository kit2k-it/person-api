import * as bcrypt from 'bcrypt';

export class EncryptionUtil {
  private static readonly SALT_ROUNDS = 12;

  static async hash(text: string): Promise<string> {
    return bcrypt.hash(text, this.SALT_ROUNDS);
  }

  static async compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }

  static generateToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }
}