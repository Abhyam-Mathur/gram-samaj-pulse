import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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
    <MapContainer
      center={center}
      zoom={9}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
  );
};

export default AssetMap;
