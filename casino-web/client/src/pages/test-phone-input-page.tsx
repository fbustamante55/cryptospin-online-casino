import { useState } from "react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Create a schema for phone input testing
const phoneInputSchema = z.object({
  phoneNumber: z.string().min(6, "Please enter a valid international phone number")
    .refine(value => /^\+?[0-9\s\-()]+$/.test(value), "Phone number can only contain digits, spaces, and characters +()-"),
  verificationCode: z.string().length(6, "Verification code must be 6 digits").optional()
});

type PhoneInputFormData = z.infer<typeof phoneInputSchema>;

export default function TestPhoneInputPage() {
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [rawPhoneValue, setRawPhoneValue] = useState("");
  
  // Set up form
  const form = useForm<PhoneInputFormData>({
    resolver: zodResolver(phoneInputSchema),
    defaultValues: {
      phoneNumber: "",
      verificationCode: ""
    }
  });

  const onSubmit = (data: PhoneInputFormData) => {
    console.log("Form submitted with:", data);
    if (!showVerificationStep) {
      setShowVerificationStep(true);
    } else {
      alert(`Phone verification complete!\nPhone: ${data.phoneNumber}\nCode: ${data.verificationCode}`);
      setShowVerificationStep(false);
      form.reset();
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1923] text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#1A2634] border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl text-center">Phone Input Test</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Testing the international phone input component
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                {!showVerificationStep ? (
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Controller
                            name="phoneNumber"
                            control={form.control}
                            render={({ field }) => (
                              <PhoneInput
                                country={'us'}
                                value={field.value}
                                onChange={(value) => {
                                  setRawPhoneValue(value);
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
                              />
                            )}
                          />
                        </FormControl>
                        <FormDescription className="text-gray-500">
                          Select your country and enter your phone number
                        </FormDescription>
                        <FormMessage />
                        <div className="text-xs text-gray-500 mt-2 p-3 bg-[#0F1923] rounded-md border border-gray-800 space-y-1">
                          <p><span className="font-semibold">Raw input:</span> {rawPhoneValue}</p>
                          <p><span className="font-semibold">Form value:</span> {field.value}</p>
                          <p><span className="font-semibold">Validation:</span> {
                            form.formState.errors.phoneNumber 
                              ? <span className="text-red-400">❌ {form.formState.errors.phoneNumber.message}</span>
                              : <span className="text-green-400">✓ Valid</span>
                          }</p>
                        </div>
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
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
              
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
              >
                {showVerificationStep ? "Verify Code" : "Send Verification Code"}
              </Button>
              
              {showVerificationStep && (
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full mt-2 border-gray-700"
                  onClick={() => setShowVerificationStep(false)}
                >
                  Back
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="border-t border-gray-800 flex justify-center p-4">
          <p className="text-xs text-gray-500">
            Form values: {JSON.stringify(form.getValues())}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}