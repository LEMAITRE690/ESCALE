import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){
 const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser();
 if(!user) return NextResponse.json({error:"Non autorisé"},{status:401});
 const b=await req.json(); const patch:any={updated_at:new Date().toISOString()};
 if(typeof b.privateNotes==="string") patch.private_notes=b.privateNotes.slice(0,5000);
 if(Array.isArray(b.tags)) patch.tags=b.tags.filter((x:any)=>typeof x==="string").slice(0,20);
 if(typeof b.phone==="string") patch.phone=b.phone.slice(0,50);
 if(typeof b.marketingConsent==="boolean") patch.marketing_consent=b.marketingConsent;
 const {data,error}=await supabase.from("crm_contacts").update(patch).eq("id",params.id).eq("host_id",user.id).select().maybeSingle();
 if(error) return NextResponse.json({error:error.message},{status:500});
 if(!data) return NextResponse.json({error:"Contact introuvable"},{status:404});
 return NextResponse.json({contact:data});
}
