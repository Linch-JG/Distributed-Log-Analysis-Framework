import { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Form, 
  Select, 
  Button, 
  Radio, 
  Divider,
  Spin,
  Alert,
  Row,
  Col
} from 'antd';
import { Column, Bar, Heatmap } from '@ant-design/charts';
import { ILog } from '../models/ILog';
import { useGetLogsQuery } from '../services/LogService';
import { useAppSelector } from '../hooks/redux';

const { Title, Text } = Typography;
const { Option } = Select;

type ChartType = 'bar' | 'column' | 'heatmap';

interface AnalysisParams {
  field: keyof ILog;
  groupBy: keyof ILog;
  chartType: ChartType;
}

const Analysis = () => {
  const [params, setParams] = useState<AnalysisParams>({
    field: 'count',
    groupBy: 'type',
    chartType: 'column'
  });

  const { refreshInterval } = useAppSelector(state => state.settings);
  const { data: logs, isLoading, error, refetch } = useGetLogsQuery({});
  const [form] = Form.useForm();

  // Auto-refresh based on settings interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, refetch]);

  if (isLoading) return <Spin size="large" />;
  if (error) return <Alert type="error" message="Failed to load data" />;

  const handleSubmit = (values: AnalysisParams) => {
    setParams(values);
  };

  // Process data for visualization
  const processData = () => {
    if (!logs) return [];

    const groupedData: { [key: string]: { [field: string]: number } } = {};
    
    logs.forEach(log => {
      const groupKey = String(log[params.groupBy]) || 'unknown';
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {};
      }
      
      // For numeric fields
      if (typeof log[params.field] === 'number') {
        groupedData[groupKey][params.field] = (groupedData[groupKey][params.field] || 0) + Number(log[params.field]);
      } 
      // For counting occurrences
      else {
        groupedData[groupKey][params.field] = (groupedData[groupKey][params.field] || 0) + 1;
      }
    });

    // Convert to array format for charts
    return Object.entries(groupedData).map(([group, values]) => ({
      group,
      ...values
    }));
  };

  const renderChart = () => {
    const data = processData();
    
    if (data.length === 0) {
      return <Alert message="No data available for selected parameters" type="info" />;
    }

    switch (params.chartType) {
      case 'column':
        return (
          <Column 
            data={data}
            xField="group"
            yField={params.field}
            label={{
              position: 'middle',
              style: {
                fill: '#FFFFFF',
                opacity: 0.6,
              },
            }}
            meta={{
              group: {
                alias: params.groupBy.toString(),
              },
              [params.field]: {
                alias: params.field.toString(),
              },
            }}
          />
        );
      
      case 'bar':
        return (
          <Bar 
            data={data}
            yField="group"
            xField={params.field}
            seriesField="group"
            legend={{
              position: 'top-left',
            }}
          />
        );
      
      case 'heatmap':
        // Transform data for heatmap
        const heatmapData = logs?.map(log => ({
          x: String(log[params.groupBy]),
          y: String(log.serverId),
          value: typeof log[params.field] === 'number' ? Number(log[params.field]) : 1
        })) || [];
        
        return (
          <Heatmap 
            data={heatmapData}
            xField="x"
            yField="y"
            colorField="value"
            color={['#174c83', '#7eb6d4', '#efefeb', '#efa759', '#9b4d16']}
            meta={{
              x: {
                alias: params.groupBy.toString(),
              },
              y: {
                alias: 'Server ID',
              },
            }}
          />
        );
      
      default:
        return <Alert message="Please select a chart type" type="warning" />;
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>Log Analysis</Title>
      
      <Card>
        <Form 
          form={form}
          layout="horizontal"
          initialValues={params}
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="field"
                label="Analyze Field"
                rules={[{ required: true, message: 'Please select a field to analyze' }]}
              >
                <Select placeholder="Select a field to analyze">
                  <Option value="count">Count</Option>
                  <Option value="value">Value</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="groupBy"
                label="Group By"
                rules={[{ required: true, message: 'Please select a field to group by' }]}
              >
                <Select placeholder="Group by">
                  <Option value="type">Log Type</Option>
                  <Option value="serverId">Server ID</Option>
                  <Option value="timestamp">Timestamp</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Analyze
                </Button>
              </Form.Item>
            </Col>
          </Row>
          
          <Divider />
          
          <Form.Item name="chartType" label="Visualization Type">
            <Radio.Group buttonStyle="solid">
              <Radio.Button value="column">Column</Radio.Button>
              <Radio.Button value="bar">Bar</Radio.Button>
              <Radio.Button value="heatmap">Heatmap</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Card>
      
      <Card title={<Space><Text strong>Analysis Results</Text><Text type="secondary">{`${params.field} by ${params.groupBy}`}</Text></Space>}>
        <div style={{ height: 500 }}>
          {renderChart()}
        </div>
      </Card>
    </Space>
  );
};

export default Analysis; 