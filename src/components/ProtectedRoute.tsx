import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingScreen } from "./ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAuth = async () => {
    console.log("6");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        console.log("3");
        setIsAuthenticated(true);
        console.log({ session });
        await checkUserRole(session.user.id);
      } else {
        console.log("5");
        setIsAuthenticated(false);
        setIsAdmin(false);
        setLoading(false);
      }
    } catch (error) {
      console.log("4");
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const checkUserRole = async (userId: string) => {
    console.log("11");
    try {
      console.log("10");
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["okk", "sekjend", "ketum"]);

      if (error) throw error;
      console.log({ data });
      setIsAdmin(data && data.length > 0);
      console.log("8");
    } catch (error) {
      console.error("Role check error:", error);
      console.log("8");
      setIsAdmin(false);
    } finally {
      console.log("7");
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("1");
      setLoading(true);
      if (session) {
        console.log("2");
        setIsAuthenticated(true);
        await checkUserRole(session.user.id);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  console.log(loading, " loading  ", "->>>");
  console.log(isAdmin, " isAdmin  ", "->>>");
  console.log(isAuthenticated, " isAuthenticated  ", "->>>");

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
