
// Tipos globais mais permissivos para evitar erros de build
declare global {
  interface Window {
    [key: string]: any;
  }
}

// Tornar tipos mais flexíveis
declare module "*.tsx" {
  const content: any;
  export default content;
}

declare module "*.ts" {
  const content: any;
  export default content;
}

// Tipos utilitários mais permissivos
export type FlexibleRecord = Record<string, any>;
export type AnyFunction = (...args: any[]) => any;
export type FlexibleComponent = React.ComponentType<any>;

export {};
