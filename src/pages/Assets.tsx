import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, ArrowLeft, Plus } from "lucide-react";
import AssetMap from "@/components/AssetMap";
import AssetDialog from "@/components/AssetDialog";

const Assets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("public");
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Fetch user role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roles) {
      setUserRole(roles.role);
    }

    setLoading(false);
  };

  const canEdit = userRole === "admin" || userRole === "panchayat_officer";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Rural Assets</h1>
                <p className="text-sm text-muted-foreground">
                  Geolocation-based asset monitoring
                </p>
              </div>
            </div>
          </div>
          {canEdit && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          )}
        </div>
      </header>

      {/* Map Content */}
      <main className="h-[calc(100vh-80px)]">
        <AssetMap />
      </main>

      {/* Add Asset Dialog */}
      {canEdit && (
        <AssetDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
        />
      )}
    </div>
  );
};

export default Assets;
