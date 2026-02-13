"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users as UsersIcon,
  LayoutGrid,
  List,
  Search,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Lock,
  User as UserIcon,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteConfirmation } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { usersAPI } from "@/lib/api";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";
import type { User, UserRole } from "@/types";

// Extended user with stats for display
interface UserWithStats extends User {
  applicationCount?: number;
  resumeCount?: number;
  templateCount?: number;
  lastLogin?: string;
}

// Role configuration with lowercase keys to match backend enum values
const roleConfig: Record<UserRole, { color: string; label: string; icon: typeof ShieldCheck; description: string }> = {
  super_admin: {
    color: "destructive",
    label: "Super Admin",
    icon: ShieldCheck,
    description: "Full system access",
  },
  pragya: {
    color: "info",
    label: "Pragya",
    icon: UserCheck,
    description: "Regular candidate",
  },
  aniruddh: {
    color: "warning",
    label: "Aniruddh",
    icon: UserCheck,
    description: "Regular candidate",
  },
};

export default function UsersPage() {
  // Set page title
  usePageTitle(PAGE_TITLES.USERS);

  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View/Edit user states
  const [viewingUser, setViewingUser] = useState<UserWithStats | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    email: "",
    title: "",
    role: "" as UserRole,
    is_active: true,
  });

  // Confirmation dialog for deletes
  const { confirmDelete, ConfirmDialog } = useDeleteConfirmation();

  // Form state for creating new users
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    full_name: "",
    title: "",
    password: "",
    confirmPassword: "",
    role: "pragya" as UserRole,
    email_account: "",
    email_password: "",
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
    is_active: true,
  });

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersAPI.list();
      const usersData = response.data?.items || response.data || [];
      setUsers(usersData);
    } catch (err: any) {
      console.error("❌ [Users] Error fetching users:", err);
      setError(err.response?.data?.detail || "Failed to load users");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const handleCreate = async () => {
    // Validate form
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await usersAPI.create({
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        title: newUser.title || undefined,
        password: newUser.password,
        role: newUser.role,
        email_account: newUser.email_account || undefined,
        email_password: newUser.email_password || undefined,
        smtp_host: newUser.smtp_host || undefined,
        smtp_port: newUser.smtp_port || undefined,
        is_active: newUser.is_active,
      });
      toast.success("User created successfully!", {
        style: {
          border: "1px solid #22c55e",
          background: "#064e3b",
          color: "#dcfce7",
        },
      });
      setCreateOpen(false);
      // Reset form
      setNewUser({
        username: "",
        email: "",
        full_name: "",
        title: "",
        password: "",
        confirmPassword: "",
        role: "pragya",
        email_account: "",
        email_password: "",
        smtp_host: "smtp.gmail.com",
        smtp_port: 587,
        is_active: true,
      });
      // Refresh users list
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error("❌ [Users] Error creating user:", err);
      toast.error(error.response?.data?.detail || "Failed to create user");
    }
  };

  const handleDeactivate = async (userId: number, name: string) => {
    try {
      await usersAPI.update(userId, { is_active: false });
      toast.warning(`Deactivated user "${name}"`, {
        style: {
          border: "1px solid #f59e0b",
          background: "#78350f",
          color: "#fed7aa",
        },
      });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to deactivate user");
    }
  };

  const handleActivate = async (userId: number, name: string) => {
    try {
      await usersAPI.update(userId, { is_active: true });
      toast.success(`Activated user "${name}"`, {
        style: {
          border: "1px solid #22c55e",
          background: "#064e3b",
          color: "#dcfce7",
        },
      });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to activate user");
    }
  };

  const handleDelete = useCallback(async (userId: number, name: string) => {
    const confirmed = await confirmDelete(name, "user");
    if (!confirmed) {
      console.log("[Users] Delete cancelled for:", name);
      return;
    }

    try {
      console.log("[Users] Deleting user:", name, userId);
      await usersAPI.delete(userId);
      toast.error(`Deleted user "${name}"`, {
        style: {
          border: "1px solid #ef4444",
          background: "#7f1d1d",
          color: "#fee2e2",
        },
      });
      fetchUsers();
    } catch (err: any) {
      console.error("[Users] Delete failed:", err);
      toast.error(err.response?.data?.detail || "Failed to delete user");
    }
  }, [confirmDelete]);

  // Helper to safely get role config
  const getRoleConfig = (role: string) => {
    const normalizedRole = role?.toLowerCase() as UserRole;
    return roleConfig[normalizedRole] || roleConfig.pragya;
  };

  // Handle viewing a user
  const handleView = (user: UserWithStats) => {
    setViewingUser(user);
  };

  // Handle starting edit mode
  const handleStartEdit = (user: UserWithStats) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      title: user.title || "",
      role: (user.role?.toLowerCase() as UserRole) || "pragya",
      is_active: user.is_active ?? true,
    });
  };

  // Handle updating a user
  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      await usersAPI.update(editingUser.id, {
        full_name: editFormData.full_name,
        email: editFormData.email,
        title: editFormData.title || undefined,
        role: editFormData.role,
        is_active: editFormData.is_active,
      });
      toast.success(`Updated user "${editFormData.full_name}"`, {
        style: {
          border: "1px solid #22c55e",
          background: "#064e3b",
          color: "#dcfce7",
        },
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update user");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Confirmation Dialog */}
      <ConfirmDialog />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-500" />
            User Management
          </h1>
          <p className="text-slate-400 mt-1">
            Manage all users and their access (Super Admin Only)
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-red-500" />
                Create New User
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Create a new user account with custom role and permissions
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="email">Email Config</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="glass backdrop-blur-xl bg-white/5 p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        <UserIcon className="w-4 h-4 inline mr-2" />
                        Username
                      </label>
                      <Input
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="e.g., john_doe"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address
                      </label>
                      <Input
                        type="email"
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="e.g., john@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Full Name
                    </label>
                    <Input
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="e.g., John Doe"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        <Lock className="w-4 h-4 inline mr-2" />
                        Password
                      </label>
                      <Input
                        type="password"
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Enter password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        <Lock className="w-4 h-4 inline mr-2" />
                        Confirm Password
                      </label>
                      <Input
                        type="password"
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Confirm password"
                        value={newUser.confirmPassword}
                        onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Professional Title
                    </label>
                    <Input
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="e.g., Software Engineer"
                      value={newUser.title}
                      onChange={(e) => setNewUser({ ...newUser, title: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <div className="glass backdrop-blur-xl bg-white/5 p-4 rounded-lg space-y-4">
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-400 text-sm">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Configure SMTP settings for sending application emails
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Email Account (From Address)
                    </label>
                    <Input
                      type="email"
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="e.g., john@gmail.com"
                      value={newUser.email_account}
                      onChange={(e) => setNewUser({ ...newUser, email_account: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Email Password / App Password
                    </label>
                    <Input
                      type="password"
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Enter app password"
                      value={newUser.email_password}
                      onChange={(e) => setNewUser({ ...newUser, email_password: e.target.value })}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      For Gmail, use App Password (not regular password)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        SMTP Host
                      </label>
                      <Input
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="smtp.gmail.com"
                        value={newUser.smtp_host}
                        onChange={(e) => setNewUser({ ...newUser, smtp_host: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        SMTP Port
                      </label>
                      <Input
                        type="number"
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="587"
                        value={newUser.smtp_port}
                        onChange={(e) => setNewUser({ ...newUser, smtp_port: parseInt(e.target.value) || 587 })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4">
                <div className="glass backdrop-blur-xl bg-white/5 p-4 rounded-lg space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      <Shield className="w-4 h-4 inline mr-2" />
                      User Role
                    </label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-red-500" />
                            <span>Super Admin</span>
                            <span className="text-xs text-slate-400">(Full Access)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="pragya">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-blue-500" />
                            <span>Pragya</span>
                            <span className="text-xs text-slate-400">(Regular User)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="aniruddh">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-orange-500" />
                            <span>Aniruddh</span>
                            <span className="text-xs text-slate-400">(Regular User)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Role Permissions</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-white font-medium">Super Admin</p>
                          <p className="text-xs text-slate-400">
                            Full access to all users, can create/edit/delete users, view all data
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                        <UserCheck className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">Regular User (Pragya/Aniruddh)</p>
                          <p className="text-xs text-slate-400">
                            Can only view and manage their own resumes, templates, and applications
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <UserCheck className="w-5 h-5 text-green-400" />
                    <div>
                      <label className="text-white font-medium flex items-center gap-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        Account Active
                      </label>
                      <p className="text-xs text-slate-400">
                        User can login and access the system
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="border-slate-700 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-red-600 to-red-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="glass backdrop-blur-xl bg-white/5 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                className="pl-10 bg-slate-800 border-slate-700 text-white"
                placeholder="Search users by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("card")}
                className={
                  viewMode === "card"
                    ? "bg-blue-600"
                    : "border-slate-700 text-slate-400"
                }
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("table")}
                className={
                  viewMode === "table"
                    ? "bg-blue-600"
                    : "border-slate-700 text-slate-400"
                }
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass backdrop-blur-xl bg-gradient-to-br from-red-900/20 to-red-700/20 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass backdrop-blur-xl bg-gradient-to-br from-green-900/20 to-green-700/20 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.is_active).length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass backdrop-blur-xl bg-gradient-to-br from-orange-900/20 to-orange-700/20 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Admins</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.role?.toLowerCase() === "super_admin").length}
                </p>
              </div>
              <ShieldCheck className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass backdrop-blur-xl bg-gradient-to-br from-blue-900/20 to-blue-700/20 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Regular Users</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.role?.toLowerCase() !== "super_admin").length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="glass backdrop-blur-xl bg-white/5 border-slate-700">
          <CardContent className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            <p className="text-slate-400 mt-4">Loading users...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="glass backdrop-blur-xl bg-red-900/20 border-red-500/30">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={fetchUsers} variant="outline" className="border-red-500 text-red-400">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Card View */}
      {viewMode === "card" && !loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length === 0 ? (
            <Card className="col-span-full glass backdrop-blur-xl bg-white/5 border-slate-700">
              <CardContent className="p-12 text-center">
                <UsersIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No users found</p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => {
              const roleInfo = getRoleConfig(user.role);
              const RoleIcon = roleInfo.icon;
              return (
                <Card
                  key={user.id}
                  className="glass backdrop-blur-xl bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/20 hover:shadow-2xl hover:shadow-red-500/10 transition-all"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white font-bold text-2xl">
                        {user.full_name?.charAt(0) || "U"}
                      </div>
                      <Badge variant={roleInfo.color as any}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-white mt-4">{user.full_name}</CardTitle>
                    <p className="text-sm text-slate-400">@{user.username}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {user.is_active ? (
                        <Badge variant="success">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-400 border-red-400">
                          <UserX className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-white text-xs">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Applications:</span>
                        <span className="text-white">{user.applicationCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Resumes:</span>
                        <span className="text-white">{user.resumeCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Templates:</span>
                        <span className="text-white">{user.templateCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Created:</span>
                        <span className="text-white text-xs">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-slate-700">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                        onClick={() => handleView(user)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                        onClick={() => handleStartEdit(user)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      {user.is_active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-orange-700 text-orange-400 hover:bg-orange-900/20"
                          onClick={() => handleDeactivate(user.id, user.full_name)}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleActivate(user.id, user.full_name)}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Activate
                        </Button>
                      )}
                      {user.role?.toLowerCase() !== "super_admin" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-700 text-red-400 hover:bg-red-900/20"
                          onClick={() => handleDelete(user.id, user.full_name)}
                          aria-label={`Delete ${user.full_name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && !loading && !error && (
        <Card className="glass backdrop-blur-xl bg-white/5 border-slate-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="text-left p-4 text-white font-medium">User</th>
                    <th className="text-left p-4 text-white font-medium">Email</th>
                    <th className="text-left p-4 text-white font-medium">Role</th>
                    <th className="text-left p-4 text-white font-medium">Status</th>
                    <th className="text-left p-4 text-white font-medium">Stats</th>
                    <th className="text-left p-4 text-white font-medium">Created</th>
                    <th className="text-left p-4 text-white font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const roleInfo = getRoleConfig(user.role);
                      const RoleIcon = roleInfo.icon;
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white font-bold">
                                {user.full_name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <p className="text-white font-medium">{user.full_name}</p>
                                <p className="text-slate-400 text-xs">@{user.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-300 text-sm">{user.email}</td>
                          <td className="p-4">
                            <Badge variant={roleInfo.color as any}>
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {roleInfo.label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {user.is_active ? (
                              <Badge variant="success">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-400 border-red-400">
                                <UserX className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="text-xs text-slate-300">
                              <p>{user.applicationCount || 0} apps</p>
                              <p>{user.resumeCount || 0} resumes</p>
                              <p>{user.templateCount || 0} templates</p>
                            </div>
                          </td>
                          <td className="p-4 text-slate-300 text-sm">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2" role="group" aria-label={`Actions for ${user.full_name}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-400 hover:text-blue-300"
                                onClick={() => handleView(user)}
                                aria-label={`View details for ${user.full_name}`}
                              >
                                <Eye className="w-4 h-4" aria-hidden="true" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-400 hover:text-slate-300"
                                onClick={() => handleStartEdit(user)}
                                aria-label={`Edit ${user.full_name}`}
                              >
                                <Edit className="w-4 h-4" aria-hidden="true" />
                              </Button>
                              {user.role?.toLowerCase() !== "super_admin" && (
                                <>
                                  {user.is_active ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-orange-400 hover:text-orange-300"
                                      onClick={() => handleDeactivate(user.id, user.full_name)}
                                      aria-label={`Deactivate ${user.full_name}`}
                                    >
                                      <UserX className="w-4 h-4" aria-hidden="true" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-green-400 hover:text-green-300"
                                      onClick={() => handleActivate(user.id, user.full_name)}
                                      aria-label={`Activate ${user.full_name}`}
                                    >
                                      <UserCheck className="w-4 h-4" aria-hidden="true" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300"
                                    onClick={() => handleDelete(user.id, user.full_name)}
                                    aria-label={`Delete ${user.full_name}`}
                                  >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View User Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                {viewingUser?.full_name?.charAt(0) || "U"}
              </div>
              {viewingUser?.full_name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              User details and statistics
            </DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-slate-400">Username</span>
                  <p className="text-white">@{viewingUser.username}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-slate-400">Email</span>
                  <p className="text-blue-400">{viewingUser.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-slate-400">Role</span>
                  <Badge variant={getRoleConfig(viewingUser.role).color as any}>
                    {getRoleConfig(viewingUser.role).label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-slate-400">Status</span>
                  <Badge variant={viewingUser.is_active ? "success" : "outline"}>
                    {viewingUser.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-slate-400">Title</span>
                  <p className="text-white">{viewingUser.title || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-slate-400">Created</span>
                  <p className="text-white">
                    {viewingUser.created_at
                      ? new Date(viewingUser.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-sm text-slate-400 mb-2">Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-400">{viewingUser.applicationCount || 0}</p>
                    <p className="text-xs text-slate-400">Applications</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-400">{viewingUser.resumeCount || 0}</p>
                    <p className="text-xs text-slate-400">Resumes</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-400">{viewingUser.templateCount || 0}</p>
                    <p className="text-xs text-slate-400">Templates</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingUser(null)} className="border-slate-700">
              Close
            </Button>
            <Button onClick={() => { if(viewingUser) { handleStartEdit(viewingUser); setViewingUser(null); } }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Edit User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update user information for {editingUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Full Name</label>
              <Input
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email</label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Title</label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="e.g., Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Role</label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value as UserRole })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pragya">Pragya</SelectItem>
                  <SelectItem value="aniruddh">Aniruddh</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editFormData.is_active}
                onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700"
              />
              <label htmlFor="is_active" className="text-sm text-white">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
