import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import {
  Activity,
  Users,
  Droplets,
  AlertTriangle,
  Package,
  Calendar,
  Clock,
  TrendingUp,
  Heart,
  Building2,
  TestTube,
  Eye
} from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Total Blood Units",
      value: "1,247",
      change: "+12%",
      changeType: "positive",
      icon: Droplets,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Registered Donors",
      value: "2,384",
      change: "+5%",
      changeType: "positive",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Requests",
      value: "23",
      change: "-8%",
      changeType: "negative",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Expiring Soon",
      value: "45",
      change: "+3",
      changeType: "warning",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const bloodGroups = [
    { type: "A+", units: 187, percentage: 85, status: "good" },
    { type: "A-", units: 45, percentage: 65, status: "low" },
    { type: "B+", units: 234, percentage: 90, status: "good" },
    { type: "B-", units: 23, percentage: 45, status: "critical" },
    { type: "AB+", units: 67, percentage: 75, status: "good" },
    { type: "AB-", units: 12, percentage: 30, status: "critical" },
    { type: "O+", units: 456, percentage: 95, status: "excellent" },
    { type: "O-", units: 89, percentage: 55, status: "low" },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "donation",
      message: "New donation from SCEK25-D234 (A+ blood)",
      time: "2 minutes ago",
      icon: Heart,
      color: "text-green-600",
    },
    {
      id: 2,
      type: "request",
      message: "City Hospital requested 3 units of O- blood",
      time: "15 minutes ago",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      id: 3,
      type: "test",
      message: "Lab test completed for donor SCEK25-D198",
      time: "1 hour ago",
      icon: TestTube,
      color: "text-purple-600",
    },
    {
      id: 4,
      type: "expiry",
      message: "5 units of AB+ blood expiring in 2 days",
      time: "2 hours ago",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "excellent":
        return "bg-green-500";
      case "good":
        return "bg-blue-500";
      case "low":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in flex-1 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your blood bank overview</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            View Schedule
          </Button>
          <Button className="bg-red-500 hover:bg-red-600 text-white">
            <Activity className="mr-2 h-4 w-4" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge
                      variant={stat.changeType === "positive" ? "default" : stat.changeType === "warning" ? "outline" : "secondary"}
                      className={`text-xs ${stat.changeType === "positive" ? "bg-green-100 text-green-800" : 
                                            stat.changeType === "warning" ? "bg-orange-100 text-orange-800" : 
                                            "bg-red-100 text-red-800"}`}
                    >
                      {stat.change}
                    </Badge>
                    <span className="text-xs text-muted-foreground">from last month</span>
                  </div>
                </div>
                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-full`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Blood Inventory */}
        <Card className="lg:col-span-2 border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Package className="h-5 w-5 text-red-500" />
              Blood Inventory by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bloodGroups.map((group) => (
              <div key={group.type} className="flex items-center gap-4">
                <div className="w-12">
                  <Badge
                    variant="outline"
                    className={`w-full justify-center font-semibold ${
                      group.type.includes("A") ? "blood-type-a" :
                      group.type.includes("B") ? "blood-type-b" :
                      group.type.includes("AB") ? "blood-type-ab" :
                      "blood-type-o"
                    }`}
                  >
                    {group.type}
                  </Badge>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{group.units} units</span>
                    <span className="text-muted-foreground">{group.percentage}%</span>
                  </div>
                  <Progress value={group.percentage} className="h-2" />
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(group.status)}`} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Activity className="h-5 w-5 text-red-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className={`${activity.color} bg-muted p-2 rounded-full`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">
              <Eye className="mr-2 h-4 w-4" />
              View All Activities
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-gray-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300">
              <Users className="h-6 w-6 text-blue-500" />
              Register Donor
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300">
              <TestTube className="h-6 w-6 text-purple-500" />
              Lab Entry
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300">
              <Building2 className="h-6 w-6 text-blue-500" />
              Hospital Request
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300">
              <Package className="h-6 w-6 text-green-500" />
              Check Inventory
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}