import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { extractTextFromFile } from "@/lib/files/extract-text";

export const runtime = "nodejs";
export const maxDuration = 120; // Allow 2 min for large file extraction

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Spreadsheets
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  // Text
  "text/plain",
  "text/markdown",
  // Images
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Presentations
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await getWorkspaceContext();
    if (!ctx) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 403 }
      );
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const dealId = formData.get("deal_id") as string | null;
    const category = formData.get("category") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!dealId) {
      return NextResponse.json(
        { error: "deal_id is required" },
        { status: 400 }
      );
    }

    // 3. Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File must be smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
        { status: 413 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not supported` },
        { status: 415 }
      );
    }

    // 4. Upload to Supabase Storage
    const admin = createAdminClient();
    const ext = file.name.split(".").pop() || "bin";
    const fileId = crypto.randomUUID();
    const storagePath = `${ctx.workspaceId}/deals/${dealId}/kb/${fileId}.${ext}`;

    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from("files")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 5. Extract text content from document
    const extraction = await extractTextFromFile(buffer, file.type, file.name);

    // 6. Create file record in DB
    const { data: fileRecord, error: dbError } = await admin
      .from("files")
      .insert({
        workspace_id: ctx.workspaceId,
        original_filename: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        file_size_bytes: file.size,
        uploaded_by: ctx.userId,
        deal_id: dealId,
        category: category?.trim() || null,
        description: description?.trim() || null,
        extracted_text: extraction.text,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up storage on DB failure
      await admin.storage.from("files").remove([storagePath]);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    // 7. Log activity
    await admin.from("activities").insert({
      workspace_id: ctx.workspaceId,
      activity_type: "file_uploaded",
      actor_id: ctx.userId,
      entity_type: "File",
      entity_id: fileRecord.id,
      metadata: {
        filename: file.name,
        category: category || null,
        deal_id: dealId,
        has_extracted_text: !!extraction.text,
        extracted_char_count: extraction.charCount,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...fileRecord,
        extracted_text: undefined, // Don't send full text back to client
      },
      extraction: {
        hasText: !!extraction.text,
        charCount: extraction.charCount,
        wasTruncated: extraction.wasTruncated,
        error: extraction.error || null,
      },
    });
  } catch (error) {
    console.error("[kb-upload] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
