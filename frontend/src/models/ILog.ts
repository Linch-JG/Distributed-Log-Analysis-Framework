export interface ILog {
  id: string;
  serverId: string;
  type: string;
  value: string;
  count: number;
  timestamp: string | null;
}

export interface LogQueryParams {
  serverId?: string;
  type?: string;
  from?: string;
  to?: string;
} 