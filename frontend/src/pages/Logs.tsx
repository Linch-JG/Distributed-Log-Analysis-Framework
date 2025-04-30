import { useState, useEffect } from 'react';
import { 
  Table, 
  Space, 
  Button, 
  Typography, 
  Tag, 
  Input,
  Form, 
  Card,
  Popconfirm,
  message,
  Select
} from 'antd';
import { 
  SearchOutlined, 
  DeleteOutlined, 
  ReloadOutlined 
} from '@ant-design/icons';
import { useGetLogsQuery, useDeleteLogMutation } from '../services/LogService';
import { ILog } from '../models/ILog';
import { useAppSelector } from '../hooks/redux';
import dayjs from 'dayjs';

const { Title } = Typography;

const Logs = () => {
  const [form] = Form.useForm();
  const [serverIdFilter, setServerIdFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  const { refreshInterval } = useAppSelector(state => state.settings);
  const { data, isLoading, refetch } = useGetLogsQuery({});
  const [deleteLog] = useDeleteLogMutation();
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, refetch]);

  const logs: ILog[] = Array.isArray(data) ? data : [];

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
    setServerIdFilter(values.serverId || undefined);
    setTypeFilter(values.type || undefined);
  };

  const resetForm = () => {
    form.resetFields();
    setServerIdFilter(undefined);
    setTypeFilter(undefined);
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
        let color = 'grey';
        const lowerCaseType = type.toLowerCase();

        if (lowerCaseType === 'ip') {
          color = 'blue';
        } else if (lowerCaseType === 'endpoint') {
          color = 'green';
        }

        return <Tag color={color}>{type.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: ILog, b: ILog) => a.count - b.count
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

  const filteredLogs = logs.filter(log => {
    const serverIdMatch = !serverIdFilter || log.serverId.toLowerCase().includes(serverIdFilter.toLowerCase());
    const typeMatch = !typeFilter || log.type.toLowerCase() === typeFilter.toLowerCase();
    
    return serverIdMatch && typeMatch;
  });

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
            <Select 
              placeholder="Select Type" 
              allowClear
              style={{ width: 150 }}
            >
              <Select.Option value="ip">IP</Select.Option>
              <Select.Option value="endpoint">ENDPOINT</Select.Option>
            </Select>
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
      
      {filteredLogs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">
            {filteredLogs.length} records available
          </Typography.Text>
        </div>
      )}
      
      <Table 
        columns={columns} 
        dataSource={filteredLogs}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 7,
          showSizeChanger: false
        }}
        sortDirections={['ascend', 'descend']}
      />
    </Space>
  );
};

export default Logs;