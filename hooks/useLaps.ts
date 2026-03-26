import { useQuery } from '@tanstack/react-query';

import { getLaps } from '../services/api/openf1-client';

type OpenF1Params = Record<string, string | number | boolean>;

export function useLaps(params?: OpenF1Params) {
  return useQuery({
    queryKey: ['laps', params ?? {}],
    queryFn: () => getLaps(params),
  });
}