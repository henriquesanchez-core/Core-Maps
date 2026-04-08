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

  const { action_plan, client_updated_at } = body as {
    action_plan?: unknown;
    client_updated_at?: unknown;
  };

  if (!action_plan) {
    return NextResponse.json({ error: 'action_plan is required' }, { status: 400 });
  }
  if (typeof client_updated_at !== 'string' || !client_updated_at.trim()) {
    return NextResponse.json({ error: 'client_updated_at is required' }, { status: 400 });
  }

  if (
    typeof action_plan !== 'object' ||
    action_plan === null ||
    !Array.isArray((action_plan as { headline_examples?: unknown[] }).headline_examples) ||
    !Array.isArray((action_plan as { viral_term_examples?: unknown[] }).viral_term_examples) ||
    !Array.isArray((action_plan as { script_rewrites?: unknown[] }).script_rewrites)
  ) {
    return NextResponse.json({ error: 'Invalid action_plan structure' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('maps')
    .update({
      action_plan: JSON.stringify(action_plan),
      updated_at: now,
    })
    .eq('id', id)
    .eq('updated_at', client_updated_at)
    .select('*');

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
