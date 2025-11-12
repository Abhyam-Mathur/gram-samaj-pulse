import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, MapPin, TrendingUp, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <BarChart3 className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">GramPredict</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Smart MGNREGA Demand Forecasting & Rural Asset Monitoring Platform
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/dashboard")}>
              View Dashboard
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="shadow-elevated">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Forecasting</h3>
              <p className="text-muted-foreground">
                ML-powered SARIMA predictions for accurate demand planning
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-elevated">
            <CardContent className="pt-6 text-center">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Asset Monitoring</h3>
              <p className="text-muted-foreground">
                Geolocation-based tracking of rural infrastructure
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-elevated">
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
              <p className="text-muted-foreground">
                Secure workflows for Admins, Officers, and Public users
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
