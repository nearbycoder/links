import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { ThemeToggle } from '@/components/theme-toggle'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

const signUpSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const Route = createFileRoute('/auth/sign-up')({
  component: RouteComponent,
})

type SignUpFormData = z.infer<typeof signUpSchema>

function RouteComponent() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { data: authData, error: authError } =
        await authClient.signUp.email({
          email: data.email,
          password: data.password,
          name: data.name,
        })

      if (authError) {
        setError(authError.message || 'An error occurred during sign up')
      }

      if (authData) {
        setSuccess(true)
        router.navigate({ to: '/' })
        // Redirect will be handled by the auth system
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome aboard!
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Your account has been created successfully. Please check your
              email to verify your account.
            </p>
          </div>
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  We've sent a verification link to your email address.
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth/login">Continue to Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand Section */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
              <div className="h-4 w-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Get started with your free account today
          </p>
        </div>

        {/* Sign Up Form */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-slate-900 dark:text-white">
              Sign up
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              Enter your information to create your account
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        Full name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Enter your full name"
                            className="pl-10 h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                        </div>
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
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        Email address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10 h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a password"
                            className="pl-10 pr-10 h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff /> : <Eye />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        Confirm password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            className="pl-10 pr-10 h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-3 h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showConfirmPassword ? <EyeOff /> : <Eye />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 mb-4 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm mt-0.5 text-slate-600 dark:text-slate-400">
                          I agree to the{' '}
                          <a
                            href="/terms"
                            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline"
                          >
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a
                            href="/privacy"
                            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline"
                          >
                            Privacy Policy
                          </a>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                {/* 
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-11 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                    type="button"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                    type="button"
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </Button>
                </div> */}
              </CardFooter>
            </form>
          </Form>
        </Card>

        {/* Sign in link */}
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
