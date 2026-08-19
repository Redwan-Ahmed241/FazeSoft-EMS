import { useState } from 'react';
import { Calendar, Clock, Check, X, Plus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

const leaveRequests = [
  {
    id: 1,
    employeeName: 'Samuel Wilson',
    employeeId: 'EMP001',
    avatar: '/api/placeholder/40/40',
    leaveType: 'Annual Leave',
    startDate: '2024-03-25',
    endDate: '2024-03-29',
    duration: '5 days',
    reason: 'Family vacation',
    status: 'pending',
    appliedDate: '2024-03-10',
    manager: 'John Smith'
  },
  {
    id: 2,
    employeeName: 'Michael Chen',
    employeeId: 'EMP002',
    avatar: '/api/placeholder/40/40',
    leaveType: 'Sick Leave',
    startDate: '2024-03-18',
    endDate: '2024-03-20',
    duration: '3 days',
    reason: 'Medical procedure',
    status: 'approved',
    appliedDate: '2024-03-15',
    manager: 'John Smith'
  },
  {
    id: 3,
    employeeName: 'Eric Rodriguez',
    employeeId: 'EMP003',
    avatar: '/api/placeholder/40/40',
    leaveType: 'Personal Leave',
    startDate: '2024-04-01',
    endDate: '2024-04-02',
    duration: '2 days',
    reason: 'Personal matter',
    status: 'rejected',
    appliedDate: '2024-03-12',
    manager: 'Brian Johnson'
  }
];

const myLeaves = [
  {
    id: 1,
    leaveType: 'Annual Leave',
    startDate: '2024-02-15',
    endDate: '2024-02-16',
    duration: '2 days',
    reason: 'Personal time off',
    status: 'approved',
    appliedDate: '2024-02-01'
  },
  {
    id: 2,
    leaveType: 'Sick Leave',
    startDate: '2024-01-10',
    endDate: '2024-01-10',
    duration: '1 day',
    reason: 'Flu symptoms',
    status: 'approved',
    appliedDate: '2024-01-09'
  }
];

const leaveTypes = ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity Leave', 'Emergency Leave'];

export function LeaveManagement() {
  const [activeTab, setActiveTab] = useState('requests');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleApproveLeave = (id: number) => {
    console.log('Approving leave request:', id);
  };

  const handleRejectLeave = (id: number) => {
    console.log('Rejecting leave request:', id);
  };

  const handleSubmitLeave = () => {
    console.log('Submitting leave request:', leaveForm);
    setShowApplyForm(false);
    setLeaveForm({ leaveType: '', startDate: '', endDate: '', reason: '' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-50 text-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-50 text-red-700">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Manage leave requests and approvals</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowApplyForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Apply for Leave
        </Button>
      </div>

      {/* Leave Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-900">8</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Today</p>
                <p className="text-2xl font-semibold text-gray-900">5</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Leave Today</p>
                <p className="text-2xl font-semibold text-gray-900">23</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-semibold text-gray-900">18</p>
                <p className="text-xs text-gray-500">days remaining</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Pending Requests</TabsTrigger>
          <TabsTrigger value="history">My Leave History</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests
                  .filter(request => request.status === 'pending')
                  .map((request) => (
                    <div key={request.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.avatar} alt={request.employeeName} />
                            <AvatarFallback>
                              {request.employeeName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-gray-900">{request.employeeName}</h4>
                            <p className="text-sm text-gray-600">{request.employeeId}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveLeave(request.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleRejectLeave(request.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Leave Type</p>
                          <p className="font-medium">{request.leaveType}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Duration</p>
                          <p className="font-medium">{request.duration}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Start Date</p>
                          <p className="font-medium">{new Date(request.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">End Date</p>
                          <p className="font-medium">{new Date(request.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-gray-600 text-sm">Reason</p>
                        <p className="text-gray-900">{request.reason}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* All Requests */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>All Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.avatar} alt={request.employeeName} />
                          <AvatarFallback>
                            {request.employeeName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900">{request.employeeName}</h4>
                          <p className="text-sm text-gray-600">{request.leaveType}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Duration</p>
                        <p className="font-medium">{request.duration}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Start Date</p>
                        <p className="font-medium">{new Date(request.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">End Date</p>
                        <p className="font-medium">{new Date(request.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Applied</p>
                        <p className="font-medium">{new Date(request.appliedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>My Leave History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myLeaves.map((leave) => (
                  <div key={leave.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{leave.leaveType}</h4>
                        <p className="text-sm text-gray-600">{leave.reason}</p>
                      </div>
                      {getStatusBadge(leave.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Duration</p>
                        <p className="font-medium">{leave.duration}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Start Date</p>
                        <p className="font-medium">{new Date(leave.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">End Date</p>
                        <p className="font-medium">{new Date(leave.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Applied</p>
                        <p className="font-medium">{new Date(leave.appliedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply Leave Modal */}
      <Dialog open={showApplyForm} onOpenChange={setShowApplyForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select 
                value={leaveForm.leaveType} 
                onValueChange={(value) => setLeaveForm(prev => ({ ...prev, leaveType: value }))}
              >
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-white border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white border-gray-200"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for your leave..."
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                className="bg-white border-gray-200"
                rows={3}
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleSubmitLeave}
              >
                Submit Request
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-gray-200"
                onClick={() => setShowApplyForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}