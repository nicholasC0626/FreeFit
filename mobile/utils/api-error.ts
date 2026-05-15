import axios from "axios";

export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  if (!error.response) {
    return "Cannot reach backend API. Start server at http://localhost:3000.";
  }

  const responseData = error.response.data as
    | {
        error?: string;
        message?: string;
        details?: {
          formErrors?: string[];
          fieldErrors?: Record<string, string[] | undefined>;
        };
      }
    | undefined;

  const fieldErrors = responseData?.details?.fieldErrors;
  if (fieldErrors) {
    for (const messages of Object.values(fieldErrors)) {
      const firstMessage = messages?.[0];
      if (firstMessage) {
        return firstMessage;
      }
    }
  }

  const formError = responseData?.details?.formErrors?.[0];
  if (formError) {
    return formError;
  }

  if (responseData?.error) {
    return responseData.error;
  }
  if (responseData?.message) {
    return responseData.message;
  }

  return fallbackMessage;
};
