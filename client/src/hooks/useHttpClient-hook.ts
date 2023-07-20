import { useCallback, useEffect, useRef, useState } from "react";

interface RequestConfig {
  url: string;
  method?: "GET" | "PATCH" | "POST" | "DELETE";
  headers?: {
    [props: string]: string;
  };
  body?: BodyInit | null;
  customUrl?: boolean;
}

type SendRequestFunction = <T = any>(
  requestConfig: RequestConfig
) => Promise<T>;

export function useHttpClient(): {
  readonly isLoading: boolean;
  readonly error: string | null;
  sendRequest: SendRequestFunction;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  clearError: () => void;
} {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeHttpRequest = useRef<AbortController[]>([]);

  useEffect(() => {
    return () =>
      activeHttpRequest.current.forEach((abortCtrl) => abortCtrl.abort());
  }, []);

  const sendRequest: SendRequestFunction = useCallback(
    async (requestConfig) => {
      setIsLoading(() => true);
      setError(() => null);
      const httpAbortCtrl = new AbortController();
      activeHttpRequest.current.push(httpAbortCtrl);

      try {
        const response = await fetch(
          requestConfig.customUrl
            ? requestConfig.url
            : `${process.env.REACT_APP_API_URL}${requestConfig.url}`,
          {
            method: requestConfig.method || "GET",
            credentials: requestConfig.customUrl ? undefined : "include",
            headers: requestConfig.headers || {},
            body: requestConfig.body || null,
            signal: httpAbortCtrl.signal,
          }
        );
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message);
        }

        return responseData;
      } catch (error: any) {
        setError(() => error.message || "Something went wrong!");
        throw error;
      } finally {
        activeHttpRequest.current = activeHttpRequest.current.filter(
          (ctrl) => ctrl !== httpAbortCtrl
        );
        setIsLoading(() => false);
      }
    },
    []
  );

  function clearError(): void {
    setError(() => null);
  }

  return { isLoading, error, sendRequest, setError, clearError };
}
