import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('folders')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }

  return NextResponse.json({ folders: data });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('folders')
    .insert({ name: body.name.trim() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }

  return NextResponse.json({ folder: data });
}
