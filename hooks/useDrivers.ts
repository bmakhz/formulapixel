import { useQuery } from '@tanstack/react-query';

import { getDrivers } from '../services/api/openf1-client';

type OpenF1Params = Record<string, string | number | boolean>;

export function useDrivers(params?: OpenF1Params) {
  return useQuery({
    queryKey: ['drivers', params ?? {}],
    queryFn: () => getDrivers(params),
  });
}