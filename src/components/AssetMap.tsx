import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    fetchAssets();
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    
    setMapLoaded(true);
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

  useEffect(() => {
    if (!mapLoaded || loading) return;

    // Dynamically import and initialize Leaflet
    import('leaflet').then((L) => {
      // Fix icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Create map
      const mapContainer = document.getElementById('map-container');
      if (!mapContainer) return;

      // Clear any existing map
      mapContainer.innerHTML = '';

      const map = L.map('map-container').setView(center, 9);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add markers
      assets.forEach((asset) => {
        const marker = L.marker([asset.latitude, asset.longitude]).addTo(map);
        
        const popupContent = `
          <div style="padding: 8px;">
            <h3 style="font-weight: 600; font-size: 18px; margin-bottom: 8px;">${asset.asset_name}</h3>
            <div style="font-size: 14px; line-height: 1.5;">
              <p><span style="font-weight: 500;">Type:</span> ${asset.asset_type.replace("_", " ")}</p>
              <p><span style="font-weight: 500;">Village:</span> ${asset.village_name}</p>
              <p><span style="font-weight: 500;">Status:</span> 
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: ${getStatusColor(asset.status).replace('bg-', '#')}; color: white; font-size: 12px;">
                  ${asset.status.replace("_", " ")}
                </span>
              </p>
              ${asset.description ? `<p style="margin-top: 8px; color: #666;">${asset.description}</p>` : ''}
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
      });
    });
  }, [mapLoaded, loading, assets]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div id="map-container" style={{ height: '100%', width: '100%' }} />
  );
};

export default AssetMap;
