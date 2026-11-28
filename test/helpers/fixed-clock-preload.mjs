const fixedNowIso = process.env.TEST_FIXED_NOW;
if (fixedNowIso) {
  const NativeDate = globalThis.Date;
  const fixedTimestamp = NativeDate.parse(fixedNowIso);
  if (!Number.isFinite(fixedTimestamp)) {
    throw new Error("TEST_FIXED_NOW must be a valid ISO timestamp");
  }
  class FixedDate extends NativeDate {
    constructor(...args) {
      if (args.length === 0) super(fixedTimestamp);
      else super(...args);
    }
    static now() {
      return fixedTimestamp;
    }
  }
  globalThis.Date = FixedDate;
}
