import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { phoneVerificationSchema } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
import { Loader2, CheckCircle, AlertCircle, Mail, Phone, Shield, User, Lock, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const phoneVerificationFormSchema = phoneVerificationSchema;
type PhoneVerificationFormData = z.infer<typeof phoneVerificationFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [showPhoneVerificationDialog, setShowPhoneVerificationDialog] = useState(false);
  const [isSubmittingPhone, setIsSubmittingPhone] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false);
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);
  const [showSetup2FADialog, setShowSetup2FADialog] = useState(false);
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [showKYCDialog, setShowKYCDialog] = useState(false);
  const [isUploadingKYC, setIsUploadingKYC] = useState(false);

  const phoneVerificationForm = useForm<PhoneVerificationFormData>({
    resolver: zodResolver(phoneVerificationFormSchema),
    defaultValues: {
      phoneNumber: user?.phoneNumber || "",
      verificationCode: "",
    },
  });

  const submitPhoneNumber = async (phoneNumber: string) => {
    try {
      setIsSubmittingPhone(true);
      
      // In a real app, this would send an SMS with a verification code
      // For now, we'll just simulate this with a toast message
      setTimeout(() => {
        toast({
          title: "Verification code sent",
          description: `A verification code has been sent to ${phoneNumber}. For testing, use code "123456".`,
        });
        setPhoneVerificationSent(true);
        setIsSubmittingPhone(false);
      }, 1500);
    } catch (error) {
      setIsSubmittingPhone(false);
      toast({
        title: "Failed to send verification code",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const verifyPhoneNumber = async (data: PhoneVerificationFormData) => {
    try {
      setIsVerifyingPhone(true);
      
      // Call the API to verify the phone number
      await apiRequest("POST", "/api/verify-phone", data);
      
      toast({
        title: "Phone number verified",
        description: "Your phone number has been successfully verified.",
      });
      
      setShowPhoneVerificationDialog(false);
      setPhoneVerificationSent(false);
      
      // In a real app, this would trigger a refresh of the user data
      // For now, we'll just handle this manually
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const requestEmailVerification = async () => {
    try {
      // In a real app, this would send an email with a verification link
      // For now, we'll just simulate this with a toast message
      toast({
        title: "Verification email sent",
        description: `A verification email has been sent to ${user?.email}. Please check your inbox and follow the instructions.`,
      });
      
      setShowEmailVerificationDialog(false);
    } catch (error) {
      toast({
        title: "Failed to send verification email",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null; // User needs to be logged in to view this page
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Account</h1>
        <p className="text-gray-400 mt-1">Manage your profile, security settings, and verification status</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card className="bg-[#1A2634] border-gray-800">
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-4 py-6">
                <Avatar className="h-24 w-24 border-2 border-[#00FFAA]">
                  <AvatarImage src={user.profileImage || undefined} />
                  <AvatarFallback className="bg-[#0F1923] text-xl">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-white">{user.username}</h2>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
                
                <div className="w-full flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </span>
                    {user.isVerified ? (
                      <Badge variant="outline" className="border-green-500 text-green-500">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Phone
                    </span>
                    {user.phoneVerified ? (
                      <Badge variant="outline" className="border-green-500 text-green-500">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center">
                      <Shield className="h-4 w-4 mr-1" />
                      KYC
                    </span>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4 bg-gray-800" />
              
              <TabsList className="grid w-full grid-cols-1 bg-[#0F1923]">
                <TabsTrigger 
                  value="profile" 
                  className={`justify-start px-3 py-2 h-auto ${activeTab === "profile" ? "bg-[#1A2634] data-[state=active]:bg-[#1A2634]" : ""}`}
                  onClick={() => setActiveTab("profile")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className={`justify-start px-3 py-2 h-auto ${activeTab === "security" ? "bg-[#1A2634] data-[state=active]:bg-[#1A2634]" : ""}`}
                  onClick={() => setActiveTab("security")}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger 
                  value="verification" 
                  className={`justify-start px-3 py-2 h-auto ${activeTab === "verification" ? "bg-[#1A2634] data-[state=active]:bg-[#1A2634]" : ""}`}
                  onClick={() => setActiveTab("verification")}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Verification
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="profile" className="m-0">
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
                        <FormLabel>Username</FormLabel>
                        <Input 
                          value={user.username} 
                          className="bg-[#0F1923] border-gray-800" 
                          disabled 
                        />
                        <p className="text-xs text-gray-500">Usernames cannot be changed</p>
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Email Address</FormLabel>
                        <div className="relative">
                          <Input 
                            value={user.email} 
                            className="bg-[#0F1923] border-gray-800" 
                            disabled 
                          />
                          {!user.isVerified && (
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
                        <FormLabel>Phone Number</FormLabel>
                        <div className="relative">
                          <Input 
                            value={user.phoneNumber || "Not provided"} 
                            className="bg-[#0F1923] border-gray-800" 
                            disabled 
                          />
                          {!user.phoneVerified && (
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
                        <FormLabel>Country</FormLabel>
                        <Input 
                          value={user.country || "Not provided"} 
                          className="bg-[#0F1923] border-gray-800" 
                          disabled 
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-6 bg-gray-800" />
                    
                    <div className="space-y-4">
                      <h3 className="text-base font-medium text-white">Residential Address</h3>
                      <p className="text-sm text-gray-400">Required for KYC verification and withdrawals</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <FormLabel>Address</FormLabel>
                          <Input 
                            placeholder="Enter your street address" 
                            className="bg-[#0F1923] border-gray-800"
                            defaultValue={user.address || ""}
                            name="address"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <FormLabel>City</FormLabel>
                          <Input 
                            placeholder="Enter your city" 
                            className="bg-[#0F1923] border-gray-800"
                            defaultValue={user.city || ""}
                            name="city"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <FormLabel>State/Province</FormLabel>
                          <Input 
                            placeholder="Enter your state or province" 
                            className="bg-[#0F1923] border-gray-800"
                            defaultValue={user.state || ""}
                            name="state"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <FormLabel>Zip/Postal Code</FormLabel>
                          <Input 
                            placeholder="Enter your zip/postal code" 
                            className="bg-[#0F1923] border-gray-800"
                            defaultValue={user.zipCode || ""}
                            name="zipCode"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="border-t border-gray-800 flex justify-between pt-6">
                  <Button variant="outline" className="border-gray-700">Cancel</Button>
                  <Button className="bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium">
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="m-0">
              <Card className="bg-[#1A2634] border-gray-800">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your password and account security options
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-base font-medium text-white">Change Password</h3>
                      <p className="text-sm text-gray-400">Update your password regularly to keep your account secure</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-2">
                          <FormLabel>Current Password</FormLabel>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="bg-[#0F1923] border-gray-800" 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <FormLabel>New Password</FormLabel>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="bg-[#0F1923] border-gray-800" 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-6 bg-gray-800" />
                    
                    <div className="space-y-2">
                      <h3 className="text-base font-medium text-white">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                      
                      <div className="mt-4">
                        {user.twoFactorEnabled ? (
                          <Alert className="bg-[#0F1923] border-gray-800">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <AlertTitle>Enabled</AlertTitle>
                            <AlertDescription>
                              Two-factor authentication is enabled on your account. You'll need to enter a verification code when signing in.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert className="bg-[#0F1923] border-gray-800">
                            <AlertCircle className="h-4 w-4 text-[#00FFAA]" />
                            <AlertTitle>Not Enabled</AlertTitle>
                            <AlertDescription>
                              Two-factor authentication is not enabled yet. Enable it to add an extra layer of security to your account.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {user.twoFactorEnabled ? (
                          <Button 
                            className="mt-4 bg-[#1A2634] border border-red-500 text-red-500 hover:bg-red-500/10"
                            onClick={() => setShowDisable2FADialog(true)}
                          >
                            Disable 2FA
                          </Button>
                        ) : (
                          <Button 
                            className="mt-4 bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                            onClick={() => setShowSetup2FADialog(true)}
                          >
                            Enable 2FA
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="border-t border-gray-800 flex justify-between pt-6">
                  <Button variant="outline" className="border-gray-700">Cancel</Button>
                  <Button className="bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium">
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="verification" className="m-0">
              <Card className="bg-[#1A2634] border-gray-800">
                <CardHeader>
                  <CardTitle>Account Verification</CardTitle>
                  <CardDescription>
                    Complete verification steps to unlock all features
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Email Verification */}
                      <Card className="bg-[#0F1923] border-gray-800">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className={`rounded-full p-2 ${user.isVerified ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                                <Mail className={`h-6 w-6 ${user.isVerified ? 'text-green-500' : 'text-yellow-500'}`} />
                              </div>
                              <div>
                                <h3 className="text-base font-medium text-white">Email Verification</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                  {user.isVerified 
                                    ? "Your email has been verified." 
                                    : "Verify your email address to secure your account."}
                                </p>
                              </div>
                            </div>
                            <div>
                              {user.isVerified ? (
                                <Badge variant="outline" className="border-green-500 text-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-yellow-500 text-yellow-500 hover:text-yellow-400 hover:border-yellow-400"
                                  onClick={() => setShowEmailVerificationDialog(true)}
                                >
                                  Verify Now
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Phone Verification */}
                      <Card className="bg-[#0F1923] border-gray-800">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className={`rounded-full p-2 ${user.phoneVerified ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                                <Phone className={`h-6 w-6 ${user.phoneVerified ? 'text-green-500' : 'text-yellow-500'}`} />
                              </div>
                              <div>
                                <h3 className="text-base font-medium text-white">Phone Verification</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                  {user.phoneVerified 
                                    ? "Your phone number has been verified." 
                                    : "Verify your phone number for account recovery and notifications."}
                                </p>
                              </div>
                            </div>
                            <div>
                              {user.phoneVerified ? (
                                <Badge variant="outline" className="border-green-500 text-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-yellow-500 text-yellow-500 hover:text-yellow-400 hover:border-yellow-400"
                                  onClick={() => setShowPhoneVerificationDialog(true)}
                                >
                                  Verify Now
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* KYC Verification */}
                      <Card className="bg-[#0F1923] border-gray-800">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="rounded-full p-2 bg-yellow-500/20">
                                <Shield className="h-6 w-6 text-yellow-500" />
                              </div>
                              <div>
                                <h3 className="text-base font-medium text-white">Identity Verification (KYC)</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                  Complete identity verification to unlock withdrawals and other features.
                                </p>
                              </div>
                            </div>
                            <div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-yellow-500 text-yellow-500 hover:text-yellow-400 hover:border-yellow-400"
                                onClick={() => setShowKYCDialog(true)}
                              >
                                Start KYC
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Phone Verification Dialog */}
      <Dialog open={showPhoneVerificationDialog} onOpenChange={setShowPhoneVerificationDialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Verify Your Phone Number</DialogTitle>
            <DialogDescription className="text-gray-400">
              {phoneVerificationSent
                ? "Enter the verification code sent to your phone."
                : "Enter your phone number to receive a verification code."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...phoneVerificationForm}>
            <form onSubmit={phoneVerificationForm.handleSubmit(verifyPhoneNumber)} className="space-y-4">
              <FormField
                control={phoneVerificationForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        className="bg-[#0F1923] border-gray-800"
                        disabled={phoneVerificationSent || isSubmittingPhone}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your phone number with country code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!phoneVerificationSent ? (
                <Button 
                  type="button" 
                  onClick={() => submitPhoneNumber(phoneVerificationForm.getValues("phoneNumber"))}
                  className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                  disabled={isSubmittingPhone}
                >
                  {isSubmittingPhone ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              ) : (
                <>
                  <FormField
                    control={phoneVerificationForm.control}
                    name="verificationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 6-digit code"
                            className="bg-[#0F1923] border-gray-800"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the 6-digit code sent to your phone
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      type="button"
                      variant="outline"
                      className="border-gray-700"
                      onClick={() => {
                        setPhoneVerificationSent(false);
                        phoneVerificationForm.setValue("verificationCode", "");
                      }}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                      disabled={isVerifyingPhone}
                    >
                      {isVerifyingPhone ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Phone Number"
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Email Verification Dialog */}
      <Dialog open={showEmailVerificationDialog} onOpenChange={setShowEmailVerificationDialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Verify Your Email Address</DialogTitle>
            <DialogDescription className="text-gray-400">
              We'll send a verification link to your email address.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-300 mb-4">
              A verification link will be sent to the following email address:
            </p>
            <div className="bg-[#0F1923] border border-gray-800 rounded-md p-3 mb-4">
              <p className="text-sm font-medium text-gray-200">{user?.email}</p>
            </div>
            <p className="text-sm text-gray-400">
              Please check your inbox and spam folder after sending the verification email.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              onClick={requestEmailVerification}
              className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
            >
              Send Verification Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={showSetup2FADialog} onOpenChange={setShowSetup2FADialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-gray-400">
              Protect your account with an additional layer of security.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-300">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            
            <div className="flex justify-center bg-white p-4 rounded-md">
              {/* QR code placeholder */}
              <div className="w-40 h-40 bg-gray-200 flex items-center justify-center text-gray-800">
                QR Code Placeholder
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-300">Or enter this code manually:</p>
              <div className="bg-[#0F1923] border border-gray-800 rounded-md p-3">
                <p className="font-mono text-sm text-center">ABCD EFGH IJKL MNOP</p>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <FormLabel>Verification Code</FormLabel>
              <Input
                placeholder="Enter 6-digit code"
                className="bg-[#0F1923] border-gray-800"
              />
              <p className="text-xs text-gray-500">
                Enter the 6-digit code from your authenticator app to verify
              </p>
            </div>
          </div>
          
          <DialogFooter className="space-y-2 sm:space-y-0">
            <Button 
              variant="outline"
              className="border-gray-700"
              onClick={() => setShowSetup2FADialog(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
            >
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Disable Dialog */}
      <Dialog open={showDisable2FADialog} onOpenChange={setShowDisable2FADialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-gray-400">
              Warning: This will reduce your account security
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Security Risk</AlertTitle>
              <AlertDescription>
                Disabling 2FA will make your account more vulnerable to unauthorized access.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 mt-4">
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                placeholder="Enter your password"
                className="bg-[#0F1923] border-gray-800"
              />
              <p className="text-xs text-gray-500">
                Enter your password to confirm this action
              </p>
            </div>
          </div>
          
          <DialogFooter className="space-y-2 sm:space-y-0">
            <Button 
              variant="outline"
              className="border-gray-700"
              onClick={() => setShowDisable2FADialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
            >
              Disable 2FA
            </Button>
          </DialogFooter>
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
              <AlertCircle className="h-4 w-4 text-[#00FFAA]" />
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
                          <Upload className="h-5 w-5 text-[#00FFAA]" />
                        </div>
                        <p className="text-sm font-medium">Front Side</p>
                        <p className="text-xs text-gray-400">JPG, PNG or PDF</p>
                      </div>
                    </div>
                    
                    <div className="border border-dashed border-gray-600 rounded-md p-4 text-center cursor-pointer hover:bg-[#0F1923]/50 transition-colors">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-2 rounded-full bg-[#0F1923]">
                          <Upload className="h-5 w-5 text-[#00FFAA]" />
                        </div>
                        <p className="text-sm font-medium">Back Side</p>
                        <p className="text-xs text-gray-400">JPG, PNG or PDF</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Proof of Address</h4>
                  <p className="text-xs text-gray-400">Upload a utility bill, bank statement, or official document with your name and address (issued within the last 3 months)</p>
                  
                  <div className="border border-dashed border-gray-600 rounded-md p-4 text-center cursor-pointer hover:bg-[#0F1923]/50 transition-colors mt-2">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-2 rounded-full bg-[#0F1923]">
                        <Upload className="h-5 w-5 text-[#00FFAA]" />
                      </div>
                      <p className="text-sm font-medium">Proof of Address</p>
                      <p className="text-xs text-gray-400">JPG, PNG or PDF</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="space-y-2 sm:space-y-0">
            <Button 
              variant="outline"
              className="border-gray-700"
              onClick={() => setShowKYCDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
              disabled={isUploadingKYC}
            >
              {isUploadingKYC ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Submit Documents"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}