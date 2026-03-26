import { useQuery } from '@tanstack/react-query';

import { getSessions } from '../services/api/openf1-client';

type OpenF1Params = Record<string, string | number | boolean>;

export function useSessions(params?: OpenF1Params) {
  return useQuery({
    queryKey: ['sessions', params ?? {}],
    queryFn: () => getSessions(params),
  });
}