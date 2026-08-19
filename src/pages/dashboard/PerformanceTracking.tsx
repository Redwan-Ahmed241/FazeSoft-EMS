import { useState } from 'react';
import { TrendingUp, TrendingDown, Target, Award, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const performanceData = [
  {
    id: 1,
    employeeName: 'Samuel Wilson',
    employeeId: 'EMP001',
    avatar: '/api/placeholder/48/48',
    department: 'Engineering',
    role: 'Senior Software Engineer',
    currentScore: 4.8,
    previousScore: 4.6,
    goals: [
      { id: 1, title: 'Complete React Migration', progress: 85, status: 'in_progress', deadline: '2024-04-15' },
      { id: 2, title: 'Mentor Junior Developers', progress: 70, status: 'in_progress', deadline: '2024-03-30' },
      { id: 3, title: 'Improve Code Coverage', progress: 100, status: 'completed', deadline: '2024-03-15' }
    ],
    achievements: [
      'Best Performer Q1 2024',
      'Technical Excellence Award',
      'Team Leadership Recognition'
    ],
    skills: [
      { name: 'React', level: 95 },
      { name: 'TypeScript', level: 90 },
      { name: 'Leadership', level: 85 },
      { name: 'Problem Solving', level: 92 }
    ]
  },
  {
    id: 2,
    employeeName: 'Michael Chen',
    employeeId: 'EMP002',
    avatar: '/api/placeholder/48/48',
    department: 'Engineering',
    role: 'Frontend Developer',
    currentScore: 4.6,
    previousScore: 4.3,
    goals: [
      { id: 1, title: 'Learn Advanced React Patterns', progress: 60, status: 'in_progress', deadline: '2024-04-30' },
      { id: 2, title: 'Optimize Application Performance', progress: 45, status: 'in_progress', deadline: '2024-05-15' },
      { id: 3, title: 'Complete Accessibility Training', progress: 100, status: 'completed', deadline: '2024-03-01' }
    ],
    achievements: [
      'Rising Star Award',
      'Innovation Champion'
    ],
    skills: [
      { name: 'JavaScript', level: 88 },
      { name: 'CSS', level: 85 },
      { name: 'Vue.js', level: 75 },
      { name: 'Design Systems', level: 80 }
    ]
  },
  {
    id: 3,
    employeeName: 'Eric Rodriguez',
    employeeId: 'EMP003',
    avatar: '/api/placeholder/48/48',
    department: 'Marketing',
    role: 'Marketing Manager',
    currentScore: 4.9,
    previousScore: 4.7,
    goals: [
      { id: 1, title: 'Increase Brand Awareness', progress: 75, status: 'in_progress', deadline: '2024-06-30' },
      { id: 2, title: 'Launch Product Campaign', progress: 90, status: 'in_progress', deadline: '2024-04-01' },
      { id: 3, title: 'Team Skill Development', progress: 65, status: 'in_progress', deadline: '2024-05-30' }
    ],
    achievements: [
      'Marketing Excellence Award',
      'Campaign Success Recognition',
      'Team Builder Award'
    ],
    skills: [
      { name: 'Digital Marketing', level: 95 },
      { name: 'Analytics', level: 88 },
      { name: 'Content Strategy', level: 92 },
      { name: 'Team Management', level: 90 }
    ]
  }
];

const departments = ['All', 'Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];
const quarters = ['Q1 2024', 'Q4 2023', 'Q3 2023', 'Q2 2023'];

export function PerformanceTracking() {
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedQuarter, setSelectedQuarter] = useState('Q1 2024');
  const [activeTab, setActiveTab] = useState('overview');

  const filteredData = performanceData.filter(employee => 
    selectedDepartment === 'All' || employee.department === selectedDepartment
  );

  const getScoreTrend = (current: number, previous: number) => {
    if (current > previous) {
      return { trend: 'up', color: 'text-green-600', icon: TrendingUp };
    } else if (current < previous) {
      return { trend: 'down', color: 'text-red-600', icon: TrendingDown };
    } else {
      return { trend: 'stable', color: 'text-gray-600', icon: TrendingUp };
    }
  };

  const getGoalStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-50 text-green-700">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-50 text-blue-700">In Progress</Badge>;
      case 'overdue':
        return <Badge className="bg-red-50 text-red-700">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Performance Tracking</h1>
          <p className="text-gray-600 mt-1">Monitor and manage employee performance and goals</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-gray-200">
            <Calendar className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-gray-200">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-gray-200">
                <SelectValue placeholder="Quarter" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map(quarter => (
                  <SelectItem key={quarter} value={quarter}>{quarter}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-semibold text-gray-900">4.7</p>
                <p className="text-sm text-green-600">+0.2 from last quarter</p>
              </div>
              <Award className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Goals Completed</p>
                <p className="text-2xl font-semibold text-gray-900">156</p>
                <p className="text-sm text-green-600">+23 this quarter</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Performers</p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
                <p className="text-sm text-gray-600">Score &gt; 4.5</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reviews Due</p>
                <p className="text-2xl font-semibold text-gray-900">8</p>
                <p className="text-sm text-orange-600">This month</p>
              </div>
              <User className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Cards */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals & Objectives</TabsTrigger>
          <TabsTrigger value="skills">Skills Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredData.map((employee) => {
              const trendData = getScoreTrend(employee.currentScore, employee.previousScore);
              const TrendIcon = trendData.icon;
              
              return (
                <Card key={employee.id} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={employee.avatar} alt={employee.employeeName} />
                        <AvatarFallback>
                          {employee.employeeName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{employee.employeeName}</h3>
                        <p className="text-sm text-gray-600">{employee.role}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {employee.department}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Performance Score</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-semibold text-gray-900">
                            {employee.currentScore}
                          </span>
                          <div className={`flex items-center ${trendData.color}`}>
                            <TrendIcon className="h-4 w-4" />
                            <span className="text-sm ml-1">
                              {Math.abs(employee.currentScore - employee.previousScore).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`h-5 w-5 ${
                                star <= employee.currentScore
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">out of 5.0</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Recent Achievements</p>
                      <div className="space-y-1">
                        {employee.achievements.slice(0, 2).map((achievement, index) => (
                          <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                            {achievement}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Goal Progress</p>
                      <div className="space-y-2">
                        {employee.goals.slice(0, 2).map((goal) => (
                          <div key={goal.id}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-700">{goal.title}</span>
                              <span className="text-gray-500">{goal.progress}%</span>
                            </div>
                            <Progress value={goal.progress} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          {filteredData.map((employee) => (
            <Card key={employee.id} className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={employee.avatar} alt={employee.employeeName} />
                    <AvatarFallback>
                      {employee.employeeName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">{employee.employeeName}</h3>
                    <p className="text-sm text-gray-600">{employee.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employee.goals.map((goal) => (
                    <div key={goal.id} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{goal.title}</h4>
                          <p className="text-sm text-gray-600">Due: {new Date(goal.deadline).toLocaleDateString()}</p>
                        </div>
                        {getGoalStatusBadge(goal.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          {filteredData.map((employee) => (
            <Card key={employee.id} className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={employee.avatar} alt={employee.employeeName} />
                    <AvatarFallback>
                      {employee.employeeName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">{employee.employeeName}</h3>
                    <p className="text-sm text-gray-600">{employee.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.skills.map((skill, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-900">{skill.name}</span>
                        <span className="text-gray-600">{skill.level}%</span>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}