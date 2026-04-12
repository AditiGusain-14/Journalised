import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { storageService } from "../services/storage";
import { toast } from "sonner";
import { motion } from "motion/react";

export function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      if (isSignup) {
        await storageService.register(email, password);
        toast.success("Account created successfully!");
      } else {
        await storageService.login(email, password);
        toast.success("Welcome back!");
      }
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-tight mb-3">
            Journalised
          </h1>
          <p className="text-muted-foreground text-sm font-light">
            {isSignup ? "Begin your journey" : "Welcome back"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-card border-0 shadow-sm transition-all duration-200 
                  focus:shadow-md focus:ring-2 focus:ring-primary/20 rounded-xl px-4"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-card border-0 shadow-sm transition-all duration-200 
                  focus:shadow-md focus:ring-2 focus:ring-primary/20 rounded-xl px-4"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 
              bg-primary hover:bg-primary/90"
          >
            {isSignup ? "Create Account" : "Sign In"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignup
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
