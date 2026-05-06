import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'https://localhost:7289/api';

export type AuthUser = {
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  barCouncilId?: string | null;
  phoneNumber?: string | null;
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
};

export const apiSlice = createApi({
  reducerPath: 'api',
  tagTypes: ['Cases', 'Hearings', 'Profile'],
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
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} = apiSlice;
