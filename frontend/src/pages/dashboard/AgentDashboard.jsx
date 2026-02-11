import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiPlusCircle,
  FiActivity,
  FiGrid
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Card from "../../components/common/Card";
import Loading from "../../components/common/Loading";
import agentService from "../../services/agentService";
import { useToast } from "../../components/ui/toast";

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalStudents: 0,
      totalApplications: 0,
      totalEarnings: 0,
      pendingApplications: 0
    },
    recentStudents: [],
    recentApplications: [],
    stageBreakdown: {}
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await agentService.getDashboardStats();
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      showError("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  const statusDistributionData = Object.entries(data.stageBreakdown || {}).map(([name, value]) => ({
    name,
    value,
    color: name === 'Pre-Payment' ? '#3b82f6' : name === 'Submission' ? '#f59e0b' : name === 'Admission' ? '#8b5cf6' : '#22c55e'
  }));

  const applicationTrendData = [
    { name: "Jan", applications: 0 },
    { name: "Feb", applications: 0 },
    { name: "Mar", applications: 0 },
    { name: "Apr", applications: 0 },
    { name: "May", applications: 0 },
    { name: "Jun", applications: 0 },
  ];

  const StatCard = ({ icon: Icon, label, value, color, trend, link }) => (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {trend && (
            <p className="text-sm text-green-600 mt-1">
              <FiTrendingUp className="inline mr-1" size={14} />
              {trend}
            </p>
          )}
        </div>
        <div
          className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center`}
        >
          <Icon size={24} className="text-white" />
        </div>
      </div>
      {link && (
        <Link
          to={link}
          className="text-primary-600 text-sm mt-3 inline-block hover:underline"
        >
          View Details →
        </Link>
      )}
    </Card>
  );

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/students/create')}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiPlusCircle /> Add Student
          </button>
          <button
            onClick={() => navigate('/pending-applications')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FiActivity /> Apply Now
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiFileText}
          label="Total Applications"
          value={data.stats.totalApplications || 0}
          color="bg-primary-500"
          link="/applied-students"
        />
        <StatCard
          icon={FiUsers}
          label="Active Students"
          value={data.stats.totalStudents || 0}
          color="bg-secondary-500"
          link="/students"
        />
        <StatCard
          icon={FiDollarSign}
          label="Total Earnings"
          value={`$${(data.stats.totalEarnings || 0).toLocaleString()}`}
          color="bg-accent-500"
        />
        <StatCard
          icon={FiClock}
          label="Pending Apps"
          value={data.stats.pendingApplications || 0}
          color="bg-amber-500"
          link="/pending-applications"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Trend */}
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">Applications Trend</h3>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={applicationTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="applications" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>

        {/* Application Status Distribution */}
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">
              Application Stages
            </h3>
          </Card.Header>
          <Card.Body>
            {statusDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 italic">
                No application data available
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card className="p-0 overflow-hidden">
        <Card.Header className="flex justify-between items-center py-4 px-6">
          <h3 className="font-semibold text-gray-900">Recent Applications</h3>
          <Link to="/applied-students" className="text-primary-600 text-sm hover:underline">
            View All
          </Link>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Program</th>
                  <th>University</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentApplications.length > 0 ? (
                  data.recentApplications.map((app) => (
                    <tr key={app._id}>
                      <td>{app.studentId?.firstName} {app.studentId?.lastName}</td>
                      <td>{app.programSnapshot?.programName}</td>
                      <td>{app.programSnapshot?.universityName}</td>
                      <td>
                        <span className={`badge ${app.stage === 'Arrival' ? 'badge-success' :
                            app.stage === 'Admission' ? 'badge-primary' :
                              'badge-warning'
                          }`}>
                          {app.stage}
                        </span>
                      </td>
                      <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      No recent applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AgentDashboard;
