"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Scale } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

interface LawQuote {
  text: string;
  author: string;
}

const LAW_QUOTES: LawQuote[] = [
  {
    text: "Jurisprudence is the knowledge of things divine and human, the science of the just and the unjust.",
    author: "Ulpian, Digest of Roman Law"
  },
  {
    text: "The law is reason, free from passion.",
    author: "Aristotle"
  },
  {
    text: "Justice is the constant and perpetual will to allot to every man his due.",
    author: "Domitius Ulpianus"
  },
  {
    text: "If we desire respect for the law, we must first make the law respectable.",
    author: "Louis D. Brandeis"
  },
  {
    text: "The law is not a monument, but a garden. It must be cultivated, it must be tended.",
    author: "Justice Felix Frankfurter"
  },
  {
    text: "Let justice be done though the heavens fall.",
    author: "Latin Legal Maxim"
  },
  {
    text: "Where law ends, tyranny begins.",
    author: "John Locke"
  },
  {
    text: "The good of the people is the chief law.",
    author: "Cicero"
  },
  {
    text: "Injustice anywhere is a threat to justice everywhere.",
    author: "Martin Luther King Jr."
  },
  {
    text: "The life of the law has not been logic; it has been experience.",
    author: "Oliver Wendell Holmes Jr."
  },
  {
    text: "Let reverence for the laws be breathed by every mother to the lisping babe that prattles on her lap.",
    author: "Abraham Lincoln"
  },
  {
    text: "If we are to keep our democracy, there must be one commandment: Thou shalt not decide a case by power.",
    author: "Learned Hand"
  },
  {
    text: "Real change, enduring change, happens one step at a time.",
    author: "Justice Ruth Bader Ginsburg"
  },
  {
    text: "The final cause of law is the welfare of society.",
    author: "Benjamin N. Cardozo"
  },
  {
    text: "We are in bondage to the law in order that we may be free.",
    author: "Cicero"
  },
  {
    text: "Laws are like cobwebs, which may catch small flies, but let wasps and hornets break through.",
    author: "Solon"
  },
  {
    text: "Judges ought to be more learned than witty, more reverend than plausible, and more advised than confident.",
    author: "Francis Bacon"
  },
  {
    text: "We don't accomplish anything in this world alone... and whatever happens is the result of the whole tapestry of one's life.",
    author: "Justice Sandra Day O'Connor"
  },
  {
    text: "In recognizing the humanity of our fellow beings, we pay ourselves the highest tribute.",
    author: "Justice Thurgood Marshall"
  },
  {
    text: "Be you never so high, the law is above you.",
    author: "Lord Denning"
  },
  {
    text: "Nothing can destroy a government more quickly than its failure to observe its own laws.",
    author: "Tom Clark"
  },
  {
    text: "Reason is the life of the law, nay the common law itself is nothing else but reason.",
    author: "Sir Edward Coke"
  }
];

const loginSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login: authLogin } = useAuth();
  const [quote] = useState<LawQuote>(() => {
    const randomIndex =
      crypto.getRandomValues(new Uint32Array(1))[0] % LAW_QUOTES.length;
    return LAW_QUOTES[randomIndex];
  });

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      await authLogin(data);
    },
    onError: (err: Error) => {
      console.error(
        "%c[Client Auth] Login error:",
        "color: #ef4444; font-weight: bold;",
        err.message
      );
    }
  });

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left Pane: Branding Sidebar */}
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:col-span-5 lg:flex border-r border-border/20">
        <div className="flex items-center gap-3 font-sans text-2xl font-bold tracking-tight text-primary-foreground">
          <div className="size-11 rounded-full bg-white/10 text-primary-foreground flex items-center justify-center font-bold border border-white/20">
            <Scale className="size-6" />
          </div>
          <div>
            <div>Laal Global Technologies</div>
            <p className="text-[10px] uppercase tracking-widest text-primary-foreground/70 font-semibold">
              Secure Client & Internal Portal
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="font-serif text-3xl leading-relaxed tracking-wide text-primary-foreground/90 italic">
            &quot;{quote.text}&quot;
          </p>
          <p className="font-sans text-xs uppercase tracking-widest text-primary-foreground/70 font-bold">
            — {quote.author}
          </p>
        </div>

        <div className="text-xs text-primary-foreground/60 tracking-tight flex items-center justify-between font-medium">
          <span>Secure Firm Portal v1.0</span>
          <span>© {new Date().getFullYear()} LGA</span>
        </div>
      </div>

      {/* Right Pane: Login Form Surface */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:col-span-7">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-border bg-card text-card-foreground shadow-xs py-4">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Firm Account Sign In
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium">
                Enter your credentials to access your legal terminal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                method="POST"
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold text-foreground"
                  >
                    Professional Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    {...register("email")}
                    disabled={loginMutation.isPending}
                    className="bg-card border-border text-foreground focus-visible:ring-primary/40 rounded-full"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive font-semibold">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs font-bold text-foreground"
                  >
                    Security Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    {...register("password")}
                    disabled={loginMutation.isPending}
                    className="bg-card border-border text-foreground focus-visible:ring-primary/40 rounded-full"
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive font-semibold">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-sm tracking-tight h-10 mt-2 shadow-xs"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending
                    ? "Authenticating..."
                    : "Sign In to LGA Terminal"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
