class RequestError extends Error {
  constructor() {
    super('RequestError - Request failed to send');
    Object.freeze(this);
  }
}

export default RequestError;
