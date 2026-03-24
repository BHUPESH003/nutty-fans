import { AgeGateScreen } from '@/components/auth/AgeGateScreen';

import { getMosaicImages } from './actions';

export default async function AgeGatePage() {
  const initialMosaicUrls = await getMosaicImages();
  return <AgeGateScreen initialMosaicUrls={initialMosaicUrls} />;
}
