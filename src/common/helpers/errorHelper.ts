export const errorHelper = {
  create(error?: any) {
    if (error instanceof Error) return error;
    if (error) return new Error(String(error) || '');
    return new Error();
  }
};
