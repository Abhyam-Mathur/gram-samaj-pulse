import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { toast } from "sonner";

interface DemandChartProps {
  districtId: string;
  blockName?: string;
}

interface ChartData {
  month: string;
  personDays: number;
}

const DemandChart = ({ districtId, blockName }: DemandChartProps) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [districtId, blockName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("mgnrega_data")
        .select("date, person_days, block_name")
        .eq("district_id", districtId)
        .order("date", { ascending: true })
        .limit(12);

      if (blockName) {
        query = query.eq("block_name", blockName);
      }

      const { data: mgnregaData, error } = await query;

      if (error) throw error;

      // Aggregate by month
      const aggregated = new Map<string, number>();
      mgnregaData?.forEach((row) => {
        const monthKey = format(new Date(row.date), "MMM yyyy");
        aggregated.set(
          monthKey,
          (aggregated.get(monthKey) || 0) + row.person_days
        );
      });

      const chartData = Array.from(aggregated.entries())
        .map(([month, personDays]) => ({
          month,
          personDays,
        }))
        .slice(-12);

      setData(chartData);
    } catch (error) {
      toast.error("Failed to load demand data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
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
        <Bar dataKey="personDays" name="Person-Days" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DemandChart;
