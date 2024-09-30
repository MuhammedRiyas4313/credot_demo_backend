import { ERROR } from "common/error.common";

export const returnErrorWithFields = (error: Record<string, any>, field: string, errorStr: string) => {
  if (!error) {
    return error;
  }

  if (!error.fields) {
    error.fields = {};
  }

  error.fields[field] = errorStr;

  return error;
};

export const verifyRequiredFields = (requiredFields: any) => {
  const missingFields = Object.keys(requiredFields).filter(
    (field: any) => requiredFields[field] === undefined || requiredFields[field] === null,
  );

  if (missingFields.length > 0) {
    throw new Error(ERROR.INVALID_FIELD(missingFields));
  }

  return true;
};
