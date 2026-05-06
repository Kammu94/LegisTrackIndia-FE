import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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
  submittedAtUtc: string;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  tagTypes: ['Cases', 'Hearings', 'Profile', 'PublicProfile', 'Leads'],
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
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
} = apiSlice;
