import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('folders')
    .update({ name: body.name.trim() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }

  return NextResponse.json({ folder: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Move maps out of this folder before deleting
  await supabaseAdmin
    .from('maps')
    .update({ folder_id: null })
    .eq('folder_id', id);

  const { error } = await supabaseAdmin
    .from('folders')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
