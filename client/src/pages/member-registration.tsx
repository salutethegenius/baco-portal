import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, UserPlus } from "lucide-react";

const memberRegistrationSchema = z.object({
  // Basic Info
  registrationType: z.enum(["existing", "new"]),
  membershipNumber: z.string().optional(),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  
  // Contact Info
  homePhone: z.string().min(10, "Home phone is required"),
  cellPhone: z.string().min(10, "Cell phone is required"),
  homeAddress: z.string().min(10, "Home address is required"),
  businessAddress: z.string().optional(),
  
  // Personal Details
  placeOfBirth: z.string().min(2, "Place of birth is required"),
  nationality: z.string().min(2, "Nationality is required"),
  bahamasResident: z.boolean(),
  yearsInBahamas: z.number().optional(),
  
  // Professional Info
  qualifications: z.string().min(10, "Professional qualifications are required"),
  memberships: z.string().optional(),
  currentEmployer: z.string().min(2, "Current employer is required"),
  position: z.string().min(2, "Position held is required"),
  durationInPosition: z.string().min(1, "Duration in position is required"),
  yearsExperience: z.number().min(0, "Years of experience is required"),
  
  // Membership Level
  membershipType: z.enum(["academic", "associate", "professional", "bccp"]),
  
  // Background Checks
  professionalMisconduct: z.boolean(),
  pendingMisconduct: z.boolean(),
  criminalConviction: z.boolean(),
  bankruptcy: z.boolean(),
  regulatoryRegistration: z.boolean(),
  explanationRequired: z.string().optional(),
  
  // Agreement
  agreesToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

type MemberRegistrationData = z.infer<typeof memberRegistrationSchema>;

export default function MemberRegistration() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<MemberRegistrationData>({
    resolver: zodResolver(memberRegistrationSchema),
    defaultValues: {
      registrationType: "new",
      bahamasResident: false,
      membershipType: "professional",
      professionalMisconduct: false,
      pendingMisconduct: false,
      criminalConviction: false,
      bankruptcy: false,
      regulatoryRegistration: false,
      agreesToTerms: false,
    },
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: MemberRegistrationData) => {
      return await apiRequest("POST", "/api/member-registration", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted",
        description: "Your membership application has been submitted for review. You will receive an email confirmation shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MemberRegistrationData) => {
    registrationMutation.mutate(data);
  };

  const registrationType = form.watch("registrationType");

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Application Submitted</CardTitle>
            <CardDescription>
              Thank you for applying to become a BACO member. Your application has been submitted for review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                <strong>Next Steps:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Submit required documents to bacobahamas@gmail.com</li>
                <li>Wait for membership approval notification</li>
                <li>Upon approval, submit membership fees</li>
                <li>Access your BACO portal account</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <UserPlus className="w-8 h-8 text-baco-primary" />
            <h1 className="text-3xl font-bold text-gray-900">BACO Membership Application</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join the Bahamas Association of Compliance Officers. Please complete this application form 
            and submit the required supporting documents.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Membership Application Form</CardTitle>
            <CardDescription>
              All fields marked with * are required. Please ensure all information is accurate and complete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Registration Type */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Registration Type</h3>
                  <FormField
                    control={form.control}
                    name="registrationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Are you already a BACO member?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="existing" id="existing" />
                              <label htmlFor="existing" className="text-sm font-medium leading-none">
                                I am already a BACO member (Portal Account Registration)
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="new" id="new" />
                              <label htmlFor="new" className="text-sm font-medium leading-none">
                                I want to register to become a BACO member
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {registrationType === "existing" && (
                  <FormField
                    control={form.control}
                    name="membershipNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BACO Membership Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your existing membership number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-date-of-birth" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Membership Type */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Membership Level</h3>
                  <FormField
                    control={form.control}
                    name="membershipType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Membership Level *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-membership-type">
                              <SelectValue placeholder="Select membership level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="academic">Academic and Student - $100</SelectItem>
                            <SelectItem value="associate">Associate - $200</SelectItem>
                            <SelectItem value="professional">Professional - $250</SelectItem>
                            <SelectItem value="bccp">BCCP (BACO Certified Compliance Professional) - $300</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Agreement */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Declaration and Agreement</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                    <p className="mb-2">
                      <strong>Declaration:</strong> I declare that the information contained in this application is true and complete 
                      to the best of my knowledge and belief.
                    </p>
                    <p>
                      <strong>Agreement:</strong> I confirm my agreement to abide by the Constitution, Mission Statement, Objectives 
                      and Regulations of BACO.
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="agreesToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-agree-terms"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the declaration and terms stated above *
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={registrationMutation.isPending}
                    className="w-full bg-baco-primary hover:bg-baco-secondary"
                    data-testid="button-submit-application"
                  >
                    {registrationMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}