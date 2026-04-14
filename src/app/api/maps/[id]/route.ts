import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to validate authentication.' }, { status: 500 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action_plan, client_updated_at, extracted_profile, narrative } = body as {
    action_plan?: unknown;
    client_updated_at?: unknown;
    extracted_profile?: unknown;
    narrative?: unknown;
  };

  // client_updated_at can be null for maps created before versioning was added
  const clientTs = typeof client_updated_at === 'string' && client_updated_at.trim() ? client_updated_at.trim() : null;

  // Build update payload with only provided fields
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

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
    updatePayload.extracted_profile = extracted_profile;
  }

  if (narrative !== undefined) {
    if (typeof narrative !== 'string') {
      return NextResponse.json({ error: 'Invalid narrative' }, { status: 400 });
    }
    updatePayload.narrative = narrative;
  }

  if (Object.keys(updatePayload).length <= 1) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  let query = supabaseAdmin
    .from('maps')
    .update(updatePayload)
    .eq('id', id);

  // Optimistic concurrency: only guard when client has a valid timestamp.
  // The updated_at column is NOT NULL DEFAULT now(), so IS NULL never matches.
  // When clientTs is null (old maps or first edit), skip the version check.
  if (clientTs) {
    query = query.eq('updated_at', clientTs);
  }

  const { data, error } = await query.select('*');

  if (error) {
    console.error('[API] Update error:', error);
    return NextResponse.json({ error: 'Failed to update map' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    const { data: existingMap, error: existenceError } = await supabaseAdmin
      .from('maps')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (existenceError && existenceError.code !== 'PGRST116') {
      console.error('[API] Existence check error:', existenceError);
      return NextResponse.json({ error: 'Failed to check map state' }, { status: 500 });
    }

    if (!existingMap) {
      return NextResponse.json({ error: 'map not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'map was modified' }, { status: 409 });
  }

  return NextResponse.json({ map: data[0] });
}
