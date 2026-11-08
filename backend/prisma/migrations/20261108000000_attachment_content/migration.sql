CREATE TABLE "AttachmentContent" (
    "attachmentId" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,

    CONSTRAINT "AttachmentContent_pkey" PRIMARY KEY ("attachmentId"),
    CONSTRAINT "AttachmentContent_attachmentId_fkey" FOREIGN KEY ("attachmentId")
        REFERENCES "AppointmentAttachment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
