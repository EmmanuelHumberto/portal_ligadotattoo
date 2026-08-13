export interface SecretResolver {
  get(name:string):Promise<string>;
}
export const SECRET_RESOLVER=Symbol('SECRET_RESOLVER');

export class EnvironmentSecretResolver implements SecretResolver {
  async get(name:string) {
    const value=process.env[name];
    if (!value) throw new Error(`Required secret is not configured: ${name}`);
    return value;
  }
}
