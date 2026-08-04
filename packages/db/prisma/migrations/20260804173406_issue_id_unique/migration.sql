/*
  Warnings:

  - A unique constraint covering the columns `[issueId]` on the table `Comments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Comments_issueId_key" ON "Comments"("issueId");
