import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography, Space } from 'antd';
import { 
  DatabaseOutlined, 
  CloudServerOutlined 
} from '@ant-design/icons';
import { Pie, Line } from '@ant-design/charts';
import { useGetLogsQuery } from '../services/LogService';
import { useAppSelector } from '../hooks/redux';

const { Title } = Typography;

interface LogSummary {
  totalLogs: number;
  serverCount: number;
  logTypes: { [key: string]: number };
  timeDistribution: { timestamp: string; count: number }[];
}

const Dashboard = () => {
  const [summary, setSummary] = useState<LogSummary>({
    totalLogs: 0,
    serverCount: 0,
    logTypes: {},
    timeDistribution: []
  });

  const { refreshInterval } = useAppSelector(state => state.settings);
  const { data: logs, isLoading, error, refetch } = useGetLogsQuery({});

  // Auto-refresh based on settings interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, refetch]);

  useEffect(() => {
    if (logs) {
      // Calculate summary data
      const servers = new Set(logs.map(log => log.serverId));
      const logTypes: { [key: string]: number } = {};
      
      // Count log types
      logs.forEach(log => {
        if (log.type) {
          logTypes[log.type] = (logTypes[log.type] || 0) + 1;
        }
      });
      
      // Group logs by hour for time distribution
      const timeMap = new Map<string, number>();
      logs.forEach(log => {
        if (log.timestamp) {
          const hour = new Date(log.timestamp).toISOString().split('T')[0];
          timeMap.set(hour, (timeMap.get(hour) || 0) + 1);
        }
      });
      
      const timeDistribution = Array.from(timeMap.entries())
        .map(([timestamp, count]) => ({ timestamp, count }))
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      
      setSummary({
        totalLogs: logs.length,
        serverCount: servers.size,
        logTypes,
        timeDistribution
      });
    }
  }, [logs]);

  // Prepare data for Pie chart
  const pieData = Object.entries(summary.logTypes).map(([type, value]) => ({
    type,
    value
  }));

  // Configure pie chart
  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.7,
    innerRadius: 0.1,
    meta: {
      value: {
        formatter: (v: number) => `${v} logs`,
      },
    },
    label: {
      type: 'inner',
      offset: '-50%',
      autoRotate: false,
      style: { textAlign: 'center' },
      formatter: ({ type, value }: { type: string; value: number }) => `${type}: ${value}`,
    },
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
    statistic: {
      title: {
        formatter: () => 'Log Types',
      },
      content: {
        formatter: () => summary.totalLogs.toString(),
      },
    },
    animation: {
      appear: {
        duration: 1000,
      },
    },
  };

  const lineConfig = {
    data: summary.timeDistribution,
    xField: 'timestamp',
    yField: 'count',
    point: {
      size: 5,
      shape: 'diamond',
    },
    smooth: true,
  };

  if (isLoading) return <Spin size="large" />;
  if (error) return <div>Error loading data</div>;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>Dashboard</Title>
      
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Total Logs"
              value={summary.totalLogs}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Servers"
              value={summary.serverCount}
              prefix={<CloudServerOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Log Types Distribution">
            <div style={{ height: 400, padding: '20px 0' }}>
              {pieData.length > 0 ? (
                <Pie {...pieConfig} />
              ) : (
                <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  No data available
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Log Volume Over Time">
            <div style={{ height: 400 }}>
              <Line {...lineConfig} />
            </div>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default Dashboard; 