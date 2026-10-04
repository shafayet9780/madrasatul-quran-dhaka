'use client';

export type SurveyApi = {
  /** Resolves with the status for any HTTP answer; rejects only when the network fails. */
  post<T>(path: 'overview' | 'batch' | 'draft' | 'submit', body: unknown): Promise<{ status: number; data: T }>;
};

export function createApi(roundId: string, linkKey: string): SurveyApi {
  return {
    async post<T>(path: string, body: unknown) {
      const response = await fetch(`/api/survey/${roundId}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-survey-key': linkKey },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      const data = (await response.json().catch(() => ({}))) as T;
      return { status: response.status, data };
    },
  };
}
