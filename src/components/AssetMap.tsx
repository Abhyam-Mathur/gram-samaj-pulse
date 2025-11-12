import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue - do this before any map rendering
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Asset {
  id: string;
  asset_name: string;
  asset_type: string;
  status: string;
  latitude: number;
  longitude: number;
  village_name: string;
  description?: string;
}

const AssetMap = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAssets(data || []);
    } catch (error) {
      toast.error("Failed to load assets");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-500";
      case "needs_repair":
        return "bg-yellow-500";
      case "under_construction":
        return "bg-blue-500";
      case "damaged":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const center: [number, number] = assets.length > 0
    ? [assets[0].latitude, assets[0].longitude]
    : [23.3441, 85.3096]; // Default to Jharkhand center

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={9}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      {assets.map((asset) => (
        <Marker
          key={asset.id}
          position={[asset.latitude, asset.longitude]}
        >
          <Popup>
            <Card className="border-0 shadow-none p-2">
              <h3 className="font-semibold text-lg mb-2">{asset.asset_name}</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Type:</span> {asset.asset_type.replace("_", " ")}</p>
                <p><span className="font-medium">Village:</span> {asset.village_name}</p>
                <p><span className="font-medium">Status:</span></p>
                <Badge className={getStatusColor(asset.status)}>
                  {asset.status.replace("_", " ")}
                </Badge>
                {asset.description && (
                  <p className="mt-2 text-muted-foreground">{asset.description}</p>
                )}
              </div>
            </Card>
          </Popup>
        </Marker>
      ))}
      </MapContainer>
    </div>
  );
};

export default AssetMap;
