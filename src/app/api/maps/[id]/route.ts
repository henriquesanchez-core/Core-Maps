import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action_plan } = body;

  if (!action_plan) {
    return NextResponse.json({ error: 'action_plan is required' }, { status: 400 });
  }

  if (
    !Array.isArray(action_plan.headline_examples) ||
    !Array.isArray(action_plan.viral_term_examples) ||
    !Array.isArray(action_plan.script_rewrites)
  ) {
    return NextResponse.json({ error: 'Invalid action_plan structure' }, { status: 400 });
  }

  const { error } = await supabase
    .from('maps')
    .update({ action_plan: JSON.stringify(action_plan) })
    .eq('id', id);

  if (error) {
    console.error('[API] Update error:', error);
    return NextResponse.json({ error: 'Failed to update map' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
