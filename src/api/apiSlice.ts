import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  tagTypes: ['Cases', 'Hearings'],
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://localhost:7289/api', // Replace with your actual API URL
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
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = apiSlice;
