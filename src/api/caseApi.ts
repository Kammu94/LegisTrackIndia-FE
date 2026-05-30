import { apiSlice } from './apiSlice';

export type HearingDto = {
  id: number;
  hearingDate: string;
  notes?: string | null;
  location?: string | null;
};

export type PaymentRecordDto = {
  id: string;
  caseId?: number;
  amount: number;
  type: number;
  mode: number;
  note?: string | null;
  transactionDate: string;
};

export type CaseDto = {
  id: number;
  caseNumber: string;
  clientName: string;
  courtName: string;
  judgeName?: string | null;
  courtAddress?: string | null;
  paymentInfoId?: string | null;
  credit?: number;
  debit?: number;
  promisedMoney?: number;
  caseStartDate?: string | null;
  status: number;
  hearings?: HearingDto[];
  hearingsTotalCount?: number;
  hearingsPageNumber?: number;
  hearingsPageSize?: number;
  totalFeesCollected?: number;
  totalBalance?: number;
  paymentRecords?: PaymentRecordDto[];
};

export type CreateCaseRequest = {
  caseNumber: string;
  clientName: string;
  courtName: string;
  judgeName?: string;
  courtAddress?: string;
  hearingDate?: string;
  caseStartDate?: string;
};

export type UpdateCaseRequest = {
  clientName?: string;
  courtName?: string;
  judgeName?: string;
  courtAddress?: string;
  caseStartDate?: string;
};

export type PaymentInfoUpdateRequest = {
  credit: number;
  debit: number;
  promisedMoney: number;
  notes?: string;
};

export type PaymentHistoryLogDto = {
  id: string;
  changedByUserId: string;
  changeType: string;
  operationType: string;
  oldValue?: number | null;
  newValue: number;
  notes?: string | null;
  createdAtUtc: string;
};

export type HearingListDto = {
  id: number;
  caseId: number;
  caseNumber: string;
  clientName: string;
  caseStatus: number;
  hearingDate: string;
  notes?: string | null;
  location?: string | null;
};

export const caseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCases: builder.query<CaseDto[], void>({
      query: () => '/cases',
      providesTags: ['Cases'],
    }),
    getCaseById: builder.query<CaseDto, { id: number; pageNumber: number; pageSize?: number }>({
      query: ({ id, pageNumber, pageSize }) => ({
        url: `/cases/${id}`,
        params: { pageNumber, pageSize },
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'Cases', id }],
    }),
    createCase: builder.mutation<number, CreateCaseRequest>({
      query: (data) => ({
        url: '/cases',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Cases', 'Profile'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(apiSlice.endpoints.getProfile.initiate(undefined, { forceRefetch: true }));
        } catch {
        }
      },
    }),
    updateCase: builder.mutation<void, { id: number; data: UpdateCaseRequest }>({
      query: ({ id, data }) => ({
        url: `/cases/${id}`,
        method: 'PUT',
        body: {
          id,
          ...data,
        },
      }),
      invalidatesTags: ['Cases'],
    }),
    updatePaymentInfo: builder.mutation<void, { paymentInfoId: string; data: PaymentInfoUpdateRequest }>({
      query: ({ paymentInfoId, data }) => ({
        url: `/payments/${paymentInfoId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Cases'],
    }),
    getPaymentHistoryLogs: builder.query<PaymentHistoryLogDto[], string>({
      query: (paymentInfoId) => `/payments/${paymentInfoId}/logs`,
    }),
    toggleCaseStatus: builder.mutation<void, number>({
      query: (id) => ({
        url: `/cases/${id}/toggle-status`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Cases'],
    }),
    addHearing: builder.mutation<number, { caseId: number; hearingDate: string; notes?: string; location?: string }>({
      query: (data) => ({
        url: '/hearings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { caseId }) => ['Cases', 'Hearings', { type: 'Cases', id: caseId }],
    }),
    updateHearing: builder.mutation<void, { id: number; hearingDate: string }>({
      query: ({ id, hearingDate }) => ({
        url: `/hearings/${id}`,
        method: 'PUT',
        body: { id, hearingDate },
      }),
      invalidatesTags: ['Cases', 'Hearings'],
    }),
    addPaymentRecord: builder.mutation<string, { caseId: number; amount: number; type: number; mode: number; note?: string; transactionDate?: string }>({
      query: (data) => ({
        url: '/paymentrecords',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { caseId }) => ['Cases', { type: 'Cases', id: caseId }],
    }),
    getHearings: builder.query<HearingListDto[], { startDate?: string; endDate?: string; caseSearch?: string; status?: number }>({
      query: (params) => ({
        url: '/hearings',
        params,
      }),
      providesTags: ['Hearings'],
    }),
    deleteCase: builder.mutation<void, number>({
      query: (id) => ({
        url: `/cases/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cases', 'Hearings'],
    }),
  }),
});

export const { 
  useGetCasesQuery, 
  useGetCaseByIdQuery,
  useCreateCaseMutation, 
  useUpdateCaseMutation, 
  useUpdatePaymentInfoMutation,
  useLazyGetPaymentHistoryLogsQuery,
  useToggleCaseStatusMutation,
  useAddHearingMutation,
  useUpdateHearingMutation,
  useAddPaymentRecordMutation,
  useGetHearingsQuery,
  useDeleteCaseMutation
} = caseApi;
