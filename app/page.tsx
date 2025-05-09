import { getFirebaseServices } from '@/lib/getServices';
import { EnterpriseAgentConfigurator } from '@/components/enterprise-agent-configurator';

export default async function ConfiguratorPage() {
  const serviceLayersData = await getFirebaseServices();
  
  return (
    <EnterpriseAgentConfigurator initialServiceLayers={serviceLayersData} />
  );
}
