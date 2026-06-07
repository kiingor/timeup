import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveLogo, ALLOWED_LOGO_TYPES, MAX_LOGO_BYTES } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin" || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  }
  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 1MB)." }, { status: 413 });
  }
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido (use PNG, JPG, WEBP ou SVG)." }, { status: 415 });
  }

  const url = await saveLogo(session.user.tenantId, file);
  return NextResponse.json({ url });
}
