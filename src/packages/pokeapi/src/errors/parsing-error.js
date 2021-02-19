class ParsingError extends Error {
  constructor() {
    super('ParsingError - Failed to parse response');
    Object.freeze(this);
  }
}

export default ParsingError;
