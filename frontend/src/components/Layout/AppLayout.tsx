import { Layout, Menu, Typography } from 'antd';
import { 
  DashboardOutlined, 
  DatabaseOutlined, 
  FileSearchOutlined, 
  SettingOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('/dashboard');
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  // Update selected menu item based on current path
  useEffect(() => {
    const path = location.pathname;
    // If we're at root, we'll be redirected, so don't update yet
    if (path !== '/') {
      setSelectedKey(path);
    }
  }, [location]);

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/logs', icon: <DatabaseOutlined />, label: 'Logs' },
    { key: '/analysis', icon: <FileSearchOutlined />, label: 'Analysis' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' }
  ];

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        theme={isDarkMode ? "dark" : "dark"} // Always dark for sidebar
      >
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Title level={5} style={{ color: 'white', margin: 0 }}>
            DLA
          </Title>
        </div>
        <Menu 
          theme="dark"
          mode="inline" 
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: isDarkMode ? '#1f1f1f' : '#fff', 
          padding: '0 24px'
        }}>
          <Title 
            level={3} 
            style={{ 
              margin: 0,
              color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'
            }}
          >
            Distributed Log Analysis
          </Title>
        </Header>
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: isDarkMode ? '#1f1f1f' : '#fff', 
          minHeight: 280 
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout; 