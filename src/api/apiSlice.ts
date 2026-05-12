import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout } from '../features/auth/authSlice';
import { notify } from '../notifications/notifyService';

const baseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'https://localhost:7289/api';

export type WhyClientConnectPoint = {
  header: string;
  description: string;
};

export type AuthUser = {
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  barCouncilId?: string | null;
  phoneNumber?: string | null;
  officeAddress?: string | null;
  publicBio?: string | null;
  practiceAreas?: string[];
  whyClientConnectPoints?: WhyClientConnectPoint[];
  fullName: string;
  email: string;
  profileSlug: string;
};

export type AuthResponse = AuthUser & {
  token: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  fullName: string;
  barCouncilId: string;
  officeAddress: string;
};

export type UpdateUserProfileRequest = {
  firstName: string;
  lastName: string;
  gender?: string;
  barCouncilId?: string;
  phoneNumber?: string;
  officeAddress?: string;
  publicBio?: string;
  practiceAreas: string[];
  whyClientConnectPoints: WhyClientConnectPoint[];
};

export type PublicAdvocateProfile = {
  profileSlug: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  barCouncilId?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  officeAddress?: string | null;
  publicBio?: string | null;
  isVerified: boolean;
  practiceAreas: string[];
  whyClientConnectPoints: WhyClientConnectPoint[];
};

export type CreatePublicLeadRequest = {
  advocateId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  matterType: string;
  message: string;
};

export type Lead = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  matterType: string;
  message: string;
  status: LeadStatus;
  outcomeNote?: string | null;
  submittedAtUtc: string;
  updatedAt: string;
};

export type LeadStatusHistory = {
  id: string;
  fromStatus: LeadStatus;
  toStatus: LeadStatus;
  note: string;
  createdAtUtc: string;
};

export type LeadDetail = Lead & {
  statusHistory: LeadStatusHistory[];
};

export const LeadStatus = {
  New: 0,
  Contacted: 1,
  Scheduled: 2,
  Converted: 3,
  Lost: 4,
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export type UpdateLeadStatusRequest = {
  id: string;
  status: LeadStatus;
  note: string;
  outcomeNote?: string;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as { auth: { token: string | null } };
    const token = state.auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithAuthRedirect: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const token = (api.getState() as { auth: { token: string | null } }).auth.token;

  const statusNumber = typeof result.error?.status === 'number' ? result.error.status : null;
  const statusText = typeof result.error?.status === 'string' ? result.error.status : null;

  if (statusText) {
    const errorText =
      (result.error as { error?: string } | undefined)?.error ||
      'Network error. Please try again.';
    notify({
      severity: 'error',
      title: 'Network Error',
      message: errorText,
      persist: true,
    });
  }

  if (statusNumber && statusNumber >= 400 && statusNumber < 600) {
    const meta =
      statusNumber === 400
        ? { title: 'Invalid Request', severity: 'warning' as const }
        : statusNumber === 401
          ? { title: 'Session Expired', severity: 'security' as const }
          : statusNumber === 403
            ? { title: 'Access Denied', severity: 'security' as const }
            : statusNumber === 404
              ? { title: 'Not Found', severity: 'warning' as const }
              : statusNumber >= 500
                ? { title: 'Server Error', severity: 'error' as const }
                : { title: 'Request Failed', severity: 'error' as const };

    const data = result.error?.data as
      | { message?: string; title?: string }
      | string
      | null
      | undefined;

    const message =
      typeof data === 'string'
        ? data
        : typeof data?.message === 'string' && data.message.trim().length > 0
          ? data.message
          : typeof data?.title === 'string' && data.title.trim().length > 0
            ? data.title
            : 'Something went wrong. Please try again.';

    notify({
      severity: meta.severity,
      title: meta.title,
      message,
      persist: statusNumber >= 500 || statusNumber === 401,
    });
  }

  if (statusNumber === 401 && token) {
    api.dispatch(logout());
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  tagTypes: ['Cases', 'Hearings', 'Profile', 'PublicProfile', 'Leads'],
  baseQuery: baseQueryWithAuthRedirect,
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    getProfile: builder.query<AuthUser, void>({
      query: () => '/user/profile',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<AuthUser, UpdateUserProfileRequest>({
      query: (data) => ({
        url: '/user/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile'],
    }),
    getPublicProfile: builder.query<PublicAdvocateProfile, string>({
      query: (advocateId) => `/public/profile/${advocateId}`,
      providesTags: ['PublicProfile'],
    }),
    submitPublicLead: builder.mutation<{ message: string }, CreatePublicLeadRequest>({
      query: ({ advocateId, ...body }) => ({
        url: `/public/profile/${advocateId}/lead`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Leads'],
    }),
    getMyLeads: builder.query<Lead[], void>({
      query: () => '/leads',
      providesTags: ['Leads'],
    }),
    getLeadById: builder.query<LeadDetail, string>({
      query: (id) => `/leads/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Leads', id }],
    }),
    updateLeadStatus: builder.mutation<Lead, UpdateLeadStatusRequest>({
      query: ({ id, status, note, outcomeNote }) => ({
        url: `/leads/${id}/status`,
        method: 'PATCH',
        body: { status, note, outcomeNote },
      }),
      async onQueryStarted({ id, status, note, outcomeNote }, { dispatch, queryFulfilled }) {
        const optimisticUpdatedAt = new Date().toISOString();
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getMyLeads', undefined, (draft) => {
            const target = draft.find((lead) => lead.id === id);
            if (!target) return;

            target.status = status;
            target.outcomeNote =
              status === LeadStatus.Converted || status === LeadStatus.Lost
                ? outcomeNote?.trim() || null
                : null;
            target.updatedAt = optimisticUpdatedAt;
            draft.sort((left, right) => {
              if (left.status !== right.status) {
                return left.status - right.status;
              }

              return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
            });
          })
        );

        const detailPatchResult = dispatch(
          apiSlice.util.updateQueryData('getLeadById', id, (draft) => {
            const previousStatus = draft.status;
            draft.status = status;
            draft.outcomeNote =
              status === LeadStatus.Converted || status === LeadStatus.Lost
                ? outcomeNote?.trim() || null
                : null;
            draft.updatedAt = optimisticUpdatedAt;
            draft.statusHistory.unshift({
              id: `optimistic-${Date.now()}`,
              fromStatus: previousStatus,
              toStatus: status,
              note: note.trim(),
              createdAtUtc: optimisticUpdatedAt,
            });
          })
        );

        try {
          const { data } = await queryFulfilled;
          dispatch(
            apiSlice.util.updateQueryData('getMyLeads', undefined, (draft) => {
              const index = draft.findIndex((lead) => lead.id === id);
              if (index === -1) return;
              draft[index] = data;
            })
          );
          dispatch(
            apiSlice.util.invalidateTags([{ type: 'Leads', id }])
          );
        } catch {
          patchResult.undo();
          detailPatchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { id }) => ['Leads', { type: 'Leads', id }],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetPublicProfileQuery,
  useSubmitPublicLeadMutation,
  useGetMyLeadsQuery,
  useGetLeadByIdQuery,
  useUpdateLeadStatusMutation,
} = apiSlice;
