import { useState } from 'react';
import { Search, Filter, Plus, Mail, Phone, MapPin, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';

const employees = [
  {
    id: 1,
    name: 'Samuel Wilson',
    email: 'samuel.wilson@company.com',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    role: 'Senior Software Engineer',
    location: 'New York, NY',
    avatar: '/api/placeholder/48/48',
    status: 'active',
    performanceScore: 4.8,
    joinDate: '2021-03-15',
    manager: 'John Smith'
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    phone: '+1 (555) 234-5678',
    department: 'Engineering',
    role: 'Frontend Developer',
    location: 'San Francisco, CA',
    avatar: '/api/placeholder/48/48',
    status: 'active',
    performanceScore: 4.6,
    joinDate: '2022-01-10',
    manager: 'John Smith'
  },
  {
    id: 3,
    name: 'Eric Rodriguez',
    email: 'eric.rodriguez@company.com',
    phone: '+1 (555) 345-6789',
    department: 'Marketing',
    role: 'Marketing Manager',
    location: 'Austin, TX',
    avatar: '/api/placeholder/48/48',
    status: 'active',
    performanceScore: 4.9,
    joinDate: '2020-08-22',
    manager: 'Brian Johnson'
  },
  {
    id: 4,
    name: 'David Thompson',
    email: 'david.thompson@company.com',
    phone: '+1 (555) 456-7890',
    department: 'Sales',
    role: 'Sales Representative',
    location: 'Chicago, IL',
    avatar: '/api/placeholder/48/48',
    status: 'on_leave',
    performanceScore: 4.3,
    joinDate: '2021-11-05',
    manager: 'Mark Davis'
  },
  {
    id: 5,
    name: 'Jason Park',
    email: 'jason.park@company.com',
    phone: '+1 (555) 567-8901',
    department: 'HR',
    role: 'HR Specialist',
    location: 'Los Angeles, CA',
    avatar: '/api/placeholder/48/48',
    status: 'active',
    performanceScore: 4.7,
    joinDate: '2022-04-18',
    manager: 'Andrew Wilson'
  },
  {
    id: 6,
    name: 'Robert Kim',
    email: 'robert.kim@company.com',
    phone: '+1 (555) 678-9012',
    department: 'Finance',
    role: 'Financial Analyst',
    location: 'Boston, MA',
    avatar: '/api/placeholder/48/48',
    status: 'active',
    performanceScore: 4.4,
    joinDate: '2021-07-12',
    manager: 'Carlos Martinez'
  }
];

const departments = ['All', 'Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];
const statuses = ['All', 'active', 'on_leave', 'inactive'];

export function EmployeeDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'All' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || employee.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Employee Directory</h1>
          <p className="text-gray-600 mt-1">Manage and view all employee information</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white border-gray-200"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-gray-200">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status === 'All' ? 'All Status' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.role}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedEmployee(employee)}>
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit Employee</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {employee.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  {employee.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {employee.location}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {employee.department}
                </Badge>
                <Badge 
                  variant={employee.status === 'active' ? 'default' : 'secondary'}
                  className={employee.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}
                >
                  {employee.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employee Profile Modal */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedEmployee.avatar} alt={selectedEmployee.name} />
                  <AvatarFallback className="text-lg">
                    {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedEmployee.name}</h2>
                  <p className="text-lg text-gray-600">{selectedEmployee.role}</p>
                  <p className="text-sm text-gray-500">{selectedEmployee.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedEmployee.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Work Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Manager</p>
                      <p className="text-sm font-medium">{selectedEmployee.manager}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Join Date</p>
                      <p className="text-sm font-medium">{new Date(selectedEmployee.joinDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Performance Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`h-4 w-4 ${
                                star <= selectedEmployee.performanceScore
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </div>
                          ))}
                        </div>
                        <span className="text-sm font-medium">{selectedEmployee.performanceScore}/5.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}