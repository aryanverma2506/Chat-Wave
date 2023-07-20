class HttpError extends Error {
  constructor(message: string, public code: number) {
    super(message);
  }
}

export default HttpError;
