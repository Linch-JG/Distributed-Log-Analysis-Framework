import { useState } from 'react';
import { 
  Table, 
  Space, 
  Button, 
  Typography, 
  Tag, 
  Input,
  DatePicker, 
  Form, 
  Select,
  Card,
  Popconfirm,
  message
} from 'antd';
import { 
  SearchOutlined, 
  DeleteOutlined, 
  ReloadOutlined 
} from '@ant-design/icons';
import { useGetLogsQuery, useDeleteLogMutation } from '../services/LogService';
import { ILog, LogQueryParams } from '../models/ILog';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Logs = () => {
  const [form] = Form.useForm();
  const [queryParams, setQueryParams] = useState<LogQueryParams>({
    page: 1,
    pageSize: 10
  });

  const { data: logs, isLoading, refetch } = useGetLogsQuery(queryParams);
  const [deleteLog] = useDeleteLogMutation();

  const handleDelete = async (id: string) => {
    try {
      await deleteLog(id).unwrap();
      message.success('Log deleted successfully');
      refetch();
    } catch (error) {
      message.error('Failed to delete log');
    }
  };

  const handleSearch = (values: any) => {
    const params: LogQueryParams = {
      page: 1,
      pageSize: 10
    };

    if (values.serverId) params.serverId = values.serverId;
    if (values.type) params.type = values.type;
    
    if (values.dateRange && values.dateRange.length === 2) {
      params.from = values.dateRange[0].toISOString();
      params.to = values.dateRange[1].toISOString();
    }

    setQueryParams(params);
  };

  const resetForm = () => {
    form.resetFields();
    setQueryParams({
      page: 1,
      pageSize: 10
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      width: 100
    },
    {
      title: 'Server ID',
      dataIndex: 'serverId',
      key: 'serverId'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        let color = 'green';
        if (type.toLowerCase().includes('error')) {
          color = 'red';
        } else if (type.toLowerCase().includes('warn')) {
          color = 'orange';
        } else if (type.toLowerCase().includes('info')) {
          color = 'blue';
        }
        return <Tag color={color}>{type.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count'
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      ellipsis: true
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => timestamp ? dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ILog) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this log?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger type="text" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>Logs</Title>
      
      <Card>
        <Form 
          form={form} 
          layout="inline" 
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="serverId">
            <Input placeholder="Server ID" prefix={<SearchOutlined />} />
          </Form.Item>
          
          <Form.Item name="type">
            <Select placeholder="Log Type" style={{ width: 150 }} allowClear>
              <Option value="error">Error</Option>
              <Option value="warn">Warning</Option>
              <Option value="info">Info</Option>
              <Option value="debug">Debug</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="dateRange">
            <RangePicker />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Search
            </Button>
          </Form.Item>
          
          <Form.Item>
            <Button icon={<ReloadOutlined />} onClick={resetForm}>
              Reset
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      <Table 
        columns={columns} 
        dataSource={logs || []} 
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: queryParams.page,
          pageSize: queryParams.pageSize,
          total: logs?.length || 0,
          onChange: (page) => setQueryParams({ ...queryParams, page })
        }}
      />
    </Space>
  );
};

export default Logs; 