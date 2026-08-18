import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:"Non autorisé"},{status:401});
  const body=await req.json();
  const amountCents=Math.round(Number(body.amount)*100);
  if(!body.label||!body.category||!Number.isFinite(amountCents)||amountCents<0)
    return NextResponse.json({error:"Charge invalide"},{status:400});
  if(body.listingId){
    const {data:listing}=await supabase.from("listings").select("id").eq("id",body.listingId).eq("host_id",user.id).maybeSingle();
    if(!listing) return NextResponse.json({error:"Logement invalide"},{status:403});
  }
  const {data,error}=await supabase.from("host_expenses").insert({host_id:user.id,listing_id:body.listingId||null,category:body.category,label:body.label,amount_cents:amountCents,expense_date:body.expenseDate||new Date().toISOString().slice(0,10),recurring:!!body.recurring,recurrence:body.recurrence||null,notes:body.notes||null}).select().single();
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({expense:data},{status:201});
}
