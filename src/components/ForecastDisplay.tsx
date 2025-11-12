import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from "recharts";
import { toast } from "sonner";
import { Download, RefreshCw } from "lucide-react";

interface ForecastDisplayProps {
  districtId: string;
  blockName?: string;
}

const ForecastDisplay = ({ districtId, blockName }: ForecastDisplayProps) => {
  const [forecastMonths, setForecastMonths] = useState(6);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (districtId) {
      fetchForecast();
    }
  }, [districtId, blockName, forecastMonths]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-forecast", {
        body: {
          districtId,
          blockName: blockName || "All",
          months: forecastMonths,
        },
      });

      if (error) throw error;

      setForecastData(data.forecast);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate forecast");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!forecastData.length) return;

    const csv = [
      ["Month", "Predicted Person-Days"],
      ...forecastData.map((d) => [d.month, d.predicted]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forecast-${districtId}-${Date.now()}.csv`;
    a.click();
    toast.success("Forecast exported successfully");
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Demand Forecast</CardTitle>
            <CardDescription>
              AI-powered SARIMA predictions for person-days demand
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={forecastMonths.toString()}
              onValueChange={(v) => setForecastMonths(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 6, 9, 12].map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m} months
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchForecast} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={exportCSV} disabled={!forecastData.length}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-sm" />
              <YAxis className="text-sm" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar
                dataKey="predicted"
                name="Predicted Person-Days"
                fill="hsl(var(--accent))"
                radius={[8, 8, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ForecastDisplay;
