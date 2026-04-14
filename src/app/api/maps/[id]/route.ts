import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('maps')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[API] Delete error:', JSON.stringify(error));
    return NextResponse.json({ error: 'Failed to delete map' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action_plan, extracted_profile, narrative, name, folder_id } = body as {
    action_plan?: unknown;
    extracted_profile?: unknown;
    narrative?: unknown;
    name?: unknown;
    folder_id?: unknown;
  };

  // Build update payload with only provided fields
  const updatePayload: Record<string, unknown> = {};

  if (action_plan !== undefined) {
    if (
      typeof action_plan !== 'object' ||
      action_plan === null ||
      !Array.isArray((action_plan as { headline_examples?: unknown[] }).headline_examples) ||
      !Array.isArray((action_plan as { viral_term_examples?: unknown[] }).viral_term_examples) ||
      !Array.isArray((action_plan as { script_rewrites?: unknown[] }).script_rewrites)
    ) {
      return NextResponse.json({ error: 'Invalid action_plan structure' }, { status: 400 });
    }
    updatePayload.action_plan = JSON.stringify(action_plan);
  }

  if (extracted_profile !== undefined) {
    if (typeof extracted_profile !== 'object' || extracted_profile === null) {
      return NextResponse.json({ error: 'Invalid extracted_profile' }, { status: 400 });
    }
    updatePayload.extracted_profile = JSON.parse(JSON.stringify(extracted_profile));
  }

  if (narrative !== undefined) {
    if (typeof narrative !== 'string') {
      return NextResponse.json({ error: 'Invalid narrative' }, { status: 400 });
    }
    updatePayload.narrative = narrative;
  }

  if (name !== undefined) {
    if (typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    updatePayload.name = name.trim() || null;
  }

  if (folder_id !== undefined) {
    if (folder_id !== null && typeof folder_id !== 'string') {
      return NextResponse.json({ error: 'Invalid folder_id' }, { status: 400 });
    }
    updatePayload.folder_id = folder_id;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('maps')
    .update(updatePayload)
    .eq('id', id)
    .select('*');

  if (error) {
    console.error('[API] Update error:', JSON.stringify(error));
    return NextResponse.json({ error: 'Failed to update map', details: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Map not found' }, { status: 404 });
  }

  return NextResponse.json({ map: data[0] });
}
