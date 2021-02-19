class ResponseError extends Error {
  constructor(status) {
    super(`ResponseError - Client received a ${status}`);
    Object.freeze(this);
  }
}

export default ResponseError;
