declare module "@aliceo2/web-ui" {
  export const LogManager: {
    getLogger: (name: string) => {
      infoMessage: (...args: any[]) => void;
      errorMessage: (...args: any[]) => void;
      warnMessage: (...args: any[]) => void;
      debugMessage: (...args: any[]) => void;
    };
  };
}
