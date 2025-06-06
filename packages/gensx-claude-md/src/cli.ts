#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

async function copyTemplate() {
  try {
    console.log("Installing GenSX Claude template...");

    // Get the directory of the package
    const url = new URL(import.meta.url);
    const dirname = path.dirname(url.pathname);

    // Path to the template directory
    const templateDir = path.join(dirname, "..", "templates");

    // Use current working directory as target
    const targetDir = process.cwd();

    // Source and destination paths
    const source = path.join(templateDir, "CLAUDE.md");
    const destination = path.join(targetDir, "CLAUDE.md");

    // Check if destination file already exists
    let fileExists = false;
    try {
      await fs.access(destination);
      fileExists = true;
    } catch {
      // File doesn't exist
    }

    // If file exists, update only the managed section
    if (fileExists) {
      try {
        const destContent = await fs.readFile(destination, "utf8");
        const sourceContent = await fs.readFile(source, "utf8");

        // If the content is identical to our template, no need to update
        if (destContent === sourceContent) {
          console.log("✅ CLAUDE.md is already up to date.");
          return;
        }

        // Extract the managed section from the source template
        const sourceStartMatch = /<!-- BEGIN_MANAGED_SECTION -->/.exec(
          sourceContent,
        );
        const sourceEndMatch = /<!-- END_MANAGED_SECTION -->/.exec(
          sourceContent,
        );

        if (!sourceStartMatch || !sourceEndMatch) {
          console.error(
            "Error: Source template does not have proper managed section markers",
          );
          return;
        }

        const managedSectionStart = sourceStartMatch.index;
        const managedSectionEnd =
          sourceEndMatch.index + sourceEndMatch[0].length;
        const managedSection = sourceContent.substring(
          managedSectionStart,
          managedSectionEnd,
        );

        // Check if destination file has managed section markers
        const destStartMatch = /<!-- BEGIN_MANAGED_SECTION -->/.exec(
          destContent,
        );
        const destEndMatch = /<!-- END_MANAGED_SECTION -->/.exec(destContent);

        if (destStartMatch && destEndMatch) {
          // If destination has managed section markers, update only that section
          const destStartIndex = destStartMatch.index;
          const destEndIndex = destEndMatch.index + destEndMatch[0].length;

          // Create new content by replacing just the managed section
          const newContent =
            destContent.substring(0, destStartIndex) +
            managedSection +
            destContent.substring(destEndIndex);

          // Write the updated file
          await fs.writeFile(destination, newContent);
          console.log(
            "✅ Updated managed section of CLAUDE.md while preserving your customizations.",
          );
        } else {
          // If destination doesn't have managed section markers, it's from an older version or fully custom
          // Create a backup before replacing
          const backupPath = path.join(targetDir, "CLAUDE.md.backup");
          await fs.copyFile(destination, backupPath);

          // Copy the new template
          await fs.copyFile(source, destination);
          console.log(
            "✅ Updated CLAUDE.md to the latest version with managed sections.",
          );
          console.log(
            "ℹ️ Your previous file was backed up to CLAUDE.md.backup",
          );
          console.log(
            "ℹ️ Add your custom content outside the managed section to preserve it during future updates.",
          );
        }
      } catch (error) {
        console.error("Error updating CLAUDE.md:", error);
      }
    } else {
      // File doesn't exist, create it
      await fs.copyFile(source, destination);
      console.log("✅ Created new CLAUDE.md template in project root.");
    }
  } catch (error) {
    // Handle errors
    console.error("Failed to install Claude template:", error);
    process.exit(1);
  }
}

// Run the script
await copyTemplate();
