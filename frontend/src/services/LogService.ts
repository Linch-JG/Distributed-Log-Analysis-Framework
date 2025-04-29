import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ILog, LogQueryParams } from '../models/ILog';
import { API_BASE_URL } from '../constants/constants';


export const logAPI = createApi({
    reducerPath: 'logAPI',
    baseQuery: fetchBaseQuery({ baseUrl: `${API_BASE_URL}/logs` }),
    endpoints: (builder) => ({
        getLogs: builder.query<ILog[], LogQueryParams>({
            query: (params) => ({
                url: '',
                params,
            }),
        }),
        
        getLogById: builder.query<ILog, string>({
            query: (id) => `/${id}`,
        }),
        
        addLog: builder.mutation<ILog, Partial<ILog>>({
            query: (log) => ({
                url: '',
                method: 'POST',
                body: log,
            }),
        }),
        
        updateLog: builder.mutation<ILog, { id: string; log: Partial<ILog> }>({
            query: ({ id, log }) => ({
                url: `/${id}`,
                method: 'PUT',
                body: log,
            }),
        }),
        
        deleteLog: builder.mutation<void, string>({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
        }),
    }),
});

export const { 
    useGetLogsQuery, 
    useGetLogByIdQuery, 
    useAddLogMutation, 
    useUpdateLogMutation,
    useDeleteLogMutation
} = logAPI; 