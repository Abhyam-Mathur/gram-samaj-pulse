import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BarChart3, TrendingUp, MapPin, Users, LogOut, Map as MapIcon } from "lucide-react";
import DemandChart from "@/components/DemandChart";
import ForecastDisplay from "@/components/ForecastDisplay";
import StatsCard from "@/components/StatsCard";

interface District {
  id: string;
  name: string;
  blocks: any; // Json type from Supabase
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedBlock, setSelectedBlock] = useState<string>("All");
  const [userRole, setUserRole] = useState<string>("public");

  useEffect(() => {
    checkAuth();
    fetchDistricts();
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

  const fetchDistricts = async () => {
    const { data, error } = await supabase
      .from("districts")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load districts");
      return;
    }

    if (data && data.length > 0) {
      setDistricts(data);
      setSelectedDistrict(data[0].id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const currentDistrict = districts.find(d => d.id === selectedDistrict);
  const blocks = Array.isArray(currentDistrict?.blocks) ? currentDistrict.blocks : [];

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
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">GramPredict</h1>
              <p className="text-sm text-muted-foreground">
                MGNREGA Demand Forecasting
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/assets")}>
              <MapIcon className="mr-2 h-4 w-4" />
              View Assets
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-2 block">District</label>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Block</label>
            <Select value={selectedBlock} onValueChange={setSelectedBlock}>
              <SelectTrigger>
                <SelectValue placeholder="Select block" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Blocks</SelectItem>
                {blocks.map((block: string) => (
                  <SelectItem key={block} value={block}>
                    {block}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <StatsCard
            title="Total Districts"
            value={districts.length.toString()}
            icon={MapPin}
            trend="+2 this year"
          />
          <StatsCard
            title="Active Blocks"
            value={blocks.length.toString()}
            icon={Users}
            trend="Monitoring"
          />
          <StatsCard
            title="Forecast Accuracy"
            value="87%"
            icon={TrendingUp}
            trend="+5% this month"
          />
        </div>

        {/* Charts and Forecast */}
        <Tabs defaultValue="demand" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="demand">Historical Data</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>
          
          <TabsContent value="demand" className="space-y-6">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Historical Person-Days Demand</CardTitle>
                <CardDescription>
                  Last 12 months of MGNREGA employment data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DemandChart 
                  districtId={selectedDistrict} 
                  blockName={selectedBlock === "All" ? undefined : selectedBlock}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <ForecastDisplay 
              districtId={selectedDistrict}
              blockName={selectedBlock === "All" ? undefined : selectedBlock}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
