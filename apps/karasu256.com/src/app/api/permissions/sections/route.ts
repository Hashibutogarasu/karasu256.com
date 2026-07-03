import { NextResponse } from 'next/server';
import { getRegisteredSections } from '@Hashibutogarasu/db';

export async function GET() {
  const sections = getRegisteredSections().map((s) => ({
    key: s.key,
    labelKey: s.labelKey,
    descriptionKey: s.descriptionKey,
    readMask: Number(s.readMask),
    writeMask: Number(s.writeMask),
  }));
  return NextResponse.json(sections);
}
