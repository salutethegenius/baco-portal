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
import { CheckCircle, UserPlus, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

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
  
  // Professional Information (exact BACO fields)
  professionalQualifications: z.string().min(10, "List of Professional Qualifications is required"),
  professionalMemberships: z.string().min(5, "List of Memberships in other Professions/Organizations is required"),
  currentEmployer: z.string().min(2, "Current employer is required"),
  positionHeld: z.string().min(2, "Position held is required"),
  durationInPosition: z.string().min(1, "Duration in this position is required"),
  
  // Membership Level
  membershipType: z.enum(["academic", "associate", "professional", "bccp", "regulator"]),
  
  // Background Check Questions (exact BACO wording)
  professionalMisconductSubject: z.boolean(),
  professionalMisconductPending: z.boolean(),
  criminalConviction: z.boolean(),
  bankruptcyHistory: z.boolean(),
  regulatoryRegistration: z.boolean(),
  backgroundExplanation: z.string().optional(),
  
  // CEO/Managing Director Information (from BACO form)
  ceoName: z.string().min(2, "Name of CEO/Managing Director is required"),
  ceoTitle: z.string().min(2, "Title is required"),
  
  // Application Details
  applicationDate: z.string().min(1, "Date of application is required"),
  applicantSignature: z.string().min(2, "Signature of applicant is required"),
  
  // Agreement and Declaration (exact BACO wording)
  truthDeclaration: z.boolean().refine(val => val === true, "You must declare the information is true and complete"),
  constitutionAgreement: z.boolean().refine(val => val === true, "You must agree to abide by BACO Constitution and regulations"),
  complianceCommitment: z.boolean().refine(val => val === true, "You must confirm compliance with legal and regulatory requirements"),
});

type MemberRegistrationData = z.infer<typeof memberRegistrationSchema>;

export default function MemberRegistration() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<MemberRegistrationData>({
    resolver: zodResolver(memberRegistrationSchema),
    defaultValues: {
      registrationType: "new",
      membershipType: "professional",
      professionalMisconductSubject: false,
      professionalMisconductPending: false,
      criminalConviction: false,
      bankruptcyHistory: false,
      regulatoryRegistration: false,
      truthDeclaration: false,
      constitutionAgreement: false,
      complianceCommitment: false,
      applicationDate: new Date().toISOString().split('T')[0],
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
  const showExplanation = form.watch("professionalMisconductSubject") || 
    form.watch("professionalMisconductPending") || 
    form.watch("criminalConviction") || 
    form.watch("bankruptcyHistory") || 
    form.watch("regulatoryRegistration");

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
            
            <div className="text-center mt-6">
              <Link href="/auth">
                <Button variant="outline" className="inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Return to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back to Login Link */}
        <div className="mb-6">
          <Link href="/auth">
            <Button variant="ghost" className="inline-flex items-center gap-2 text-baco-primary hover:text-baco-secondary">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <UserPlus className="w-8 h-8 text-baco-primary" />
            <h1 className="text-3xl font-bold text-gray-900">BACO Membership Application</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join the Bahamas Association of Compliance Officers. Please complete this application form 
            and submit the required supporting documents.
          </p>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Already have an account? 
              <Link href="/auth">
                <Button variant="link" className="pl-1 text-baco-primary hover:text-baco-secondary">
                  Sign in here
                </Button>
              </Link>
            </p>
          </div>
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
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="homePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Phone *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(242) 555-0123" {...field} data-testid="input-home-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cellPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cell Phone *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(242) 555-0123" {...field} data-testid="input-cell-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="homeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Address *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Complete home address including street, city, and postal code" 
                            {...field} 
                            data-testid="textarea-home-address"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Professional Information</h3>
                  <FormField
                    control={form.control}
                    name="professionalQualifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>List of Professional Qualifications *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List all your professional qualifications, certifications, degrees, etc."
                            {...field} 
                            data-testid="textarea-qualifications"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="professionalMemberships"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>List of Memberships in other Professions/Organizations *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List all professional memberships and organizational affiliations"
                            {...field} 
                            data-testid="textarea-memberships"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentEmployer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Employer *</FormLabel>
                          <FormControl>
                            <Input placeholder="Company/Organization name" {...field} data-testid="input-employer" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="positionHeld"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position Held *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your current job title" {...field} data-testid="input-position" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="durationInPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration in this position *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2 years 6 months" {...field} data-testid="input-duration" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            <SelectItem value="regulator">Regulator Observer - Free</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <p><strong>Note:</strong> Regulators enjoy Observer Status with benefits of Associate Members without membership fees.</p>
                  </div>
                </div>

                {/* Background Check Questions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Background Information</h3>
                  <div className="text-sm text-gray-600 mb-4">
                    Please answer the following questions honestly. If you answer "Yes" to any question, please provide explanation in the text area below.
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="professionalMisconductSubject"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 border rounded-lg p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-misconduct-subject"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              Have you ever been the subject of professional misconduct findings? *
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="professionalMisconductPending"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 border rounded-lg p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-misconduct-pending"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              Is there any pending matter of professional misconduct to be addressed? *
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="criminalConviction"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 border rounded-lg p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-criminal-conviction"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              Have you ever been convicted of a criminal offence? *
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bankruptcyHistory"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 border rounded-lg p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-bankruptcy"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              Have you ever been adjudged bankrupt (individually or within a partnership)? *
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="regulatoryRegistration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 border rounded-lg p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-regulatory"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              Are you or your employer currently registered with a regulatory/supervisory body? *
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {showExplanation && (
                    <FormField
                      control={form.control}
                      name="backgroundExplanation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Please explain your "Yes" answers above *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide detailed explanation for any 'Yes' answers above"
                              {...field} 
                              data-testid="textarea-explanation"
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* CEO/Managing Director Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">CEO/Managing Director Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ceoName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of CEO/Managing Director/Other *</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} data-testid="input-ceo-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ceoTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., CEO, Managing Director, etc." {...field} data-testid="input-ceo-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Application Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Application Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="applicationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Application *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-application-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="applicantSignature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Signature of Applicant *</FormLabel>
                          <FormControl>
                            <Input placeholder="Type your full name as electronic signature" {...field} data-testid="input-signature" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Declaration and Agreement */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Declaration and Agreement</h3>
                  
                  {/* Required Documents Notice */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Required Supporting Documents</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Please submit the following documents to <strong>bacobahamas@gmail.com</strong>:
                    </p>
                    <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                      <li>A current resume that fully outlines job positions and responsibilities</li>
                      <li>Copies of relevant pages of a valid passport</li>
                      <li>Copies of professional/academic certificates</li>
                      <li>Current Police Certificate issued within the past six months</li>
                      <li>The names and contact information of at least two (2) references</li>
                    </ul>
                  </div>
                  
                  {/* Official Declarations */}
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-3">
                    <div>
                      <p className="font-semibold mb-2">Truth Declaration:</p>
                      <p>I declare that the information contained in this application is true and complete to the best of my knowledge and belief. I accept that any statement contained in this application found to be false may invalidate this application and any decision made upon the basis of the same.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold mb-2">Constitution Agreement:</p>
                      <p>I confirm my agreement to abide by the Constitution, Mission Statement, Objectives and Regulations of Bahamas Association of Compliance Officers (BACO) in particular those relating to the promotion of the importance of compliance and to continuing professional development and training.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold mb-2">Compliance Commitment:</p>
                      <p>I confirm that I will comply with the legal and regulatory requirements imposed upon Compliance Professionals and or Money Laundering Reporting Officers.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="truthDeclaration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 border rounded-lg p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-truth-declaration"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">
                              I declare that the information contained in this application is true and complete to the best of my knowledge and belief *
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="constitutionAgreement"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 border rounded-lg p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-constitution-agreement"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">
                              I confirm my agreement to abide by the Constitution, Mission Statement, Objectives and Regulations of BACO *
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="complianceCommitment"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 border rounded-lg p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-compliance-commitment"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">
                              I confirm that I will comply with the legal and regulatory requirements imposed upon Compliance Professionals *
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
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