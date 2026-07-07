import { getOrCreateQr } from '@/lib/qr';
import QrDisplay from '@/components/QrDisplay';

export default async function Home() {
  const qr = await getOrCreateQr();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <QrDisplay initialQr={qr} />
    </div>
  );
}
