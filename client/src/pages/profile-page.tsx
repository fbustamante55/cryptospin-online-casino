import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { phoneVerificationSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { UserDropdown } from "@/components/ui/user-dropdown";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Mail, Phone, Shield, User, Lock, Upload, Coins } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Define zod schemas for form validation
const phoneVerificationFormSchema = phoneVerificationSchema;
type PhoneVerificationFormData = z.infer<typeof phoneVerificationFormSchema>;

const profileUpdateSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});
type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8, "Password must be at least 8 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

const walletAddressSchema = z.object({
  currency: z.string(),
  address: z.string().min(10, "Wallet address must be at least 10 characters"),
});
type WalletAddressFormData = z.infer<typeof walletAddressSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPhoneVerificationDialog, setShowPhoneVerificationDialog] = useState(false);
  const [isSubmittingPhone, setIsSubmittingPhone] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false);
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);
  const [showSetup2FADialog, setShowSetup2FADialog] = useState(false);
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [showKYCDialog, setShowKYCDialog] = useState(false);
  const [isUploadingKYC, setIsUploadingKYC] = useState(false);
  const [showAddWalletDialog, setShowAddWalletDialog] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  
  // Phone verification form
  const phoneVerificationForm = useForm<PhoneVerificationFormData>({
    resolver: zodResolver(phoneVerificationFormSchema),
    defaultValues: {
      phoneNumber: user?.phoneNumber || "",
      verificationCode: "",
    },
  });

  // Profile update form
  const profileUpdateForm = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      zipCode: user?.zipCode || "",
    },
  });

  // Password change form
  const passwordChangeForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Wallet address form
  const walletAddressForm = useForm<WalletAddressFormData>({
    resolver: zodResolver(walletAddressSchema),
    defaultValues: {
      currency: "BTC",
      address: "",
    },
  });

  const submitPhoneNumber = async (phoneNumber: string) => {
    setIsSubmittingPhone(true);
    try {
      await apiRequest({
        method: "POST",
        url: "/api/send-phone-verification",
        data: { phoneNumber }
      });
      setPhoneVerificationSent(true);
      toast({
        title: "Verification code sent",
        description: "A verification code has been sent to your phone.",
      });
    } catch (error) {
      toast({
        title: "Failed to send verification code",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingPhone(false);
    }
  };
  
  const verifyPhoneNumber = async (data: PhoneVerificationFormData) => {
    if (!phoneVerificationSent) {
      await submitPhoneNumber(data.phoneNumber);
      return;
    }
    
    setIsVerifyingPhone(true);
    try {
      await apiRequest({
        method: "POST",
        url: "/api/verify-phone",
        data: { 
          phoneNumber: data.phoneNumber,
          code: data.verificationCode
        }
      });
      
      toast({
        title: "Phone verified",
        description: "Your phone number has been successfully verified.",
      });
      
      // Close dialog and reset state
      setShowPhoneVerificationDialog(false);
      setPhoneVerificationSent(false);
      phoneVerificationForm.reset();
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const updateProfile = async (data: ProfileUpdateFormData) => {
    setIsSubmittingProfile(true);
    try {
      await apiRequest({
        method: "PATCH",
        url: "/api/user/profile",
        data
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const changePassword = async (data: PasswordChangeFormData) => {
    setIsChangingPassword(true);
    try {
      await apiRequest({
        method: "POST",
        url: "/api/user/change-password",
        data: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }
      });
      
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      
      // Close dialog and reset form
      setShowPasswordChangeDialog(false);
      passwordChangeForm.reset();
    } catch (error) {
      toast({
        title: "Password change failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const addWalletAddress = async (data: WalletAddressFormData) => {
    setIsAddingWallet(true);
    try {
      await apiRequest({
        method: "POST",
        url: "/api/user/wallet",
        data
      });
      
      toast({
        title: "Wallet address added",
        description: `Your ${data.currency} wallet address has been added successfully.`,
      });
      
      // Close dialog and reset form
      setShowAddWalletDialog(false);
      walletAddressForm.reset();
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      toast({
        title: "Failed to add wallet address",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsAddingWallet(false);
    }
  };

  const submitKYC = async () => {
    setIsUploadingKYC(true);
    try {
      // In a real app, this would upload the KYC documents
      await apiRequest({
        method: "POST",
        url: "/api/user/kyc",
        data: {
          documentType: "id",
          status: "pending",
        }
      });
      
      toast({
        title: "KYC submitted",
        description: "Your KYC documents have been submitted successfully. We will review them shortly.",
      });
      
      setShowKYCDialog(false);
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      toast({
        title: "KYC submission failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUploadingKYC(false);
    }
  };

  const setup2FA = async (code: string) => {
    try {
      await apiRequest({
        method: "POST",
        url: "/api/user/2fa/enable",
        data: { code }
      });
      
      toast({
        title: "2FA enabled",
        description: "Two-factor authentication has been enabled for your account.",
      });
      
      setShowSetup2FADialog(false);
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      toast({
        title: "Failed to enable 2FA",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const disable2FA = async (code: string) => {
    try {
      await apiRequest({
        method: "POST",
        url: "/api/user/2fa/disable",
        data: { code }
      });
      
      toast({
        title: "2FA disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
      
      setShowDisable2FADialog(false);
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      toast({
        title: "Failed to disable 2FA",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0e1824] text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#0e1824] border-b border-[#1c2b3a] sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center md:hidden">
              <button type="button" className="text-gray-400 hover:text-white focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="font-heading font-bold text-xl text-white tracking-wider ml-3">
                <span className="text-[#09b66d]">Crypto</span>Spin
              </h1>
            </div>
            
            <div className="md:flex flex-1 px-4 justify-center">
              <h1 className="text-xl font-heading font-bold">My Profile</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1.5 rounded-md bg-[#192531] border border-[#1c2b3a] flex items-center">
                <Coins className="h-4 w-4 mr-1.5 text-[#F9C846]" />
                <span className="text-sm font-semibold">{user?.balance}</span>
              </div>
              
              {/* User Dropdown Menu */}
              <UserDropdown />
              
              {/* Notification Dropdown */}
              <NotificationDropdown />
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-[#1A2634] rounded-xl border border-gray-800">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 rounded-xl border-4 border-[#09b66d]/10">
                    {user?.profileImage ? (
                      <AvatarImage src={user.profileImage} />
                    ) : null}
                    <AvatarFallback className="bg-[#0e1824] text-[#09b66d]">
                      {user?.username ? user.username.substring(0, 2).toUpperCase() : "CS"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-[#09b66d] rounded-full p-1.5">
                    <User className="h-4 w-4 text-[#0e1824]" />
                  </div>
                </div>
                
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl font-bold">{user?.username}</h2>
                  <div className="mt-1 text-gray-400">{user?.email}</div>
                  
                  <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                    <Badge variant="outline" className="bg-[#0e1824]/80 text-[#09b66d] border-[#09b66d]/30">
                      Member
                    </Badge>
                    
                    {user?.phoneVerified && (
                      <Badge variant="outline" className="bg-[#0F1923]/80 text-green-400 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Phone Verified
                      </Badge>
                    )}
                    
                    {user?.isVerified ? (
                      <Badge variant="outline" className="bg-[#0F1923]/80 text-green-400 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        KYC Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-[#0F1923]/80 text-yellow-500 border-yellow-500/30">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        KYC Required
                      </Badge>
                    )}
                    
                    {user?.twoFactorEnabled && (
                      <Badge variant="outline" className="bg-[#0F1923]/80 text-blue-400 border-blue-500/30">
                        <Shield className="h-3 w-3 mr-1" />
                        2FA Active
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold">{user?.balance}</div>
                    <div className="text-xs text-gray-400">Balance</div>
                  </div>
                </div>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="bg-[#0F1923] border border-gray-800 mb-6">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-[#1A2634] data-[state=active]:text-[#09b66d]"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="data-[state=active]:bg-[#1A2634] data-[state=active]:text-[#09b66d]"
                >
                  Security
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="m-0">
                <Form {...profileUpdateForm}>
                  <form onSubmit={profileUpdateForm.handleSubmit(updateProfile)}>
                    <Card className="bg-[#1A2634] border-gray-800">
                      <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                          Update your account information and personal details
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-300">Username</label>
                              <Input 
                                value={user?.username} 
                                className="bg-[#0F1923] border-gray-800" 
                                disabled 
                              />
                              <p className="text-xs text-gray-500">Usernames cannot be changed</p>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-300">Email Address</label>
                              <div className="relative">
                                <Input 
                                  value={user?.email} 
                                  className="bg-[#0F1923] border-gray-800" 
                                  disabled 
                                />
                                {!user?.isVerified && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs border-yellow-500 text-yellow-500 hover:text-yellow-400 hover:border-yellow-400"
                                    onClick={() => setShowEmailVerificationDialog(true)}
                                  >
                                    Verify
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-300">Phone Number</label>
                              <div className="relative">
                                <Input 
                                  value={user?.phoneNumber || "Not provided"} 
                                  className="bg-[#0F1923] border-gray-800" 
                                  disabled 
                                />
                                {!user?.phoneVerified && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs border-yellow-500 text-yellow-500 hover:text-yellow-400 hover:border-yellow-400"
                                    onClick={() => setShowPhoneVerificationDialog(true)}
                                  >
                                    Verify
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-300">Country</label>
                              <Input 
                                value={user?.country || "Not provided"} 
                                className="bg-[#0F1923] border-gray-800" 
                                disabled 
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-300 block mb-2">Address</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={profileUpdateForm.control}
                                name="address"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        placeholder="Street Address" 
                                        className="bg-[#0F1923] border-gray-800" 
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileUpdateForm.control}
                                name="city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        placeholder="City" 
                                        className="bg-[#0F1923] border-gray-800" 
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileUpdateForm.control}
                                name="state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        placeholder="State/Province" 
                                        className="bg-[#0F1923] border-gray-800" 
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileUpdateForm.control}
                                name="zipCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        placeholder="Zip/Postal Code" 
                                        className="bg-[#0F1923] border-gray-800" 
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <p className="text-sm text-gray-400 mt-2">Required for KYC verification and withdrawals</p>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              type="submit"
                              className="bg-gradient-to-r from-[#09b66d] to-[#09b66d]/80 hover:from-[#0fd684] hover:to-[#09b66d] text-[#0e1824] font-medium"
                              disabled={isSubmittingProfile}
                            >
                              {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="security" className="m-0">
                <Card className="bg-[#1A2634] border-gray-800 mb-6">
                  <CardHeader>
                    <CardTitle>Security & Verification</CardTitle>
                    <CardDescription>
                      Manage your security settings and account verification
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Password Section */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-base font-medium text-white">Change Password</h3>
                          <p className="text-sm text-gray-400">Update your password regularly for better security</p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="border-gray-700 hover:border-[#09b66d] hover:text-[#09b66d]"
                          onClick={() => setShowPasswordChangeDialog(true)}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Change
                        </Button>
                      </div>
                      <Separator className="bg-gray-800" />
                    </div>
                    
                    {/* 2FA Section */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-base font-medium text-white">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                        </div>
                        
                        {user?.twoFactorEnabled ? (
                          <Button 
                            variant="outline" 
                            className="border-gray-700 text-red-400 hover:text-red-300 hover:border-red-400"
                            onClick={() => setShowDisable2FADialog(true)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Disable
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="border-gray-700 hover:border-[#09b66d] hover:text-[#09b66d]"
                            onClick={() => setShowSetup2FADialog(true)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Enable
                          </Button>
                        )}
                      </div>
                      <Separator className="bg-gray-800" />
                    </div>
                    
                    {/* KYC Verification */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-base font-medium text-white">Identity Verification (KYC)</h3>
                          <p className="text-sm text-gray-400">
                            Verify your identity to unlock withdrawals and higher limits
                          </p>
                        </div>
                        
                        {user?.isVerified ? (
                          <Badge className="px-3 py-1 bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Verified
                          </Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="border-yellow-600/60 text-yellow-500 hover:text-yellow-400 hover:border-yellow-500"
                            onClick={() => setShowKYCDialog(true)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Start KYC
                          </Button>
                        )}
                      </div>
                      <Separator className="bg-gray-800" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1A2634] border-gray-800">
                  <CardHeader>
                    <CardTitle>Wallet Addresses</CardTitle>
                    <CardDescription>
                      Manage your cryptocurrency withdrawal addresses
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-[#0F1923] rounded-lg border border-gray-800 p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F9C846] to-[#F7931A] flex items-center justify-center mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.7-6.2L15.48 2.9" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium mb-1">Bitcoin (BTC)</div>
                              <div className="text-sm text-gray-400 truncate max-w-xs">
                                {user?.btcAddress || "No address added"}
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-gray-700"
                            onClick={() => {
                              setSelectedCrypto("BTC");
                              setShowAddWalletDialog(true);
                            }}
                          >
                            {user?.btcAddress ? "Edit" : "Add"}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-[#0F1923] rounded-lg border border-gray-800 p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#627EEA] to-[#3C3C3D] flex items-center justify-center mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 32 32">
                                <g fill="none" fillRule="evenodd">
                                  <path fill="#FFF" d="M16 16v7.2L8 17.5z" />
                                  <path fill="#FFF" fillOpacity=".8" d="M16 16 8 17.5 16 8.8z" />
                                  <path fill="#FFF" d="M16 16v7.2l8-5.7z" />
                                  <path fill="#FFF" fillOpacity=".8" d="M16 16 24 17.5 16 8.8z" />
                                  <path fill="#FFF" d="m16 22.4-8-4.6L16 24z" />
                                  <path fill="#FFF" fillOpacity=".8" d="M16 24V16l8 5.1z" />
                                </g>
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium mb-1">Ethereum (ETH)</div>
                              <div className="text-sm text-gray-400 truncate max-w-xs">
                                {user?.ethAddress || "No address added"}
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-gray-700"
                            onClick={() => {
                              setSelectedCrypto("ETH");
                              setShowAddWalletDialog(true);
                            }}
                          >
                            {user?.ethAddress ? "Edit" : "Add"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      <MobileNav />
      
      {/* Phone Verification Dialog */}
      <Dialog open={showPhoneVerificationDialog} onOpenChange={setShowPhoneVerificationDialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Verify Phone Number</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add and verify your phone number for additional security
            </DialogDescription>
          </DialogHeader>
          
          <Form {...phoneVerificationForm}>
            <form onSubmit={phoneVerificationForm.handleSubmit(verifyPhoneNumber)} className="space-y-4">
              <div className="space-y-4">
                {!phoneVerificationSent ? (
                  <FormField
                    control={phoneVerificationForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Controller
                            name="phoneNumber"
                            control={phoneVerificationForm.control}
                            render={({ field }) => (
                              <PhoneInput
                                country={'us'}
                                value={field.value}
                                onChange={(value) => {
                                  console.log("Phone input value:", value);
                                  field.onChange(value);
                                }}
                                inputStyle={{
                                  width: '100%',
                                  backgroundColor: '#0F1923',
                                  color: 'white',
                                  border: '1px solid #2c364a',
                                  borderRadius: '0.375rem',
                                  padding: '0.5rem 0.75rem 0.5rem 3rem',
                                  height: '2.5rem'
                                }}
                                dropdownStyle={{
                                  backgroundColor: '#1A2634',
                                  color: 'white',
                                  border: '1px solid #2c364a'
                                }}
                                buttonStyle={{
                                  backgroundColor: '#0F1923',
                                  border: '1px solid #2c364a',
                                  borderRight: 'none'
                                }}
                                enableSearch={true}
                                searchPlaceholder="Search countries..."
                                searchClass="bg-[#0F1923] text-white border-gray-800"
                                countryCodeEditable={false}
                                containerClass="phone-input-container"
                                inputClass="phone-input-control"
                                specialLabel=""
                                disableDropdown={false}
                                preferredCountries={['us', 'ca', 'gb', 'au']}
                              />
                            )}
                          />
                        </FormControl>
                        <FormDescription className="text-gray-500">
                          Select your country and enter your phone number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={phoneVerificationForm.control}
                    name="verificationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000000" 
                            className="bg-[#0F1923] border-gray-800 text-center text-lg tracking-widest" 
                            maxLength={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-gray-500">
                          Enter the 6-digit code sent to your phone
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <DialogFooter>
                {!phoneVerificationSent ? (
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#09b66d] to-[#09b66d]/80 hover:from-[#0fd684] hover:to-[#09b66d] text-[#0e1824] font-medium"
                    disabled={isSubmittingPhone}
                  >
                    {isSubmittingPhone && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Verification Code
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#09b66d] to-[#09b66d]/80 hover:from-[#0fd684] hover:to-[#09b66d] text-[#0e1824] font-medium"
                    disabled={isVerifyingPhone}
                  >
                    {isVerifyingPhone && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify Code
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Email Verification Dialog */}
      <Dialog open={showEmailVerificationDialog} onOpenChange={setShowEmailVerificationDialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Verify Email Address</DialogTitle>
            <DialogDescription className="text-gray-400">
              Verify your email address for account security
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <Alert className="bg-[#0F1923] border-gray-800">
              <Mail className="h-4 w-4 text-[#09b66d]" />
              <AlertTitle>Verification Required</AlertTitle>
              <AlertDescription>
                We have sent a verification email to <span className="font-medium">{user?.email}</span>. 
                Please check your inbox and follow the instructions to verify your email address.
              </AlertDescription>
            </Alert>
            
            <p className="text-sm text-gray-400">
              Didn't receive the email? Check your spam folder or click the button below to resend.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              className="w-full bg-gradient-to-r from-[#09b66d] to-[#09b66d]/80 hover:from-[#0fd684] hover:to-[#09b66d] text-[#0e1824] font-medium"
            >
              Resend Verification Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Password Change Dialog */}
      <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Change Password</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update your password for better security
            </DialogDescription>
          </DialogHeader>
          
          <Form {...passwordChangeForm}>
            <form onSubmit={passwordChangeForm.handleSubmit(changePassword)} className="space-y-4">
              <FormField
                control={passwordChangeForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Enter your current password" 
                        className="bg-[#0F1923] border-gray-800" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordChangeForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Enter your new password" 
                        className="bg-[#0F1923] border-gray-800" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordChangeForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Confirm your new password" 
                        className="bg-[#0F1923] border-gray-800" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#09b66d] to-[#09b66d]/80 hover:from-[#0fd684] hover:to-[#09b66d] text-[#0e1824] font-medium"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* 2FA Setup Dialog */}
      <Dialog open={showSetup2FADialog} onOpenChange={setShowSetup2FADialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enhance your account security with 2FA
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <Alert className="bg-[#0F1923] border-gray-800">
              <Shield className="h-4 w-4 text-[#09b66d]" />
              <AlertTitle>Stronger Security</AlertTitle>
              <AlertDescription>
                Two-factor authentication adds an extra layer of security to your account. Each time you sign in, you'll need your password and a verification code.
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-4">
              <div className="bg-white inline-block p-2 rounded-lg">
                {/* This would be a QR code in a real application */}
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                  <Shield className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-300 mb-2">Manual Setup Code:</p>
                <code className="bg-[#0F1923] text-[#09b66d] px-3 py-1 rounded-md text-sm">
                  ABCD EFGH IJKL MNOP
                </code>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Enter Verification Code</label>
              <Input 
                placeholder="000000" 
                className="bg-[#0F1923] border-gray-800 text-center text-lg tracking-widest" 
                maxLength={6}
              />
              <p className="text-xs text-gray-500">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              className="w-full bg-gradient-to-r from-[#09b66d] to-[#09b66d]/80 hover:from-[#0fd684] hover:to-[#09b66d] text-[#0e1824] font-medium"
              onClick={() => setup2FA("123456")} // In a real app, this would use the input value
            >
              Enable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Disable 2FA Dialog */}
      <Dialog open={showDisable2FADialog} onOpenChange={setShowDisable2FADialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will remove the extra layer of security from your account
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <Alert className="bg-[#0F1923] border-gray-800">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertTitle>Security Warning</AlertTitle>
              <AlertDescription>
                Disabling two-factor authentication will make your account less secure. Are you sure you want to continue?
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Enter Verification Code</label>
              <Input 
                placeholder="000000" 
                className="bg-[#0F1923] border-gray-800 text-center text-lg tracking-widest" 
                maxLength={6}
              />
              <p className="text-xs text-gray-500">
                Enter the 6-digit code from your authenticator app to confirm
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="destructive"
              className="w-full"
              onClick={() => disable2FA("123456")} // In a real app, this would use the input value
            >
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Wallet Dialog */}
      <Dialog open={showAddWalletDialog} onOpenChange={setShowAddWalletDialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {user?.[selectedCrypto === "BTC" ? "btcAddress" : "ethAddress"] ? "Edit" : "Add"} {selectedCrypto} Address
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your {selectedCrypto} wallet address for withdrawals
            </DialogDescription>
          </DialogHeader>
          
          <Form {...walletAddressForm}>
            <form onSubmit={walletAddressForm.handleSubmit(addWalletAddress)} className="space-y-4">
              <FormField
                control={walletAddressForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input 
                        type="hidden"
                        {...field}
                        value={selectedCrypto}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={walletAddressForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={`Enter your ${selectedCrypto} address`}
                        className="bg-[#0F1923] border-gray-800 font-mono text-sm" 
                        {...field}
                        defaultValue={user?.[selectedCrypto === "BTC" ? "btcAddress" : "ethAddress"] || ""}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-500">
                      Double-check your address carefully. Wrong addresses can lead to permanent loss of funds.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#09b66d] to-[#09b66d]/80 hover:from-[#0fd684] hover:to-[#09b66d] text-[#0e1824] font-medium"
                  disabled={isAddingWallet}
                >
                  {isAddingWallet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Address
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* KYC Verification Dialog */}
      <Dialog open={showKYCDialog} onOpenChange={setShowKYCDialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Identity Verification (KYC)</DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete the KYC process to unlock withdrawals and other features.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <Alert className="bg-[#0F1923] border-gray-800">
              <AlertCircle className="h-4 w-4 text-[#09b66d]" />
              <AlertTitle>Why we need this</AlertTitle>
              <AlertDescription>
                KYC verification is required to comply with regulations and to protect against fraud and money laundering.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h3 className="text-base font-medium text-white">Required Documents</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Government-Issued ID</h4>
                  <p className="text-xs text-gray-400">Upload a passport, driver's license, or national ID card</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="border border-dashed border-gray-600 rounded-md p-4 text-center cursor-pointer hover:bg-[#0F1923]/50 transition-colors">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-2 rounded-full bg-[#0F1923]">
                          <Upload className="h-5 w-5 text-[#09b66d]" />
                        </div>
                        <p className="text-sm font-medium">Front Side</p>
                        <p className="text-xs text-gray-400">JPG, PNG or PDF</p>
                      </div>
                    </div>
                    
                    <div className="border border-dashed border-gray-600 rounded-md p-4 text-center cursor-pointer hover:bg-[#0F1923]/50 transition-colors">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-2 rounded-full bg-[#0F1923]">
                          <Upload className="h-5 w-5 text-[#09b66d]" />
                        </div>
                        <p className="text-sm font-medium">Back Side</p>
                        <p className="text-xs text-gray-400">JPG, PNG or PDF</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Proof of Address</h4>
                  <p className="text-xs text-gray-400">Upload a utility bill or bank statement from the last 3 months</p>
                  
                  <div className="border border-dashed border-gray-600 rounded-md p-4 text-center cursor-pointer hover:bg-[#0F1923]/50 transition-colors">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-2 rounded-full bg-[#0F1923]">
                        <Upload className="h-5 w-5 text-[#09b66d]" />
                      </div>
                      <p className="text-sm font-medium">Address Document</p>
                      <p className="text-xs text-gray-400">JPG, PNG or PDF</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              className="w-full bg-gradient-to-r from-[#09b66d] to-[#09b66d]/80 hover:from-[#0fd684] hover:to-[#09b66d] text-[#0e1824] font-medium"
              disabled={isUploadingKYC}
              onClick={submitKYC}
            >
              {isUploadingKYC && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}