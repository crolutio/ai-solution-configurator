import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Type definitions
export interface ServiceResource {
  Role: string;
  "% time": number;
}

export interface ServiceDeliverable {
  Deliverable: string;
  "Service Description": string;
  "Time (in Weeks)": number;
  Resources: ServiceResource[];
  id?: string;
  price?: number;
  layer?: string;
  firestoreId?: string;
}

export interface ServiceLayer {
  Layer: string;
  Deliverables: ServiceDeliverable[];
}

// Helper functions
export const getAllDeliverables = (serviceLayers: ServiceLayer[]): ServiceDeliverable[] => {
  return serviceLayers.flatMap(layer => layer.Deliverables);
};

export const getDeliverablesByLayer = (serviceLayers: ServiceLayer[], layer: string): ServiceDeliverable[] => {
  return serviceLayers.find(l => l.Layer === layer)?.Deliverables || [];
};

export const getDeliverableById = (serviceLayers: ServiceLayer[], id: string): ServiceDeliverable | undefined => {
  return getAllDeliverables(serviceLayers).find(d => d.id === id);
};

export const calculateTotalCost = (serviceLayers: ServiceLayer[], selectedIds: string[]): number => {
  return getAllDeliverables(serviceLayers)
    .filter(d => selectedIds.includes(d.id || ''))
    .reduce((total, d) => total + (d.price || 0), 0);
};

export const calculateTotalTime = (serviceLayers: ServiceLayer[], selectedIds: string[]): number => {
  return getAllDeliverables(serviceLayers)
    .filter(d => selectedIds.includes(d.id || ''))
    .reduce((total, d) => total + d["Time (in Weeks)"], 0);
};

// Main data fetching function
export async function getFirebaseServices(): Promise<ServiceLayer[]> {
  try {
    console.log('Initializing Firebase fetch...');
    const servicesRef = collection(db, 'The-Cliff-Services');
    
    console.log('Fetching documents...');
    const snapshot = await getDocs(servicesRef);
    
    if (snapshot.empty) {
      console.log('No documents found in The-Cliff-Services collection');
      return [];
    }
    
    console.log(`Found ${snapshot.size} documents`);
    
    // Create a map to group deliverables by category/layer
    const layerMap = new Map<string, ServiceDeliverable[]>();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Processing document ${doc.id}:`, data);
      
      // Transform resources array or object
      let resources: ServiceResource[] = [];
      if (Array.isArray(data.resources)) {
        resources = data.resources;
      } else if (data.resources && typeof data.resources === 'object') {
        resources = Object.entries(data.resources)
          .filter(([key, value]) => key !== 'time' && typeof value === 'number')
          .map(([key, value]) => ({
            Role: key,
            "% time": value as number
          }));
      }
      
      // Create ServiceDeliverable object
      const deliverable: ServiceDeliverable = {
        Deliverable: data.name || '',
        "Service Description": data.description || '',
        "Time (in Weeks)": data.timeInWeeks || data.time_in_weeks || data.time || 0,
        Resources: resources,
        id: doc.id,
        firestoreId: doc.id,
        price: data.price || 0,
        layer: data.layer || 'Uncategorized'
      };
      
      // Add to layer map
      const layer = data.layer || 'Uncategorized';
      if (!layerMap.has(layer)) {
        layerMap.set(layer, []);
      }
      layerMap.get(layer)?.push(deliverable);
    });
    
    // Transform map into ServiceLayer array
    const serviceLayers: ServiceLayer[] = Array.from(layerMap.entries()).map(([layer, deliverables]) => ({
      Layer: layer,
      Deliverables: deliverables
    }));
    
    console.log('Successfully processed all documents');
    return serviceLayers;
    
  } catch (error) {
    console.error('Error fetching services from Firebase:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return [];
  }
} 