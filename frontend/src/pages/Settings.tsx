import { useState, useEffect } from 'react';
import { 
  Form,
  Button, 
  Card, 
  Space, 
  Typography, 
  Switch, 
  Select, 
  InputNumber,
  Divider,
  App
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { updateSettings, resetSettings, SettingsState } from '../store/settingsSlice';

const { Title } = Typography;
const { Option } = Select;

type SettingsForm = Omit<SettingsState, 'darkMode'> & {
  darkMode: boolean;
}

const Settings = () => {
  const [form] = Form.useForm<SettingsForm>();
  const [loading, setLoading] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { message } = App.useApp();
  
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);
  
  // Load settings from Redux store on component mount
  useEffect(() => {
    form.setFieldsValue(settings);
  }, [form, settings]);
  
  useEffect(() => {
    form.setFieldValue('darkMode', isDarkMode);
  }, [isDarkMode, form]);
  
  const handleSaveSettings = (values: SettingsForm) => {
    setLoading(true);
    
    if (values.darkMode !== isDarkMode) {
      toggleTheme();
    }
    
    dispatch(updateSettings(values));
    message.success('Settings saved successfully');
    setLoading(false);
  };
  
  const handleReset = () => {
    dispatch(resetSettings());
    form.setFieldsValue({...settings, darkMode: isDarkMode});
    message.info('Settings reset to default values');
  };
  
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>Settings</Title>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveSettings}
        >
          <Title level={4}>General Settings</Title>
          
          <Form.Item
            name="refreshInterval"
            label="Data Refresh Interval (seconds)"
            rules={[
              { required: true, message: 'Please enter refresh interval' },
              { type: 'number', min: 5, message: 'Interval must be at least 5 seconds' }
            ]}
          >
            <InputNumber min={5} max={300} style={{ width: 200 }} />
          </Form.Item>
          
          <Divider />
          
          <Title level={4}>Interface Settings</Title>
          
          <Form.Item
            name="defaultView"
            label="Default View"
          >
            <Select style={{ width: 200 }}>
              <Option value="dashboard">Dashboard</Option>
              <Option value="logs">Logs</Option>
              <Option value="analysis">Analysis</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="darkMode"
            label="Dark Mode"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          
          <Divider />
          
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={loading}
              >
                Save Settings
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
              >
                Reset to Defaults
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

export default Settings; 