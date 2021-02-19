class UnknownError extends Error {
  constructor() {
    super('UnknownError - Something went wrong when processing the request');
    Object.freeze(this);
  }
}

export default UnknownError;
