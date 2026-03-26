import { useQuery } from '@tanstack/react-query';

import { getPositions } from '../services/api/openf1-client';

type OpenF1Params = Record<string, string | number | boolean>;

export function useLeaderboard(params?: OpenF1Params) {
  return useQuery({
    queryKey: ['leaderboard', params ?? {}],
    queryFn: () => getPositions(params),
  });
}