import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  insertUserSchema,
  passwordResetRequestSchema,
  passwordResetSchema 
} from "@shared/schema";
import { countries } from "countries-list";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Modified login schema to use email instead of username
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
});

// Enhanced registration schema with all required fields
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  country: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type PasswordResetRequestFormData = z.infer<typeof passwordResetRequestSchema>;
type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

// Convert countries object to array for Select component
const countryOptions = Object.entries(countries).map(([code, country]) => ({
  value: code,
  label: country.name
})).sort((a, b) => a.label.localeCompare(b.label));

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      country: "",
    },
  });

  // Password reset request form
  const resetRequestForm = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  // Password reset confirm form
  const resetForm = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    console.log("Register form data:", data);
    // We need to send the confirmPassword for validation
    // DO NOT remove it from the data
    console.log("Sending register data to mutation:", data);
    registerMutation.mutate(data);
  };

  const onPasswordResetRequest = async (data: PasswordResetRequestFormData) => {
    try {
      await apiRequest("POST", "/api/password-reset/request", data);
      toast({
        title: "Reset link sent",
        description: "If your email exists in our system, you'll receive a password reset link shortly.",
      });
      
      // For development/testing purposes, we simulate getting the token
      // In production, the user would click a link in their email
      setResetToken("test-token");
      
    } catch (error) {
      toast({
        title: "Reset request failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const onPasswordReset = async (data: PasswordResetFormData) => {
    try {
      // Use the token from state if available, otherwise use the one from the form
      const tokenToUse = resetToken || data.token;
      
      await apiRequest("POST", "/api/password-reset/confirm", {
        ...data,
        token: tokenToUse,
      });
      
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      
      setShowResetDialog(false);
      setResetToken(null);
      setActiveTab("login");
      
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md border-gray-800 bg-[#1A2634]">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-[#0F1923]">
              <TabsTrigger value="login" className="data-[state=active]:bg-[#1A2634] data-[state=active]:text-white">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-[#1A2634] data-[state=active]:text-white">Sign Up</TabsTrigger>
            </TabsList>
            
            <CardContent className="pt-6">
              <TabsContent value="login">
                <h2 className="text-xl font-bold text-white mb-4">Welcome Back</h2>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your.email@example.com"
                              {...field}
                              className="bg-[#0F1923] border-gray-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              className="bg-[#0F1923] border-gray-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between items-center">
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-[#00FFAA] data-[state=checked]:border-[#00FFAA]"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Remember me</FormLabel>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="button" 
                        variant="link" 
                        className="text-[#00FFAA] p-0 h-auto text-sm"
                        onClick={() => setShowResetDialog(true)}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                    
                    {/* Social Login Section */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-700"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#1A2634] px-2 text-gray-400">Or continue with</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="bg-[#0F1923] border-gray-700 hover:bg-gray-800 text-white"
                        disabled={true} // Enable once Google Auth is set up
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                            fill="#EA4335"
                          />
                          <path
                            d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                            fill="#4285F4"
                          />
                          <path
                            d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                            fill="#34A853"
                          />
                        </svg>
                        Google
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="bg-[#0F1923] border-gray-700 hover:bg-gray-800 text-white"
                        disabled={true} // Enable once Facebook Auth is set up
                      >
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1877F2] fill-current">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <h2 className="text-xl font-bold text-white mb-4">Create an Account</h2>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Choose a username"
                              {...field}
                              className="bg-[#0F1923] border-gray-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your.email@example.com"
                              {...field}
                              className="bg-[#0F1923] border-gray-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-[#0F1923] border-gray-800">
                                <SelectValue placeholder="Select your country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-80 bg-[#1A2634] border-gray-800">
                              {countryOptions.map((country) => (
                                <SelectItem key={country.value} value={country.value}>
                                  {country.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              className="bg-[#0F1923] border-gray-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              className="bg-[#0F1923] border-gray-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Sign Up"}
                    </Button>
                    
                    <div className="text-xs text-gray-500 text-center">
                      By signing up, you agree to our Terms of Service and Privacy Policy.
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
      
      <div className="hidden md:flex w-1/2 bg-[#0F1923] flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-[#00FFAA]">Crypto</span>Play
          </h1>
          <p className="text-gray-300 mb-6">Experience the thrill of online casino gaming with our cutting-edge platform. Play slots, dice, and crash games with your virtual currency.</p>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-[#1A2634] rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-[#00FFAA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <h3 className="text-white font-medium">Slots</h3>
            </div>
            <div className="p-4 bg-[#1A2634] rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-[#FF3E8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-white font-medium">Dice</h3>
            </div>
            <div className="p-4 bg-[#1A2634] rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-[#F9C846]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h3 className="text-white font-medium">Crash</h3>
            </div>
          </div>
          
          <ul className="text-left space-y-2 mb-8">
            <li className="flex items-center text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#00FFAA]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Sign up and get 5,000 free credits
            </li>
            <li className="flex items-center text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#00FFAA]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Modern UI with seamless gameplay
            </li>
            <li className="flex items-center text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#00FFAA]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Track your game history and winnings
            </li>
          </ul>
        </div>
      </div>
      
      {/* Password Reset Dialogs */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Reset Your Password</DialogTitle>
            <DialogDescription className="text-gray-400">
              {resetToken 
                ? "Enter your new password below." 
                : "Enter your email address and we'll send you a password reset link."}
            </DialogDescription>
          </DialogHeader>
          
          {resetToken ? (
            // Reset password form
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onPasswordReset)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-[#0F1923] border-gray-800"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
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
                    className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                  >
                    Reset Password
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            // Request reset link form
            <Form {...resetRequestForm}>
              <form onSubmit={resetRequestForm.handleSubmit(onPasswordResetRequest)} className="space-y-4">
                <FormField
                  control={resetRequestForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
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
                    className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                  >
                    Send Reset Link
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
