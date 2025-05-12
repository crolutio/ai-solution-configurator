import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Type definitions
export interface ServiceResource {
  Role: string;
  "% time": number;
  weeklyRate?: number;
  profileId?: string;
  profileName?: string;
  percentTime?: number;
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

// Calculate price based on resources and time
const calculatePrice = (resources: ServiceResource[], timeInWeeks: number): number => {
  console.log('Calculating price for resources:', JSON.stringify(resources));
  console.log('Time in weeks:', timeInWeeks);
  
  if (!resources || resources.length === 0) {
    console.log('No resources found for price calculation');
    return 0;
  }
  
  // Calculate cost for each resource
  const totalCost = resources.reduce((total, resource) => {
    if (!resource.Role) {
      console.log('Invalid resource found (no Role):', resource);
      return total;
    }
    
    // Get percentage as decimal (0-1)
    const percentage = resource.percentTime || resource["% time"] / 100 || 0;
    // Use weeklyRate for calculation
    const weeklyRate = resource.weeklyRate || 0;
    
    console.log(`Resource: ${resource.Role}, Percentage: ${percentage * 100}%, Weekly Rate: $${weeklyRate}/week`);
    
    if (percentage <= 0 || weeklyRate <= 0) {
      console.log(`Skipping resource ${resource.Role} due to invalid percentage or rate`);
      return total;
    }
    
    // Calculate cost as weeklyRate * percentage * timeInWeeks
    const resourceCost = weeklyRate * percentage * timeInWeeks;
    
    console.log(`Resource: ${resource.Role}, Cost: $${resourceCost.toFixed(2)} (${percentage * 100}% of $${weeklyRate}/week for ${timeInWeeks} weeks)`);
    
    return total + resourceCost;
  }, 0);
  
  console.log(`Total calculated cost: $${totalCost.toFixed(2)}`);
  
  // Round to 2 decimal places for currency
  return Math.round(totalCost * 100) / 100;
};

// Fetch resources from The-Cliff-Resources collection
async function getResourcesData(): Promise<Map<string, number>> {
  try {
    console.log('Fetching resources from The-Cliff-Resources...');
    const resourcesRef = collection(db, 'The-Cliff-Resources');
    const snapshot = await getDocs(resourcesRef);
    
    if (snapshot.empty) {
      console.log('No resources found in The-Cliff-Resources');
      return new Map();
    }
    
    console.log(`Found ${snapshot.size} resource documents`);
    
    const resourcesMap = new Map<string, number>();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Resource document ${doc.id}:`, data);
      
      // The document ID is the resource role name (e.g., "AI Engineer")
      const role = doc.id;
      // Use weeklyRate field from the document
      const weeklyRate = typeof data.weeklyRate === 'number' ? data.weeklyRate : 0;
      
      console.log(`Processed resource: ${role}, weeklyRate: ${weeklyRate}`);
      
      if (role && weeklyRate > 0) {
        resourcesMap.set(role, weeklyRate);
        console.log(`Added resource to map: ${role} = $${weeklyRate}/week`);
      } else {
        console.log(`Skipped resource due to invalid data: ${role}`);
      }
    });
    
    console.log(`Successfully loaded ${resourcesMap.size} resource rates:`);
    resourcesMap.forEach((rate, role) => {
      console.log(`- ${role}: $${rate}/week`);
    });
    
    return resourcesMap;
  } catch (error) {
    console.error('Error fetching resources:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return new Map();
  }
}

// Main data fetching function
export async function getFirebaseServices(): Promise<ServiceLayer[]> {
  try {
    console.log('======= STARTING SERVICE FETCH =======');
    
    console.log('1. Fetching resource rates...');
    const resourceRates = await getResourcesData();
    console.log(`Resource map size: ${resourceRates.size}`);
    
    console.log('2. Fetching services from The-Cliff-Services...');
    const servicesRef = collection(db, 'The-Cliff-Services');
    const snapshot = await getDocs(servicesRef);
    
    if (snapshot.empty) {
      console.log('No documents found in The-Cliff-Services collection');
      return [];
    }
    
    console.log(`Found ${snapshot.size} service documents`);
    
    // Create a map to group deliverables by category/layer
    const layerMap = new Map<string, ServiceDeliverable[]>();
    
    // Process each service document
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\nProcessing service ${doc.id}:`, data);
      
      // Extract time from document
      const timeInWeeks = typeof data.timeInWeeks === 'number' 
        ? data.timeInWeeks 
        : (typeof data.time_in_weeks === 'number'
            ? data.time_in_weeks
            : (typeof data.time === 'number' ? data.time : 0));
      
      console.log(`Time in weeks: ${timeInWeeks}`);
      
      // Process resources
      let resources: ServiceResource[] = [];
      
      console.log('Processing resources:', data.resources);
      
      // Handle different resource formats
      try {
        if (Array.isArray(data.resources)) {
          console.log('Resources are in array format');
          
          resources = data.resources.map(res => {
            console.log('Processing resource item:', res);
            
            // If resource is a string, it's directly the role name
            if (typeof res === 'string') {
              const weeklyRate = resourceRates.get(res) || 0;
              console.log(`String resource: ${res}, weeklyRate: ${weeklyRate}`);
              
              return {
                Role: res,
                "% time": 100,
                percentTime: 1, // 100% as decimal
                weeklyRate: weeklyRate
              };
            }
            
            // If resource is an object
            if (typeof res === 'object' && res !== null) {
              // Extract profile information
              const profileId = res.profileId || '';
              const profileName = res.profileName || '';
              
              // Get the role name from profileName or profileId
              const role = profileName || profileId || '';
              
              // Get percentage as decimal (already in decimal format in the data)
              const percentTimeDecimal = typeof res.percentTime === 'number' ? res.percentTime : 0;
              // Convert to percentage for display - divide by 100 to fix display issue
              const percentTime = percentTimeDecimal;
              
              const weeklyRate = resourceRates.get(role) || 0;
              
              console.log(`Object resource: ${role}, percentTime: ${percentTimeDecimal} (${percentTime}%), weeklyRate: ${weeklyRate}`);
              
              return {
                Role: role,
                "% time": percentTime,
                percentTime: percentTimeDecimal,
                profileId,
                profileName,
                weeklyRate: weeklyRate
              };
            }
            
            console.log('Unknown resource format:', res);
            return {
              Role: 'Unknown',
              "% time": 0,
              percentTime: 0,
              weeklyRate: 0
            };
          });
        } else if (data.resources && typeof data.resources === 'object') {
          console.log('Resources are in object format');
          
          // Handle object format where keys are role names and values are percentages
          resources = Object.entries(data.resources)
            .filter(([key, value]) => {
              if (key === 'time' || typeof value !== 'number') {
                console.log(`Skipping non-percentage resource key: ${key}`);
                return false;
              }
              return true;
            })
            .map(([key, value]) => {
              const percentValue = value as number;
              const percentTimeDecimal = percentValue <= 1 ? percentValue : percentValue / 100;
              const weeklyRate = resourceRates.get(key) || 0;
              
              // Use direct decimal value for display, no multiplication
              console.log(`Object entry resource: ${key}, percentTime: ${percentTimeDecimal} (${percentTimeDecimal}%), weeklyRate: ${weeklyRate}`);
              
              return {
                Role: key,
                "% time": percentTimeDecimal,
                percentTime: percentTimeDecimal,
                weeklyRate: weeklyRate
              };
            });
        } else {
          console.log('No resources or unknown format:', data.resources);
        }
      } catch (resourceError) {
        console.error('Error processing resources:', resourceError);
        console.error('Problematic resources data:', data.resources);
      }
      
      // Filter out invalid resources
      resources = resources.filter(r => {
        const isValid = r.Role && r.Role !== 'Unknown' && r.percentTime && r.percentTime > 0;
        if (!isValid) {
          console.log(`Filtering out invalid resource: ${JSON.stringify(r)}`);
        }
        return isValid;
      });
      
      console.log(`Final processed resources (${resources.length}):`, resources);
      
      // Create ServiceDeliverable object
      const deliverable: ServiceDeliverable = {
        Deliverable: data.name || '',
        "Service Description": data.description || '',
        "Time (in Weeks)": timeInWeeks,
        Resources: resources,
        id: doc.id,
        firestoreId: doc.id,
        layer: data.layer || 'Uncategorized'
      };
      
      // Calculate price based on resources and time
      const calculatedPrice = calculatePrice(resources, timeInWeeks);
      deliverable.price = calculatedPrice;
      
      console.log(`Service ${deliverable.Deliverable} price calculated: $${calculatedPrice}`);
      
      // Add to layer map
      const layer = data.layer || 'Uncategorized';
      console.log(`Adding to layer: ${layer}`);
      
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
    
    console.log('Successfully processed all services into layers:');
    serviceLayers.forEach(layer => {
      console.log(`- Layer: ${layer.Layer}, Services: ${layer.Deliverables.length}`);
    });
    
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