import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign, Users, MousePointer, Filter, Upload, FileText, AlertCircle } from 'lucide-react';
import * as d3 from 'd3';
import Papa from 'papaparse';

const App = () => {
  const [dateRange, setDateRange] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadedData, setUploadedData] = useState(null);
  const [isUsingRealData, setIsUsingRealData] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const [showUploadInterface, setShowUploadInterface] = useState(true);

  // File upload handler
  const handleFileUpload = (file, type) => {
    setUploadStatus(prev => ({ ...prev, [type]: 'uploading' }));
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
          console.error(`Error parsing ${type} file:`, results.errors);
          return;
        }
        
        setUploadedData(prev => ({
          ...prev,
          [type]: results.data
        }));
        setUploadStatus(prev => ({ ...prev, [type]: 'success' }));
        
        // Check if all required files are uploaded
        const newData = { ...uploadedData, [type]: results.data };
        if (newData.facebook && newData.google && newData.tiktok && newData.business) {
          setIsUsingRealData(true);
          setShowUploadInterface(false);
        }
      },
      error: (error) => {
        setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
        console.error(`Error reading ${type} file:`, error);
      }
    });
  };

  const FileUploadCard = ({ type, title, description }) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) handleFileUpload(file, type);
          }}
          className="hidden"
          id={`file-${type}`}
        />
        <label
          htmlFor={`file-${type}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload CSV
        </label>
        
        {uploadStatus[type] && (
          <div className="mt-3">
            {uploadStatus[type] === 'uploading' && (
              <div className="text-blue-600">Uploading...</div>
            )}
            {uploadStatus[type] === 'success' && (
              <div className="text-green-600">✓ Uploaded successfully</div>
            )}
            {uploadStatus[type] === 'error' && (
              <div className="text-red-600">⚠ Upload failed</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Process uploaded data
  const processUploadedData = () => {
    if (!uploadedData) return [];
    
    const allData = [];
    
    // Process marketing data
    ['facebook', 'google', 'tiktok'].forEach(channel => {
      if (uploadedData[channel]) {
        uploadedData[channel].forEach(row => {
          allData.push({
            ...row,
            channel: channel.charAt(0).toUpperCase() + channel.slice(1),
            ctr: row.clicks && row.impressions ? (row.clicks / row.impressions * 100).toFixed(2) : 0,
            cpc: row.spend && row.clicks ? (row.spend / row.clicks).toFixed(2) : 0,
            roas: row.attributed_revenue && row.spend ? (row.attributed_revenue / row.spend).toFixed(2) : 0
          });
        });
      }
    });
    
    // Process business data
    if (uploadedData.business) {
      uploadedData.business.forEach(row => {
        allData.push({
          ...row,
          channel: 'business',
          aov: row.total_revenue && row.orders ? (row.total_revenue / row.orders).toFixed(2) : 0
        });
      });
    }
    
    return allData;
  };

  // Sample data generator
  const generateSampleData = () => {
    const channels = ['Facebook', 'Google', 'TikTok'];
    const states = ['CA', 'NY', 'TX', 'FL', 'IL'];
    const campaigns = ['Brand_Awareness', 'Conversion', 'Retargeting', 'Prospecting'];
    
    const data = [];
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < 120; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const seasonality = 1 + 0.3 * Math.sin((i / 120) * 2 * Math.PI);
      
      // Marketing data for each channel
      channels.forEach(channel => {
        const baseSpend = channel === 'Google' ? 5000 : channel === 'Facebook' ? 3000 : 2000;
        const weekendEffect = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1.0;
        
        const spend = Math.round(baseSpend * seasonality * weekendEffect * (0.8 + Math.random() * 0.4));
        const impressions = Math.round(spend * (channel === 'Google' ? 50 : channel === 'Facebook' ? 80 : 120) * (0.9 + Math.random() * 0.2));
        const clicks = Math.round(impressions * (channel === 'Google' ? 0.03 : channel === 'Facebook' ? 0.015 : 0.02) * (0.8 + Math.random() * 0.4));
        const attributed_revenue = Math.round(clicks * (channel === 'Google' ? 12 : channel === 'Facebook' ? 8 : 6) * (0.7 + Math.random() * 0.6));
        
        data.push({
          date: dateStr,
          channel,
          state: states[Math.floor(Math.random() * states.length)],
          campaign: campaigns[Math.floor(Math.random() * campaigns.length)],
          impressions,
          clicks,
          spend,
          attributed_revenue,
          ctr: (clicks / impressions * 100).toFixed(2),
          cpc: (spend / clicks).toFixed(2),
          roas: (attributed_revenue / spend).toFixed(2)
        });
      });
      
      // Business data
      const totalSpend = data.filter(d => d.date === dateStr).reduce((sum, d) => sum + d.spend, 0);
      const orders = Math.round(30 + totalSpend * 0.002 * seasonality * (0.8 + Math.random() * 0.4));
      const newCustomers = Math.round(orders * 0.4 * (0.8 + Math.random() * 0.4));
      const totalRevenue = Math.round(orders * 85 * (0.9 + Math.random() * 0.2));
      const cogs = Math.round(totalRevenue * 0.4);
      
      if (i === 0 || !data.find(d => d.date === dateStr && d.channel === 'business')) {
        data.push({
          date: dateStr,
          channel: 'business',
          orders,
          new_orders: Math.round(orders * 0.6),
          new_customers: newCustomers,
          total_revenue: totalRevenue,
          gross_profit: totalRevenue - cogs,
          cogs,
          aov: (totalRevenue / orders).toFixed(2)
        });
      }
    }
    
    return data;
  };

  const sampleData = useMemo(() => {
    return isUsingRealData ? processUploadedData() : generateSampleData();
  }, [isUsingRealData, uploadedData]);

  // Data processing
  const processedData = useMemo(() => {
    const marketingData = sampleData.filter(d => d.channel !== 'business');
    const businessData = sampleData.filter(d => d.channel === 'business');
    
    // Aggregate by date
    const dailyAggregated = d3.rollup(
      marketingData,
      v => ({
        total_spend: d3.sum(v, d => d.spend),
        total_impressions: d3.sum(v, d => d.impressions),
        total_clicks: d3.sum(v, d => d.clicks),
        total_attributed_revenue: d3.sum(v, d => d.attributed_revenue),
        avg_ctr: d3.mean(v, d => parseFloat(d.ctr)),
        avg_cpc: d3.mean(v, d => parseFloat(d.cpc)),
        avg_roas: d3.mean(v, d => parseFloat(d.roas))
      }),
      d => d.date
    );

    // Combine with business data
    const combinedData = Array.from(dailyAggregated, ([date, marketing]) => {
      const business = businessData.find(d => d.date === date) || {};
      return {
        date,
        ...marketing,
        ...business,
        efficiency_score: (marketing.total_attributed_revenue / marketing.total_spend * 100).toFixed(1)
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    return combinedData;
  }, [sampleData]);

  const channelData = useMemo(() => {
    return d3.rollup(
      sampleData.filter(d => d.channel !== 'business'),
      v => ({
        spend: d3.sum(v, d => d.spend),
        revenue: d3.sum(v, d => d.attributed_revenue),
        clicks: d3.sum(v, d => d.clicks),
        impressions: d3.sum(v, d => d.impressions),
        roas: d3.sum(v, d => d.attributed_revenue) / d3.sum(v, d => d.spend)
      }),
      d => d.channel
    );
  }, [sampleData]);

  const kpis = useMemo(() => {
    const totalSpend = d3.sum(processedData, d => d.total_spend || 0);
    const totalRevenue = d3.sum(processedData, d => d.total_revenue || 0);
    const totalAttributedRevenue = d3.sum(processedData, d => d.total_attributed_revenue || 0);
    const totalOrders = d3.sum(processedData, d => d.orders || 0);
    const totalClicks = d3.sum(processedData, d => d.total_clicks || 0);
    const totalImpressions = d3.sum(processedData, d => d.total_impressions || 0);

    return {
      totalSpend,
      totalRevenue,
      totalAttributedRevenue,
      totalOrders,
      roas: (totalAttributedRevenue / totalSpend).toFixed(2),
      ctr: (totalClicks / totalImpressions * 100).toFixed(2),
      aov: (totalRevenue / totalOrders).toFixed(2),
      marketingContribution: (totalAttributedRevenue / totalRevenue * 100).toFixed(1)
    };
  }, [processedData]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const KPICard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Intelligence Dashboard</h1>
              <p className="text-gray-600">Connect marketing activities with business outcomes</p>
            </div>
            <div className="flex items-center gap-4">
              {isUsingRealData && (
                <div className="flex items-center text-green-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Using uploaded data
                </div>
              )}
              <button
                onClick={() => setShowUploadInterface(!showUploadInterface)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                {showUploadInterface ? 'Hide Upload' : 'Upload Data'}
              </button>
            </div>
          </div>
        </div>

        {/* File Upload Interface */}
        {showUploadInterface && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Your Dataset</h2>
              <p className="text-gray-600 mb-6">
                Upload your CSV files to see real insights. The dashboard will automatically process and visualize your data.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FileUploadCard
                  type="facebook"
                  title="Facebook.csv"
                  description="Campaign-level Facebook marketing data with impressions, clicks, spend, and attributed revenue"
                />
                <FileUploadCard
                  type="google"
                  title="Google.csv"
                  description="Campaign-level Google marketing data with impressions, clicks, spend, and attributed revenue"
                />
                <FileUploadCard
                  type="tiktok"
                  title="TikTok.csv"
                  description="Campaign-level TikTok marketing data with impressions, clicks, spend, and attributed revenue"
                />
                <FileUploadCard
                  type="business"
                  title="Business.csv"
                  description="Daily business performance data with orders, customers, revenue, and costs"
                />
              </div>
              
              {!isUsingRealData && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-800">Currently showing sample data</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Upload all four CSV files to see insights from your actual marketing and business data. 
                        The sample data demonstrates the dashboard's capabilities with realistic e-commerce metrics.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="all">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="7">Last 7 Days</option>
            </select>
          </div>
          <select 
            value={selectedChannel} 
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1"
          >
            <option value="all">All Channels</option>
            <option value="Facebook">Facebook</option>
            <option value="Google">Google</option>
            <option value="TikTok">TikTok</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {['overview', 'performance', 'attribution', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KPICard
                title="Total Ad Spend"
                value={`$${(kpis.totalSpend / 1000).toFixed(0)}K`}
                icon={DollarSign}
                color="#8884d8"
                subtitle="120 days"
              />
              <KPICard
                title="ROAS"
                value={`${kpis.roas}x`}
                icon={TrendingUp}
                color="#82ca9d"
                subtitle="Return on ad spend"
              />
              <KPICard
                title="Total Revenue"
                value={`$${(kpis.totalRevenue / 1000).toFixed(0)}K`}
                icon={DollarSign}
                color="#ffc658"
                subtitle={`${kpis.marketingContribution}% from marketing`}
              />
              <KPICard
                title="Total Orders"
                value={kpis.totalOrders.toLocaleString()}
                icon={Users}
                color="#ff7c7c"
                subtitle={`$${kpis.aov} AOV`}
              />
            </div>

            {/* Revenue vs Spend Trend */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Revenue vs Marketing Spend Trend</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [`$${value?.toLocaleString()}`, name]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="total_spend" fill="#8884d8" name="Ad Spend" opacity={0.8} />
                  <Line yAxisId="right" type="monotone" dataKey="total_revenue" stroke="#82ca9d" strokeWidth={3} name="Total Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="total_attributed_revenue" stroke="#ffc658" strokeWidth={2} name="Attributed Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Channel Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Channel Spend Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Array.from(channelData, ([channel, data]) => ({ channel, spend: data.spend }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="spend"
                      label={({ channel, percent }) => `${channel} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Array.from(channelData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Spend']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Channel ROAS Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Array.from(channelData, ([channel, data]) => ({ channel, roas: data.roas }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toFixed(2)}x`, 'ROAS']} />
                    <Bar dataKey="roas" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KPICard
                title="Click-Through Rate"
                value={`${kpis.ctr}%`}
                icon={MousePointer}
                color="#8884d8"
                subtitle="Average across channels"
              />
              <KPICard
                title="Conversion Rate"
                value="2.8%"
                icon={TrendingUp}
                color="#82ca9d"
                subtitle="Clicks to orders"
              />
              <KPICard
                title="Customer Acquisition Cost"
                value="$42"
                icon={DollarSign}
                color="#ffc658"
                subtitle="Blended CAC"
              />
            </div>

            {/* Efficiency Trend */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Marketing Efficiency Over Time</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="efficiency_score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Efficiency Score %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'attribution' && (
          <div className="space-y-6">
            {/* Attribution Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Marketing Contribution to Revenue</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Revenue Attribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Marketing Attributed', value: kpis.totalAttributedRevenue },
                          { name: 'Other Sources', value: kpis.totalRevenue - kpis.totalAttributedRevenue }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#82ca9d" />
                        <Cell fill="#ffc658" />
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Channel Attribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Array.from(channelData, ([channel, data]) => ({ 
                      channel, 
                      revenue: data.revenue,
                      contribution: (data.revenue / kpis.totalAttributedRevenue * 100).toFixed(1)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="channel" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => 
                        name === 'revenue' ? [`$${value.toLocaleString()}`, 'Revenue'] : [`${value}%`, 'Contribution']
                      } />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Spend vs Revenue Correlation */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Spend vs Revenue Correlation</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={processedData}>
                  <CartesianGrid />
                  <XAxis dataKey="total_spend" name="Spend" />
                  <YAxis dataKey="total_revenue" name="Revenue" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                    formatter={(value, name) => [`$${value.toLocaleString()}`, name]} />
                  <Scatter name="Daily Performance" data={processedData} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-600">💡 Key Insights</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Increase Google budget allocation by 15-20% given superior ROAS performance
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">✓</span>
                    Implement dayparting to reduce weekend spend and reallocate to weekdays
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">✓</span>
                    Test TikTok creative refresh - lowest ROAS may indicate ad fatigue
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">✓</span>
                    Set up automated budget scaling based on efficiency score thresholds
                  </li>
                </ul>
              </div>
            </div>

            {/* Performance Benchmarks */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Benchmarks</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-green-600">4.2x</div>
                  <div className="text-sm text-gray-600">Target ROAS</div>
                  <div className="text-xs text-gray-500">Industry Benchmark</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-blue-600">1.8%</div>
                  <div className="text-sm text-gray-600">Target CTR</div>
                  <div className="text-xs text-gray-500">Industry Benchmark</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-purple-600">$35</div>
                  <div className="text-sm text-gray-600">Target CAC</div>
                  <div className="text-xs text-gray-500">Industry Benchmark</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
                   