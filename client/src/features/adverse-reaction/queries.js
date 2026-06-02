import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adverseReactionApi } from './api';

export const adverseReactionKeys = {
  all: ['adverse-reaction'],
  list: (p) => ['adverse-reaction', 'list', p ?? {}],
};

export function useAdverseReactionList(params) {
  return useQuery({
    queryKey: adverseReactionKeys.list(params),
    queryFn: () => adverseReactionApi.list(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useReportReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adverseReactionApi.report,
    onSuccess: () => qc.invalidateQueries({ queryKey: adverseReactionKeys.all }),
  });
}
